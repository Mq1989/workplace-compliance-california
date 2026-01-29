import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import TrainingRecord from '@/lib/models/TrainingRecord';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';

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
    const employeeId = searchParams.get('employeeId');
    const trainingType = searchParams.get('trainingType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filter = { organizationId: organization._id };

    if (employeeId) {
      filter.employeeId = employeeId;
    }
    if (trainingType) {
      filter.trainingType = trainingType;
    }
    if (startDate || endDate) {
      filter.trainingDate = {};
      if (startDate) {
        filter.trainingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.trainingDate.$lte = new Date(endDate);
      }
    }

    const records = await TrainingRecord.find(filter)
      .sort({ trainingDate: -1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching training records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    // Verify employee belongs to this organization
    const employee = await Employee.findOne({
      _id: data.employeeId,
      organizationId: organization._id
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found in organization' }, { status: 404 });
    }

    const record = await TrainingRecord.create({
      organizationId: organization._id,
      ...data
    });

    // Update employee training tracking fields
    const updateFields = {};
    if (data.completedAt) {
      if (data.trainingType === 'initial') {
        updateFields.initialTrainingCompletedAt = data.completedAt;
      }
      if (data.trainingType === 'annual' || data.trainingType === 'initial') {
        updateFields.lastAnnualTrainingCompletedAt = data.completedAt;
        // Set next training due 1 year from completion
        const nextDue = new Date(data.completedAt);
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        updateFields.nextTrainingDueDate = nextDue;
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await Employee.findByIdAndUpdate(data.employeeId, { $set: updateFields });
    }

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'training_completed',
      resourceType: 'training',
      resourceId: record._id,
      details: {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        trainingType: data.trainingType,
        moduleName: data.moduleName
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating training record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
