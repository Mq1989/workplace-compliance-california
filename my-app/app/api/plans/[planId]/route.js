import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const plan = await Plan.findOne({
      _id: planId,
      organizationId: organization._id
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const plan = await Plan.findOneAndUpdate(
      { _id: planId, organizationId: organization._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'plan_updated',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { updatedFields: Object.keys(data) }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
