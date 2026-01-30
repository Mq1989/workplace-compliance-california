import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Incident from '@/lib/models/Incident';
import Employee from '@/lib/models/Employee';
import Plan from '@/lib/models/Plan';
import Document from '@/lib/models/Document';
import AuditLog from '@/lib/models/AuditLog';
import { generateIncidentLog } from '@/lib/pdf/generateIncidentLog';
import { generateTrainingCertificate } from '@/lib/pdf/generateTrainingCertificate';
import { generateComplianceReport } from '@/lib/pdf/generateComplianceReport';

const SUPPORTED_TYPES = ['incident_log', 'training_certificate', 'compliance_report'];

export async function POST(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;

    if (!SUPPORTED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Unsupported document type: ${type}. Supported: ${SUPPORTED_TYPES.join(', ')}` },
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

    const body = await request.json().catch(() => ({}));
    let pdfBuffer;
    let fileName;
    let metadata = {};

    const orgName = (organization.name || 'Organization').replace(/[^a-zA-Z0-9-_ ]/g, '');
    const dateStr = new Date().toISOString().slice(0, 10);

    if (type === 'incident_log') {
      const dateRange = {};
      if (body.startDate) dateRange.start = new Date(body.startDate);
      if (body.endDate) dateRange.end = new Date(body.endDate);

      const query = { organizationId: organization._id };
      if (dateRange.start || dateRange.end) {
        query.incidentDate = {};
        if (dateRange.start) query.incidentDate.$gte = dateRange.start;
        if (dateRange.end) query.incidentDate.$lte = dateRange.end;
      }

      const incidents = await Incident.find(query)
        .sort({ incidentDate: -1 })
        .lean();

      pdfBuffer = generateIncidentLog(incidents, organization.toObject(), dateRange);
      fileName = `Incident-Log-${orgName}-${dateStr}.pdf`;
      metadata = {
        incidentCount: incidents.length,
        dateRange
      };

    } else if (type === 'training_certificate') {
      if (!body.employeeId) {
        return NextResponse.json(
          { error: 'employeeId is required for training_certificate' },
          { status: 400 }
        );
      }

      const employee = await Employee.findOne({
        _id: body.employeeId,
        organizationId: organization._id
      }).lean();

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      const completionDate = body.completionDate
        ? new Date(body.completionDate)
        : employee.lastAnnualTrainingCompletedAt || new Date();

      pdfBuffer = generateTrainingCertificate(employee, organization.toObject(), completionDate);
      const empName = `${employee.firstName}-${employee.lastName}`.replace(/[^a-zA-Z0-9-_]/g, '');
      fileName = `Training-Certificate-${empName}-${dateStr}.pdf`;
      metadata = {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        completionDate
      };

    } else if (type === 'compliance_report') {
      // Build compliance scores and stats
      const [
        activePlan,
        totalIncidents,
        openIncidents,
        completedInvestigations,
        recentIncidents,
        activeEmployees,
        trainedEmployees
      ] = await Promise.all([
        Plan.findOne({ organizationId: organization._id, status: 'active' }).lean(),
        Incident.countDocuments({ organizationId: organization._id }),
        Incident.countDocuments({
          organizationId: organization._id,
          investigationStatus: { $in: ['pending', 'in_progress'] }
        }),
        Incident.countDocuments({
          organizationId: organization._id,
          investigationStatus: 'completed'
        }),
        Incident.find({ organizationId: organization._id })
          .sort({ incidentDate: -1 })
          .limit(5)
          .lean(),
        Employee.countDocuments({ organizationId: organization._id, isActive: true }),
        Employee.countDocuments({
          organizationId: organization._id,
          isActive: true,
          lastAnnualTrainingCompletedAt: { $ne: null }
        })
      ]);

      // Calculate scores (same logic as dashboard API)
      const scores = { wvpp: 0, training: 0, annualReview: 0, incidentLog: 0 };

      if (activePlan) scores.wvpp = 100;

      if (activeEmployees > 0) {
        scores.training = Math.round((trainedEmployees / activeEmployees) * 100);
      } else {
        scores.training = activePlan ? 100 : 0;
      }

      const now = new Date();
      if (organization.nextPlanReviewDueDate) {
        if (new Date(organization.nextPlanReviewDueDate) > now) {
          scores.annualReview = 100;
        } else {
          const eighteenMonthsAgo = new Date();
          eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
          if (organization.lastPlanReviewDate && new Date(organization.lastPlanReviewDate) > eighteenMonthsAgo) {
            scores.annualReview = 50;
          }
        }
      } else if (activePlan) {
        scores.annualReview = 50;
      }

      if (totalIncidents === 0) {
        scores.incidentLog = 100;
      } else {
        const investigated = totalIncidents - openIncidents;
        scores.incidentLog = Math.round((investigated / totalIncidents) * 100);
      }

      scores.overall = Math.round(
        (scores.wvpp + scores.training + scores.annualReview + scores.incidentLog) / 4
      );

      // Build deadlines
      const deadlines = [];
      if (organization.nextPlanReviewDueDate) {
        const reviewDate = new Date(organization.nextPlanReviewDueDate);
        const daysUntil = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));
        deadlines.push({
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
          label: 'Training Due',
          date: organization.nextTrainingDueDate,
          daysUntil,
          overdue: daysUntil < 0
        });
      }

      const overdueTraining = activeEmployees > 0
        ? await Employee.countDocuments({
            organizationId: organization._id,
            isActive: true,
            nextTrainingDueDate: { $lt: now, $ne: null }
          })
        : 0;

      const trainingCompletionRate = activeEmployees > 0
        ? Math.round((trainedEmployees / activeEmployees) * 100)
        : 0;

      const stats = {
        totalEmployees: activeEmployees,
        employeesTrained: trainedEmployees,
        trainingCompletionRate,
        overdueTraining,
        totalIncidents,
        openInvestigations: openIncidents,
        completedInvestigations,
        recentIncidents,
        deadlines
      };

      pdfBuffer = generateComplianceReport(organization.toObject(), scores, stats);
      fileName = `Compliance-Report-${orgName}-${dateStr}.pdf`;
      metadata = {
        overallScore: scores.overall,
        scores
      };
    }

    // Store as base64 data URL (MVP approach per implementation plan)
    const base64 = Buffer.from(pdfBuffer).toString('base64');
    const fileUrl = `data:application/pdf;base64,${base64}`;

    // Create Document record
    const doc = await Document.create({
      organizationId: organization._id,
      type: type === 'incident_log' ? 'incident_log_export' : type,
      fileName,
      fileUrl,
      fileSize: pdfBuffer.length,
      mimeType: 'application/pdf',
      generatedBy: userId,
      generatedAt: new Date(),
      dateRangeStart: metadata.dateRange?.start,
      dateRangeEnd: metadata.dateRange?.end,
      employeeId: metadata.employeeId,
      metadata
    });

    // Create audit log
    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'document_generated',
      resourceType: 'document',
      resourceId: doc._id,
      details: { documentType: type, fileName }
    });

    return NextResponse.json({
      _id: doc._id,
      type: doc.type,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      generatedAt: doc.generatedAt,
      metadata: doc.metadata
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
