import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Incident from '@/lib/models/Incident';
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
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filter = { organizationId: organization._id };

    if (status) {
      filter.investigationStatus = status;
    }
    if (startDate || endDate) {
      filter.incidentDate = {};
      if (startDate) filter.incidentDate.$gte = new Date(startDate);
      if (endDate) filter.incidentDate.$lte = new Date(endDate);
    }

    const incidents = await Incident.find(filter)
      .sort({ incidentDate: -1 });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
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

    const incident = await Incident.create({
      organizationId: organization._id,
      ...data
    });

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'incident_logged',
      resourceType: 'incident',
      resourceId: incident._id,
      details: {
        incidentDate: incident.incidentDate,
        violenceTypes: incident.workplaceViolenceTypes
      }
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
