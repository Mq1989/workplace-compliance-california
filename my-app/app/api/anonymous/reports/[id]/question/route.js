import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import AnonymousReport from '@/lib/models/AnonymousReport';
import AnonymousThread from '@/lib/models/AnonymousThread';
import AuditLog from '@/lib/models/AuditLog';

export async function POST(request, { params }) {
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

    const { id } = await params;

    const report = await AnonymousReport.findOne({
      _id: id,
      organizationId: organization._id
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const data = await request.json();
    const { content, messageType, adminName } = data;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    // Default to admin_question if not specified, validate if specified
    const validTypes = ['admin_question', 'admin_update'];
    const type = messageType || 'admin_question';
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'messageType must be admin_question or admin_update' },
        { status: 400 }
      );
    }

    const threadMessage = await AnonymousThread.create({
      reportId: report._id,
      messageType: type,
      content: content.trim(),
      adminUserId: userId,
      adminName: adminName || 'Management',
      readByAdmin: true,
      readByReporter: false
    });

    // If report is still "new", move to "under_review"
    if (report.status === 'new') {
      await AnonymousReport.findByIdAndUpdate(report._id, {
        status: 'under_review'
      });
    }

    // Audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'anonymous_report_responded',
      resourceType: 'anonymous_report',
      resourceId: report._id,
      details: {
        anonymousId: report.anonymousId,
        messageType: type,
        threadMessageId: threadMessage._id
      }
    });

    return NextResponse.json({
      message: {
        _id: threadMessage._id,
        messageType: threadMessage.messageType,
        content: threadMessage.content,
        adminName: threadMessage.adminName,
        createdAt: threadMessage.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error posting question to anonymous report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
