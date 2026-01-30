import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';
import { inviteEmployeeToOrg } from '@/lib/clerk/inviteEmployee';

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
    const active = searchParams.get('active');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const filter = { organizationId: organization._id };

    if (active !== null && active !== '') {
      filter.isActive = active === 'true';
    }
    if (role) {
      filter.role = role;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { jobTitle: searchRegex },
        { department: searchRegex }
      ];
    }

    const employees = await Employee.find(filter)
      .sort({ lastName: 1, firstName: 1 });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
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
    const { sendInvite = true, ...employeeData } = data;

    const employee = await Employee.create({
      organizationId: organization._id,
      ...employeeData
    });

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'employee_added',
      resourceType: 'employee',
      resourceId: employee._id,
      details: {
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        role: employee.role
      }
    });

    // Send Clerk organization invite if requested and org has a Clerk org ID
    if (sendInvite && organization.clerkOrgId) {
      try {
        const clerkRole = employee.role === 'owner' || employee.role === 'manager' || employee.role === 'wvpp_administrator'
          ? 'org:admin'
          : 'org:member';

        await inviteEmployeeToOrg({
          email: employee.email,
          orgId: organization.clerkOrgId,
          role: clerkRole,
          inviterUserId: userId,
        });

        employee.inviteStatus = 'sent';
        employee.inviteSentAt = new Date();
        await employee.save();

        await AuditLog.create({
          organizationId: organization._id,
          userId,
          action: 'employee_invited',
          resourceType: 'employee',
          resourceId: employee._id,
          details: {
            email: employee.email,
            clerkRole,
          }
        });
      } catch (inviteError) {
        // Employee is created but invite failed — leave inviteStatus as 'pending'
        console.error('Clerk invite failed for employee:', employee.email, inviteError.message);
      }
    }

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An employee with this email already exists in your organization' },
        { status: 409 }
      );
    }
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
