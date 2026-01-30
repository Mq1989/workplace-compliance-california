import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import TrainingModule from '@/lib/models/TrainingModule';
import TrainingProgress from '@/lib/models/TrainingProgress';
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

    const data = await request.json();
    const { employeeIds, dueDate } = data;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'employeeIds array is required' },
        { status: 400 }
      );
    }

    // Verify all employees belong to this organization
    const employees = await Employee.find({
      _id: { $in: employeeIds },
      organizationId: organization._id,
      isActive: true
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No valid employees found' },
        { status: 404 }
      );
    }

    // Get all active modules
    const modules = await TrainingModule.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    if (modules.length === 0) {
      return NextResponse.json(
        { error: 'No active training modules found' },
        { status: 404 }
      );
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
    let assignedCount = 0;

    // Create progress records for each employee + module combo (skip existing)
    for (const emp of employees) {
      for (const mod of modules) {
        const existing = await TrainingProgress.findOne({
          organizationId: organization._id,
          employeeId: emp._id,
          moduleId: mod._id
        });

        if (!existing) {
          await TrainingProgress.create({
            organizationId: organization._id,
            employeeId: emp._id,
            moduleId: mod._id,
            status: 'not_started',
            dueDate: parsedDueDate
          });
          assignedCount++;
        }
      }
    }

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'training_assigned',
      resourceType: 'training',
      resourceId: organization._id,
      details: {
        employeeCount: employees.length,
        moduleCount: modules.length,
        assignedCount,
        dueDate: parsedDueDate || null
      }
    });

    return NextResponse.json(
      {
        assigned: assignedCount,
        employees: employees.length,
        modules: modules.length,
        dueDate: parsedDueDate || null
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error assigning training:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
