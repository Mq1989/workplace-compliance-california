import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import AuditLog from '@/lib/models/AuditLog';

export async function POST(request, { params }) {
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

    // Archive any existing active plans
    await Plan.updateMany(
      { organizationId: organization._id, status: 'active' },
      { $set: { status: 'archived', archivedAt: new Date() } }
    );

    // Publish the new plan
    const plan = await Plan.findOneAndUpdate(
      { _id: planId, organizationId: organization._id },
      {
        $set: {
          status: 'active',
          publishedAt: new Date()
        },
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update organization compliance tracking
    await Organization.findByIdAndUpdate(organization._id, {
      wvppCreatedAt: plan.publishedAt,
      lastPlanReviewDate: new Date(),
      nextPlanReviewDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'plan_published',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { version: plan.version }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error publishing plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
