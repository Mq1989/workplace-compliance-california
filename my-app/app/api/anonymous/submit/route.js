import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import AnonymousReport from '@/lib/models/AnonymousReport';

export async function POST(request) {
  try {
    await dbConnect();

    const data = await request.json();
    const {
      organizationId,
      reportType,
      title,
      description,
      incidentDate,
      incidentLocation,
      witnessesPresent
    } = data;

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    if (!reportType || !title || !description) {
      return NextResponse.json(
        { error: 'reportType, title, and description are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or fewer' },
        { status: 400 }
      );
    }

    const validTypes = [
      'workplace_violence',
      'safety_concern',
      'harassment',
      'retaliation',
      'policy_violation',
      'other'
    ];
    if (!validTypes.includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Verify the organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Generate access token (shown to reporter once, then hashed)
    const accessToken = AnonymousReport.generateAccessToken();
    const accessTokenHash = AnonymousReport.hashToken(accessToken);

    // Hash IP for abuse prevention (NOT identification)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Create the report
    const report = await AnonymousReport.create({
      organizationId: organization._id,
      accessTokenHash,
      reportType,
      title: title.trim(),
      description: description.trim(),
      incidentDate: incidentDate || undefined,
      incidentLocation: incidentLocation?.trim() || undefined,
      witnessesPresent: witnessesPresent !== undefined ? witnessesPresent : undefined,
      submittedVia: 'web',
      ipHash
    });

    return NextResponse.json({
      anonymousId: report.anonymousId,
      accessToken,
      status: report.status,
      message: 'Report submitted successfully. Save your Report ID and Access Code — this is the only time the access code will be shown.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting anonymous report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
