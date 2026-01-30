import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AnonymousReport from '@/lib/models/AnonymousReport';
import AnonymousThread from '@/lib/models/AnonymousThread';

export async function POST(request) {
  try {
    await dbConnect();

    const data = await request.json();
    const { anonymousId, accessToken } = data;

    if (!anonymousId || !accessToken) {
      return NextResponse.json(
        { error: 'anonymousId and accessToken are required' },
        { status: 400 }
      );
    }

    // Find report by anonymousId
    const report = await AnonymousReport.findOne({ anonymousId }).lean();
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

    // Fetch thread messages (visible to reporter)
    const threadMessages = await AnonymousThread.find({
      reportId: report._id,
      messageType: { $in: ['admin_question', 'reporter_response', 'admin_update'] }
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark admin messages as read by reporter
    await AnonymousThread.updateMany(
      {
        reportId: report._id,
        messageType: { $in: ['admin_question', 'admin_update'] },
        readByReporter: false
      },
      { readByReporter: true }
    );

    return NextResponse.json({
      report: {
        anonymousId: report.anonymousId,
        reportType: report.reportType,
        title: report.title,
        description: report.description,
        status: report.status,
        priority: report.priority,
        incidentDate: report.incidentDate,
        incidentLocation: report.incidentLocation,
        resolution: report.status === 'resolved' || report.status === 'closed'
          ? report.resolution
          : undefined,
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt
      },
      thread: threadMessages.map((msg) => ({
        _id: msg._id,
        messageType: msg.messageType,
        content: msg.content,
        adminName: msg.adminName || undefined,
        readByReporter: msg.readByReporter,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error checking anonymous report status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
