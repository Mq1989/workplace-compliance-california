import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import TrainingRecord from '@/lib/models/TrainingRecord';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const record = await TrainingRecord.findOne({
      _id: recordId,
      organizationId: organization._id
    });

    if (!record) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching training record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recordId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const record = await TrainingRecord.findOneAndUpdate(
      { _id: recordId, organizationId: organization._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!record) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    // Update employee training tracking if completion changed
    if (data.completedAt || data.quizPassed !== undefined || data.employeeAcknowledged !== undefined) {
      const updateFields = {};
      if (data.completedAt) {
        if (record.trainingType === 'initial') {
          updateFields.initialTrainingCompletedAt = data.completedAt;
        }
        if (record.trainingType === 'annual' || record.trainingType === 'initial') {
          updateFields.lastAnnualTrainingCompletedAt = data.completedAt;
          const nextDue = new Date(data.completedAt);
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          updateFields.nextTrainingDueDate = nextDue;
        }
      }

      if (Object.keys(updateFields).length > 0) {
        await Employee.findByIdAndUpdate(record.employeeId, { $set: updateFields });
      }
    }

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'training_completed',
      resourceType: 'training',
      resourceId: record._id,
      details: {
        updatedFields: Object.keys(data)
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating training record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
