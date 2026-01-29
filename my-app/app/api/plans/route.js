import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
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

    const plans = await Plan.find({ organizationId: organization._id })
      .sort({ createdAt: -1 });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
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

    const plan = await Plan.create({
      organizationId: organization._id,
      ...data
    });

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'plan_created',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { version: plan.version }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
