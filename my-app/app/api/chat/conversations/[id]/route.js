import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import ChatMessage from '@/lib/models/ChatMessage';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
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

    // Fetch all messages in the conversation
    const messages = await ChatMessage.find({
      conversationId,
      organizationId: organization._id,
      employeeId: employee._id
    })
      .sort({ createdAt: 1 })
      .lean();

    if (!messages.length) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const result = messages.map((msg) => ({
      _id: msg._id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      flaggedForReview: msg.aiMetadata?.flaggedForReview || false
    }));

    return NextResponse.json({
      conversationId,
      messages: result
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
