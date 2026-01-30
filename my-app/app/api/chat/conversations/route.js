import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import ChatMessage from '@/lib/models/ChatMessage';

export async function GET() {
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

    // Get distinct conversation IDs for this employee
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          organizationId: organization._id,
          employeeId: employee._id
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$content' },
          lastRole: { $first: '$role' },
          lastMessageAt: { $first: '$createdAt' },
          messageCount: { $sum: 1 },
          hasFlagged: {
            $max: {
              $cond: ['$aiMetadata.flaggedForReview', true, false]
            }
          }
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      },
      {
        $limit: 50
      }
    ]);

    // Get the first user message for each conversation to use as title
    const conversationIds = conversations.map((c) => c._id);
    const firstMessages = await ChatMessage.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          role: 'user'
        }
      },
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: '$conversationId',
          firstUserMessage: { $first: '$content' }
        }
      }
    ]);

    const firstMessageMap = {};
    for (const fm of firstMessages) {
      firstMessageMap[fm._id] = fm.firstUserMessage;
    }

    const result = conversations.map((conv) => ({
      conversationId: conv._id,
      title: firstMessageMap[conv._id]
        ? firstMessageMap[conv._id].substring(0, 100)
        : 'Conversation',
      lastMessage: conv.lastMessage?.substring(0, 150) || '',
      lastRole: conv.lastRole,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv.messageCount,
      hasFlagged: conv.hasFlagged
    }));

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
