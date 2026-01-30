import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import ChatMessage from '@/lib/models/ChatMessage';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'reviewed', or null for all
    const category = searchParams.get('category');

    // Build query for flagged assistant messages
    const query = {
      organizationId: organization._id,
      role: 'assistant',
      'aiMetadata.flaggedForReview': true
    };

    if (status === 'pending') {
      query['aiMetadata.reviewedAt'] = { $exists: false };
    } else if (status === 'reviewed') {
      query['aiMetadata.reviewedAt'] = { $exists: true };
    }

    if (category) {
      query['aiMetadata.questionCategory'] = category;
    }

    const flaggedMessages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('employeeId', 'firstName lastName email')
      .lean();

    // For each flagged message, also get the preceding user message
    const conversationIds = [...new Set(flaggedMessages.map((m) => m.conversationId))];

    const userMessages = await ChatMessage.find({
      conversationId: { $in: conversationIds },
      role: 'user'
    })
      .sort({ createdAt: -1 })
      .lean();

    // Build a map of conversationId -> last user message before each flagged message
    const userMessageMap = {};
    for (const um of userMessages) {
      if (!userMessageMap[um.conversationId]) {
        userMessageMap[um.conversationId] = [];
      }
      userMessageMap[um.conversationId].push(um);
    }

    const result = flaggedMessages.map((msg) => {
      // Find the user message that preceded this assistant message
      const convUserMessages = userMessageMap[msg.conversationId] || [];
      const precedingUserMessage = convUserMessages.find(
        (um) => um.createdAt < msg.createdAt
      ) || convUserMessages[convUserMessages.length - 1];

      return {
        _id: msg._id,
        conversationId: msg.conversationId,
        content: msg.content,
        createdAt: msg.createdAt,
        employee: msg.employeeId
          ? {
              _id: msg.employeeId._id,
              name: `${msg.employeeId.firstName} ${msg.employeeId.lastName}`,
              email: msg.employeeId.email
            }
          : null,
        userQuestion: precedingUserMessage?.content || null,
        aiMetadata: {
          questionCategory: msg.aiMetadata?.questionCategory,
          flagReason: msg.aiMetadata?.flagReason,
          flaggedForReview: msg.aiMetadata?.flaggedForReview,
          reviewedBy: msg.aiMetadata?.reviewedBy,
          reviewedAt: msg.aiMetadata?.reviewedAt,
          reviewNotes: msg.aiMetadata?.reviewNotes,
          responseTimeMs: msg.aiMetadata?.responseTimeMs,
          model: msg.aiMetadata?.model
        }
      };
    });

    // Summary counts
    const totalFlagged = await ChatMessage.countDocuments({
      organizationId: organization._id,
      role: 'assistant',
      'aiMetadata.flaggedForReview': true
    });

    const pendingReview = await ChatMessage.countDocuments({
      organizationId: organization._id,
      role: 'assistant',
      'aiMetadata.flaggedForReview': true,
      'aiMetadata.reviewedAt': { $exists: false }
    });

    return NextResponse.json({
      flaggedMessages: result,
      summary: {
        total: totalFlagged,
        pendingReview,
        reviewed: totalFlagged - pendingReview
      }
    });
  } catch (error) {
    console.error('Error fetching flagged messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
