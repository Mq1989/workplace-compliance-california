import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import AuditLog from '@/lib/models/AuditLog';

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

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
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

    // Only allow updating specific fields
    const allowedFields = [
      'name', 'dba', 'address', 'phone', 'email',
      'industry', 'employeeCount', 'workplaceType'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updated = await Organization.findByIdAndUpdate(
      organization._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'settings_changed',
      resourceType: 'organization',
      resourceId: organization._id,
      details: { updatedFields: Object.keys(updateData) }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
