import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import AnonymousReport from '@/lib/models/AnonymousReport';
import AnonymousThread from '@/lib/models/AnonymousThread';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request, { params }) {
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
    }).lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch all thread messages
    const threadMessages = await AnonymousThread.find({ reportId: report._id })
      .sort({ createdAt: 1 })
      .lean();

    // Mark reporter responses as read by admin
    await AnonymousThread.updateMany(
      {
        reportId: report._id,
        messageType: 'reporter_response',
        readByAdmin: false
      },
      { readByAdmin: true }
    );

    return NextResponse.json({
      report: {
        _id: report._id,
        anonymousId: report.anonymousId,
        reportType: report.reportType,
        title: report.title,
        description: report.description,
        status: report.status,
        priority: report.priority,
        incidentDate: report.incidentDate,
        incidentLocation: report.incidentLocation,
        witnessesPresent: report.witnessesPresent,
        assignedTo: report.assignedTo,
        resolution: report.resolution,
        resolvedAt: report.resolvedAt,
        internalNotes: report.internalNotes,
        linkedIncidentId: report.linkedIncidentId,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      },
      thread: threadMessages.map((msg) => ({
        _id: msg._id,
        messageType: msg.messageType,
        content: msg.content,
        adminName: msg.adminName,
        readByAdmin: msg.readByAdmin,
        readByReporter: msg.readByReporter,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching anonymous report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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
    const allowedFields = ['status', 'priority', 'assignedTo', 'resolution', 'linkedIncidentId'];
    const updates = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }

    // If resolving, set resolvedAt
    if (updates.status === 'resolved' || updates.status === 'closed') {
      updates.resolvedAt = new Date();
    }

    // Add internal note if provided
    if (data.internalNote) {
      if (!updates.$push) updates.$push = {};
      updates.$push = {
        internalNotes: {
          note: data.internalNote,
          addedBy: userId,
          addedAt: new Date()
        }
      };
    }

    // Separate $push from $set
    const updateOps = {};
    if (updates.$push) {
      updateOps.$push = updates.$push;
      delete updates.$push;
    }
    if (Object.keys(updates).length > 0) {
      updateOps.$set = updates;
    }

    const updatedReport = await AnonymousReport.findByIdAndUpdate(
      id,
      updateOps,
      { new: true }
    ).lean();

    // Audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'anonymous_report_updated',
      resourceType: 'anonymous_report',
      resourceId: report._id,
      details: {
        anonymousId: report.anonymousId,
        fieldsUpdated: Object.keys(data)
      }
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Error updating anonymous report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
