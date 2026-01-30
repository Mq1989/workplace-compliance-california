import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
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

    const orgId_ = organization._id;

    // Fetch modules, employees, and all progress in parallel
    const [modules, employees, allProgress] = await Promise.all([
      TrainingModule.find({ isActive: true }).sort({ order: 1 }).lean(),
      Employee.find({ organizationId: orgId_, isActive: true })
        .sort({ lastName: 1, firstName: 1 })
        .lean(),
      TrainingProgress.find({ organizationId: orgId_ }).lean()
    ]);

    // Build progress lookup: employeeId -> moduleId -> progress
    const progressLookup = {};
    for (const p of allProgress) {
      const empKey = p.employeeId.toString();
      if (!progressLookup[empKey]) {
        progressLookup[empKey] = {};
      }
      progressLookup[empKey][p.moduleId.toString()] = p;
    }

    // Build per-employee reports
    const employeeReports = employees.map((emp) => {
      const empProgress = progressLookup[emp._id.toString()] || {};

      const moduleStatuses = modules.map((mod) => {
        const progress = empProgress[mod._id.toString()];
        return {
          moduleId: mod._id,
          moduleTitle: mod.title,
          order: mod.order,
          status: progress?.status || 'not_started',
          videoProgress: progress?.videoProgress || 0,
          quizPassed: progress?.quizPassed || false,
          bestScore: progress?.bestScore || 0,
          completedAt: progress?.completedAt || null
        };
      });

      const completedCount = moduleStatuses.filter(
        (m) => m.status === 'completed'
      ).length;

      return {
        employee: {
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          jobTitle: emp.jobTitle,
          department: emp.department,
          hireDate: emp.hireDate
        },
        modules: moduleStatuses,
        completedModules: completedCount,
        totalModules: modules.length,
        overallProgress:
          modules.length > 0
            ? Math.round((completedCount / modules.length) * 100)
            : 0,
        trainingComplete: modules.length > 0 && completedCount === modules.length,
        nextTrainingDueDate: emp.nextTrainingDueDate || null,
        initialTrainingCompletedAt: emp.initialTrainingCompletedAt || null,
        lastAnnualTrainingCompletedAt: emp.lastAnnualTrainingCompletedAt || null
      };
    });

    // Summary statistics
    const totalEmployees = employees.length;
    const fullyTrained = employeeReports.filter((r) => r.trainingComplete).length;
    const inProgress = employeeReports.filter(
      (r) => r.completedModules > 0 && !r.trainingComplete
    ).length;
    const notStarted = employeeReports.filter(
      (r) => r.completedModules === 0
    ).length;

    const now = new Date();
    const overdue = employees.filter(
      (e) => e.nextTrainingDueDate && new Date(e.nextTrainingDueDate) < now
    ).length;

    return NextResponse.json({
      summary: {
        totalEmployees,
        fullyTrained,
        inProgress,
        notStarted,
        overdue,
        completionRate:
          totalEmployees > 0
            ? Math.round((fullyTrained / totalEmployees) * 100)
            : 0
      },
      modules: modules.map((m) => ({
        _id: m._id,
        title: m.title,
        order: m.order,
        category: m.category
      })),
      employees: employeeReports
    });
  } catch (error) {
    console.error('Error fetching training reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
