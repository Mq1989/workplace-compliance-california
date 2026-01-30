import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AnonymousReport from '@/lib/models/AnonymousReport';
import AnonymousThread from '@/lib/models/AnonymousThread';

export async function POST(request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { anonymousId, accessToken, content } = data;

    if (!anonymousId || !accessToken || !content) {
      return NextResponse.json(
        { error: 'anonymousId, accessToken, and content are required' },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'content must be a non-empty string' },
        { status: 400 }
      );
    }

    // Find report by anonymousId
    const report = await AnonymousReport.findOne({ anonymousId });
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Verify access token
    const tokenHash = AnonymousReport.hashToken(accessToken);
    if (tokenHash !== report.accessTokenHash) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 403 }
      );
    }

    // Do not allow responses on closed reports
    if (report.status === 'closed') {
      return NextResponse.json(
        { error: 'This report has been closed and no longer accepts responses' },
        { status: 400 }
      );
    }

    // Create the thread message
    const threadMessage = await AnonymousThread.create({
      reportId: report._id,
      messageType: 'reporter_response',
      content: content.trim(),
      readByAdmin: false,
      readByReporter: true
    });

    return NextResponse.json({
      message: {
        _id: threadMessage._id,
        messageType: threadMessage.messageType,
        content: threadMessage.content,
        createdAt: threadMessage.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error responding to anonymous report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
