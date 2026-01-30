import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import AnonymousReport from '@/lib/models/AnonymousReport';
import AnonymousThread from '@/lib/models/AnonymousThread';

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
    const status = searchParams.get('status');
    const reportType = searchParams.get('reportType');
    const priority = searchParams.get('priority');

    // Build query
    const query = { organizationId: organization._id };

    if (status) {
      query.status = status;
    }
    if (reportType) {
      query.reportType = reportType;
    }
    if (priority) {
      query.priority = priority;
    }

    const reports = await AnonymousReport.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Get unread thread counts for each report
    const reportIds = reports.map((r) => r._id);
    const unreadCounts = await AnonymousThread.aggregate([
      {
        $match: {
          reportId: { $in: reportIds },
          messageType: 'reporter_response',
          readByAdmin: false
        }
      },
      {
        $group: {
          _id: '$reportId',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = {};
    for (const item of unreadCounts) {
      unreadMap[item._id.toString()] = item.count;
    }

    // Get thread message counts
    const threadCounts = await AnonymousThread.aggregate([
      {
        $match: { reportId: { $in: reportIds } }
      },
      {
        $group: {
          _id: '$reportId',
          count: { $sum: 1 }
        }
      }
    ]);

    const threadCountMap = {};
    for (const item of threadCounts) {
      threadCountMap[item._id.toString()] = item.count;
    }

    const result = reports.map((report) => ({
      _id: report._id,
      anonymousId: report.anonymousId,
      reportType: report.reportType,
      title: report.title,
      description: report.description,
      status: report.status,
      priority: report.priority,
      incidentDate: report.incidentDate,
      incidentLocation: report.incidentLocation,
      assignedTo: report.assignedTo,
      resolution: report.resolution,
      resolvedAt: report.resolvedAt,
      linkedIncidentId: report.linkedIncidentId,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      threadCount: threadCountMap[report._id.toString()] || 0,
      unreadResponses: unreadMap[report._id.toString()] || 0
    }));

    // Summary counts
    const totalReports = await AnonymousReport.countDocuments({
      organizationId: organization._id
    });
    const newReports = await AnonymousReport.countDocuments({
      organizationId: organization._id,
      status: 'new'
    });
    const underReview = await AnonymousReport.countDocuments({
      organizationId: organization._id,
      status: { $in: ['under_review', 'investigating'] }
    });
    const resolved = await AnonymousReport.countDocuments({
      organizationId: organization._id,
      status: { $in: ['resolved', 'closed'] }
    });

    return NextResponse.json({
      reports: result,
      summary: {
        total: totalReports,
        new: newReports,
        active: underReview,
        resolved
      }
    });
  } catch (error) {
    console.error('Error fetching anonymous reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
