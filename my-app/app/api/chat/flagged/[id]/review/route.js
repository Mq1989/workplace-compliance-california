import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import ChatMessage from '@/lib/models/ChatMessage';
import AuditLog from '@/lib/models/AuditLog';

export async function PUT(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: messageId } = await params;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
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

    const data = await request.json();
    const { reviewNotes } = data;

    // Find the flagged message
    const chatMessage = await ChatMessage.findOne({
      _id: messageId,
      organizationId: organization._id,
      'aiMetadata.flaggedForReview': true
    });

    if (!chatMessage) {
      return NextResponse.json(
        { error: 'Flagged message not found' },
        { status: 404 }
      );
    }

    // Mark as reviewed
    chatMessage.aiMetadata.reviewedBy = userId;
    chatMessage.aiMetadata.reviewedAt = new Date();
    if (reviewNotes) {
      chatMessage.aiMetadata.reviewNotes = reviewNotes;
    }

    await chatMessage.save();

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'chat_message_reviewed',
      resourceType: 'chat',
      resourceId: chatMessage._id,
      details: {
        conversationId: chatMessage.conversationId,
        flagReason: chatMessage.aiMetadata.flagReason,
        reviewNotes: reviewNotes || null
      }
    });

    return NextResponse.json({
      _id: chatMessage._id,
      reviewedBy: userId,
      reviewedAt: chatMessage.aiMetadata.reviewedAt,
      reviewNotes: chatMessage.aiMetadata.reviewNotes
    });
  } catch (error) {
    console.error('Error reviewing flagged message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
