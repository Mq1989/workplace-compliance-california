import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Employee from '@/lib/models/Employee';
import Organization from '@/lib/models/Organization';
import TrainingModule from '@/lib/models/TrainingModule';
import TrainingProgress from '@/lib/models/TrainingProgress';

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

    // Find the employee record for the current user
    const employee = await Employee.findOne({
      organizationId: orgObjectId,
      clerkUserId: userId,
      isActive: true
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // Fetch training modules and progress in parallel
    const [modules, progressRecords] = await Promise.all([
      TrainingModule.find({ isActive: true }).sort({ order: 1 }).lean(),
      TrainingProgress.find({
        organizationId: orgObjectId,
        employeeId: employee._id
      }).lean()
    ]);

    // Build progress map by moduleId
    const progressMap = {};
    for (const p of progressRecords) {
      progressMap[p.moduleId.toString()] = p;
    }

    // Build module progress list
    const moduleProgress = modules.map((mod) => {
      const progress = progressMap[mod._id.toString()];
      return {
        _id: mod._id,
        moduleId: mod.moduleId,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        category: mod.category,
        videoDurationMinutes: mod.videoDurationMinutes || 0,
        hasQuiz: mod.hasQuiz,
        status: progress?.status || 'not_started',
        videoProgress: progress?.videoProgress || 0,
        videoCompleted: progress?.videoCompleted || false,
        quizPassed: progress?.quizPassed || false,
        bestScore: progress?.bestScore || 0,
        completedAt: progress?.completedAt || null
      };
    });

    // Calculate summary stats
    const totalModules = modules.length;
    const completedModules = moduleProgress.filter(
      (m) => m.status === 'completed'
    ).length;
    const inProgressModules = moduleProgress.filter(
      (m) => m.status === 'in_progress'
    ).length;
    const overallProgress =
      totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Find the next module to work on
    const nextModule =
      moduleProgress.find((m) => m.status === 'in_progress') ||
      moduleProgress.find((m) => m.status === 'not_started') ||
      null;

    // Training completion status
    const trainingComplete = totalModules > 0 && completedModules === totalModules;

    return NextResponse.json({
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        jobTitle: employee.jobTitle,
        department: employee.department,
        hireDate: employee.hireDate,
        hasCompletedQA: employee.hasCompletedQA,
        wvppAcknowledgedAt: employee.wvppAcknowledgedAt
      },
      organization: {
        name: organization.name
      },
      training: {
        totalModules,
        completedModules,
        inProgressModules,
        overallProgress,
        trainingComplete,
        nextModule,
        modules: moduleProgress
      }
    });
  } catch (error) {
    console.error('Error fetching portal dashboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
