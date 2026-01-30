import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import TrainingProgress from '@/lib/models/TrainingProgress';

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

    // Check if an employeeId is specified (admin viewing specific employee)
    const { searchParams } = new URL(request.url);
    const employeeIdParam = searchParams.get('employeeId');

    let employeeId;
    if (employeeIdParam) {
      // Admin looking up a specific employee's progress
      employeeId = employeeIdParam;
    } else {
      // Employee looking up their own progress
      const employee = await Employee.findOne({
        organizationId: organization._id,
        clerkUserId: userId,
        isActive: true
      });

      if (!employee) {
        return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
      }
      employeeId = employee._id;
    }

    const progress = await TrainingProgress.find({
      organizationId: organization._id,
      employeeId
    }).lean();

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching training progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
