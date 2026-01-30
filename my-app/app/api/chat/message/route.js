import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import Plan from '@/lib/models/Plan';
import ChatMessage from '@/lib/models/ChatMessage';
import AuditLog from '@/lib/models/AuditLog';
import { getOpenAI } from '@/lib/openai/client';
import { buildSystemPrompt } from '@/lib/openai/buildSystemPrompt';
import { shouldFlagForReview, classifyQuestionCategory } from '@/lib/openai/classifyComplexity';

export async function POST(request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const employee = await Employee.findOne({
      organizationId: organization._id,
      clerkUserId: userId,
      isActive: true
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    const data = await request.json();
    const { message, conversationId: existingConversationId } = data;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    // Use existing conversation ID or generate a new one
    const conversationId = existingConversationId || crypto.randomUUID();

    // Load conversation history for context (last 10 messages)
    const previousMessages = await ChatMessage.find({
      conversationId,
      organizationId: organization._id
    })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    // Fetch the active WVPP plan for RAG context
    const activePlan = await Plan.findOne({
      organizationId: organization._id,
      status: 'active'
    }).lean();

    // Build system prompt with WVPP context
    const systemPrompt = buildSystemPrompt(organization.name, activePlan);

    // Build the messages array for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    for (const msg of previousMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        openaiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the new user message
    openaiMessages.push({ role: 'user', content: trimmedMessage });

    // Save the user message
    const userMessage = await ChatMessage.create({
      organizationId: organization._id,
      employeeId: employee._id,
      conversationId,
      role: 'user',
      content: trimmedMessage,
      countedAsQAInteraction: true
    });

    // Call OpenAI
    const startTime = Date.now();
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1024
    });
    const responseTimeMs = Date.now() - startTime;

    const aiContent = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    // Classify the interaction
    const flagResult = shouldFlagForReview(trimmedMessage, aiContent);
    const questionCategory = classifyQuestionCategory(trimmedMessage);

    // Save the assistant message with metadata
    const assistantMessage = await ChatMessage.create({
      organizationId: organization._id,
      employeeId: employee._id,
      conversationId,
      role: 'assistant',
      content: aiContent,
      aiMetadata: {
        model: 'gpt-4o-mini',
        tokens: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        },
        responseTimeMs,
        questionCategory,
        flaggedForReview: flagResult.flag,
        flagReason: flagResult.reason
      },
      countedAsQAInteraction: true
    });

    // Log audit entries
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'chat_message_sent',
      resourceType: 'chat',
      resourceId: userMessage._id,
      details: {
        employeeId: employee._id,
        conversationId,
        questionCategory
      }
    });

    if (flagResult.flag) {
      await AuditLog.create({
        organizationId: organization._id,
        userId,
        action: 'chat_message_flagged',
        resourceType: 'chat',
        resourceId: assistantMessage._id,
        details: {
          employeeId: employee._id,
          conversationId,
          flagReason: flagResult.reason
        }
      });
    }

    // Update employee Q&A tracking
    if (!employee.hasCompletedQA) {
      await Employee.findByIdAndUpdate(employee._id, {
        hasCompletedQA: true,
        qaCompletedAt: new Date()
      });
    }

    return NextResponse.json({
      conversationId,
      userMessage: {
        _id: userMessage._id,
        role: 'user',
        content: userMessage.content,
        createdAt: userMessage.createdAt
      },
      assistantMessage: {
        _id: assistantMessage._id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
        flaggedForReview: flagResult.flag
      }
    });
  } catch (error) {
    console.error('Error in chat message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
