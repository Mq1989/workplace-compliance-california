import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId: organization._id
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const data = await request.json();

    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, organizationId: organization._id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'employee_updated',
      resourceType: 'employee',
      resourceId: employee._id,
      details: { updatedFields: Object.keys(data) }
    });

    return NextResponse.json(employee);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'An employee with this email already exists in your organization' },
        { status: 409 }
      );
    }
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, organizationId: organization._id },
      { $set: { isActive: false, terminationDate: new Date() } },
      { new: true }
    );

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'employee_removed',
      resourceType: 'employee',
      resourceId: employee._id,
      details: {
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email
      }
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error deactivating employee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
