import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import TrainingModule from '@/lib/models/TrainingModule';
import TrainingProgress from '@/lib/models/TrainingProgress';
import TrainingRecord from '@/lib/models/TrainingRecord';
import AuditLog from '@/lib/models/AuditLog';

export async function POST(request) {
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

    const data = await request.json();
    const { acknowledgment } = data;

    // Fetch all active modules and employee's progress
    const [modules, progressRecords] = await Promise.all([
      TrainingModule.find({ isActive: true }).sort({ order: 1 }).lean(),
      TrainingProgress.find({
        organizationId: organization._id,
        employeeId: employee._id
      }).lean()
    ]);

    // Build progress map
    const progressMap = {};
    for (const p of progressRecords) {
      progressMap[p.moduleId.toString()] = p;
    }

    // Verify all required modules are completed
    const incompleteModules = modules.filter((mod) => {
      if (!mod.isRequired) return false;
      const progress = progressMap[mod._id.toString()];
      return !progress || progress.status !== 'completed';
    });

    if (incompleteModules.length > 0) {
      return NextResponse.json(
        {
          error: 'Not all required modules are completed',
          incompleteModules: incompleteModules.map((m) => ({
            _id: m._id,
            title: m.title,
            order: m.order
          }))
        },
        { status: 400 }
      );
    }

    // Determine training type
    const isInitial = !employee.initialTrainingCompletedAt;
    const trainingType = isInitial ? 'initial' : 'annual';
    const now = new Date();

    // Create a compliance training record
    const record = await TrainingRecord.create({
      organizationId: organization._id,
      employeeId: employee._id,
      trainingDate: now,
      trainingType,
      moduleId: 'sb553-full-training',
      moduleName: 'SB 553 Workplace Violence Prevention Training',
      contentSummary: modules.map((m) => m.title).join('; '),
      trainerName: 'SafeWorkCA LMS',
      trainerQualifications: 'Automated training platform',
      startedAt: employee.trainingPath?.startedAt || now,
      completedAt: now,
      durationMinutes: modules.reduce(
        (sum, m) => sum + (m.videoDurationMinutes || 0),
        0
      ),
      quizScore: Math.round(
        progressRecords.reduce((sum, p) => sum + (p.bestScore || 0), 0) /
          progressRecords.length
      ),
      quizPassed: true,
      employeeAcknowledged: !!acknowledgment,
      acknowledgedAt: acknowledgment ? now : undefined
    });

    // Update employee training tracking
    const nextDue = new Date(now);
    nextDue.setFullYear(nextDue.getFullYear() + 1);

    const employeeUpdate = {
      'trainingPath.completedAt': now,
      lastAnnualTrainingCompletedAt: now,
      nextTrainingDueDate: nextDue
    };

    if (isInitial) {
      employeeUpdate.initialTrainingCompletedAt = now;
    }

    await Employee.findByIdAndUpdate(employee._id, { $set: employeeUpdate });

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'training_completed',
      resourceType: 'training',
      resourceId: record._id,
      details: {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        trainingType,
        modulesCompleted: modules.length,
        averageScore: record.quizScore
      }
    });

    return NextResponse.json(
      {
        trainingRecord: record,
        trainingType,
        completedAt: now,
        nextDueDate: nextDue
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error completing training:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
