import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import Incident from '@/lib/models/Incident';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';
import TrainingProgress from '@/lib/models/TrainingProgress';
import TrainingModule from '@/lib/models/TrainingModule';
import ChatMessage from '@/lib/models/ChatMessage';
import AnonymousReport from '@/lib/models/AnonymousReport';

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

    const orgObjectId = organization._id;

    // Fetch all data in parallel
    const [
      activePlan,
      totalPlans,
      totalIncidents,
      openIncidents,
      totalEmployees,
      activeEmployees,
      trainedEmployees,
      recentActivity,
      totalModules,
      completedProgressCount,
      inProgressCount,
      flaggedQACount,
      pendingFlaggedQACount,
      totalChatMessages,
      totalAnonymousReports,
      newAnonymousReports,
      activeAnonymousReports
    ] = await Promise.all([
      Plan.findOne({ organizationId: orgObjectId, status: 'active' }),
      Plan.countDocuments({ organizationId: orgObjectId }),
      Incident.countDocuments({ organizationId: orgObjectId }),
      Incident.countDocuments({
        organizationId: orgObjectId,
        investigationStatus: { $in: ['pending', 'in_progress'] }
      }),
      Employee.countDocuments({ organizationId: orgObjectId }),
      Employee.countDocuments({ organizationId: orgObjectId, isActive: true }),
      Employee.countDocuments({
        organizationId: orgObjectId,
        isActive: true,
        lastAnnualTrainingCompletedAt: { $ne: null }
      }),
      AuditLog.find({ organizationId: orgObjectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // LMS data
      TrainingModule.countDocuments({ isActive: true }),
      TrainingProgress.countDocuments({ organizationId: orgObjectId, status: 'completed' }),
      TrainingProgress.countDocuments({ organizationId: orgObjectId, status: 'in_progress' }),
      // Q&A data
      ChatMessage.countDocuments({
        organizationId: orgObjectId,
        role: 'assistant',
        'aiMetadata.flaggedForReview': true
      }),
      ChatMessage.countDocuments({
        organizationId: orgObjectId,
        role: 'assistant',
        'aiMetadata.flaggedForReview': true,
        'aiMetadata.reviewedAt': { $exists: false }
      }),
      ChatMessage.countDocuments({
        organizationId: orgObjectId,
        role: 'user'
      }),
      // Anonymous reports data
      AnonymousReport.countDocuments({ organizationId: orgObjectId }),
      AnonymousReport.countDocuments({ organizationId: orgObjectId, status: 'new' }),
      AnonymousReport.countDocuments({
        organizationId: orgObjectId,
        status: { $in: ['under_review', 'investigating'] }
      })
    ]);

    // Calculate compliance score
    const scores = {
      wvpp: 0,
      training: 0,
      annualReview: 0,
      incidentLog: 0
    };

    // WVPP Status (25%) - active plan exists
    if (activePlan) {
      scores.wvpp = 100;
    }

    // Training Compliance (25%) - percentage of active employees trained
    if (activeEmployees > 0) {
      scores.training = Math.round((trainedEmployees / activeEmployees) * 100);
    } else {
      // No employees yet — not penalized
      scores.training = activePlan ? 100 : 0;
    }

    // Annual Review (25%) - plan reviewed within last year
    const now = new Date();
    if (organization.nextPlanReviewDueDate) {
      if (new Date(organization.nextPlanReviewDueDate) > now) {
        scores.annualReview = 100;
      } else {
        // Overdue — partial credit if reviewed in last 18 months
        const eighteenMonthsAgo = new Date();
        eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
        if (organization.lastPlanReviewDate && new Date(organization.lastPlanReviewDate) > eighteenMonthsAgo) {
          scores.annualReview = 50;
        }
      }
    } else if (activePlan) {
      // Has an active plan but no review scheduled — partial credit
      scores.annualReview = 50;
    }

    // Incident Log (25%) - all incidents investigated
    if (totalIncidents === 0) {
      // No incidents — full credit (nothing to investigate)
      scores.incidentLog = 100;
    } else {
      const investigatedIncidents = totalIncidents - openIncidents;
      scores.incidentLog = Math.round((investigatedIncidents / totalIncidents) * 100);
    }

    const overallScore = Math.round(
      (scores.wvpp + scores.training + scores.annualReview + scores.incidentLog) / 4
    );

    // Build upcoming deadlines
    const deadlines = [];

    if (organization.nextPlanReviewDueDate) {
      const reviewDate = new Date(organization.nextPlanReviewDueDate);
      const daysUntil = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));
      deadlines.push({
        type: 'annual_review',
        label: 'Annual Plan Review',
        date: organization.nextPlanReviewDueDate,
        daysUntil,
        overdue: daysUntil < 0
      });
    }

    if (organization.nextTrainingDueDate) {
      const trainingDate = new Date(organization.nextTrainingDueDate);
      const daysUntil = Math.ceil((trainingDate - now) / (1000 * 60 * 60 * 24));
      deadlines.push({
        type: 'training_due',
        label: 'Training Due',
        date: organization.nextTrainingDueDate,
        daysUntil,
        overdue: daysUntil < 0
      });
    }

    // Sort deadlines by date (soonest first)
    deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build alerts
    const alerts = [];
    if (!activePlan) {
      alerts.push({
        level: 'critical',
        message: 'No active WVPP. Create and publish a plan to comply with SB 553.'
      });
    }
    if (scores.annualReview === 0 && activePlan) {
      alerts.push({
        level: 'critical',
        message: 'Annual plan review is overdue.'
      });
    }
    if (openIncidents > 0) {
      alerts.push({
        level: 'warning',
        message: `${openIncidents} incident${openIncidents > 1 ? 's' : ''} pending investigation.`
      });
    }
    if (activeEmployees > 0 && trainedEmployees < activeEmployees) {
      const untrained = activeEmployees - trainedEmployees;
      alerts.push({
        level: 'warning',
        message: `${untrained} employee${untrained > 1 ? 's' : ''} have not completed training.`
      });
    }
    if (pendingFlaggedQACount > 0) {
      alerts.push({
        level: 'critical',
        message: `${pendingFlaggedQACount} flagged Q&A response${pendingFlaggedQACount > 1 ? 's' : ''} pending review.`
      });
    }
    if (newAnonymousReports > 0) {
      alerts.push({
        level: 'critical',
        message: `${newAnonymousReports} new anonymous report${newAnonymousReports > 1 ? 's' : ''} require attention.`
      });
    }
    for (const d of deadlines) {
      if (d.overdue) {
        alerts.push({ level: 'critical', message: `${d.label} is overdue.` });
      } else if (d.daysUntil <= 30) {
        alerts.push({
          level: 'info',
          message: `${d.label} due in ${d.daysUntil} day${d.daysUntil !== 1 ? 's' : ''}.`
        });
      }
    }

    return NextResponse.json({
      organization: {
        name: organization.name,
        industry: organization.industry,
        plan: organization.plan
      },
      compliance: {
        overall: overallScore,
        scores
      },
      stats: {
        activePlan: !!activePlan,
        activePlanVersion: activePlan?.version || null,
        totalPlans,
        totalIncidents,
        openIncidents,
        totalEmployees,
        activeEmployees,
        trainedEmployees,
        // LMS stats
        totalModules,
        completedModuleProgress: completedProgressCount,
        inProgressModuleProgress: inProgressCount,
        // Q&A stats
        totalChatMessages,
        flaggedQA: flaggedQACount,
        pendingFlaggedQA: pendingFlaggedQACount,
        // Anonymous reports stats
        totalAnonymousReports,
        newAnonymousReports,
        activeAnonymousReports
      },
      alerts,
      deadlines,
      recentActivity: recentActivity.map((log) => ({
        id: log._id,
        action: log.action,
        resourceType: log.resourceType,
        details: log.details,
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
