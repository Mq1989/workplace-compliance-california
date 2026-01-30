import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';
import AuditLog from '@/lib/models/AuditLog';
import { inviteEmployeeToOrg } from '@/lib/clerk/inviteEmployee';

export async function POST(request, { params }) {
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

    if (!employee.isActive) {
      return NextResponse.json({ error: 'Cannot invite inactive employee' }, { status: 400 });
    }

    if (employee.inviteStatus === 'accepted') {
      return NextResponse.json({ error: 'Employee has already accepted their invite' }, { status: 400 });
    }

    const clerkRole = employee.role === 'owner' || employee.role === 'manager' || employee.role === 'wvpp_administrator'
      ? 'org:admin'
      : 'org:member';

    const invitation = await inviteEmployeeToOrg({
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
        resend: true,
        invitationId: invitation.id,
      }
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      employee,
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
