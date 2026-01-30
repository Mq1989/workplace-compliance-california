import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import TrainingModule from '@/lib/models/TrainingModule';
import TrainingProgress from '@/lib/models/TrainingProgress';

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
    const { moduleId, videoProgress, lastWatchedPosition } = data;

    if (!moduleId) {
      return NextResponse.json({ error: 'moduleId is required' }, { status: 400 });
    }

    // Verify module exists
    const trainingModule = await TrainingModule.findById(moduleId);
    if (!trainingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Find or create progress record
    let progress = await TrainingProgress.findOne({
      organizationId: organization._id,
      employeeId: employee._id,
      moduleId: trainingModule._id
    });

    if (!progress) {
      progress = await TrainingProgress.create({
        organizationId: organization._id,
        employeeId: employee._id,
        moduleId: trainingModule._id,
        status: 'in_progress'
      });

      // Update employee training path if not started
      if (!employee.trainingPath?.startedAt) {
        await Employee.findByIdAndUpdate(employee._id, {
          $set: { 'trainingPath.startedAt': new Date() }
        });
      }
    }

    // Update video progress (only allow forward progress)
    const updateFields = {};

    if (typeof videoProgress === 'number' && videoProgress > progress.videoProgress) {
      updateFields.videoProgress = videoProgress;
    }

    if (typeof lastWatchedPosition === 'number') {
      updateFields.lastWatchedPosition = lastWatchedPosition;
    }

    // Mark video complete if >= 90% watched
    const effectiveProgress = updateFields.videoProgress ?? progress.videoProgress;
    if (effectiveProgress >= 90 && !progress.videoCompleted) {
      updateFields.videoCompleted = true;
      updateFields.videoCompletedAt = new Date();
    }

    // Update status to in_progress if not_started
    if (progress.status === 'not_started') {
      updateFields.status = 'in_progress';
    }

    if (Object.keys(updateFields).length > 0) {
      progress = await TrainingProgress.findByIdAndUpdate(
        progress._id,
        { $set: updateFields },
        { new: true }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating video progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
