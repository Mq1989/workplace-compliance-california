import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Plan from '@/lib/models/Plan';
import AuditLog from '@/lib/models/AuditLog';
import { generateWVPP } from '@/lib/pdf/generateWVPP';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { planId } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId,
    });

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      organizationId: organization._id,
    });

    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pdfBuffer = generateWVPP(plan.toObject(), organization.toObject());

    const orgName = (organization.name || 'Organization').replace(/[^a-zA-Z0-9-_ ]/g, '');
    const fileName = `WVPP-${orgName}-v${plan.version || 1}.pdf`;

    await AuditLog.create({
      organizationId: organization._id,
      userId,
      action: 'pdf_generated',
      resourceType: 'plan',
      resourceId: plan._id,
      details: { documentType: 'wvpp_full', version: plan.version },
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
