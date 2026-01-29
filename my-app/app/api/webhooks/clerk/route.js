import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Employee from '@/lib/models/Employee';

/**
 * Clerk webhook handler.
 * Verifies the webhook signature via svix, then processes
 * user and organizationMembership events to keep MongoDB in sync.
 *
 * Required env var: CLERK_WEBHOOK_SECRET
 * Public route (no auth) — verified by signature instead.
 */
export async function POST(request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // ----- Verify signature -----
  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  const body = await request.text();

  let event;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // ----- Route by event type -----
  const eventType = event.type;

  try {
    await dbConnect();

    switch (eventType) {
      case 'organizationMembership.created':
        await handleMembershipCreated(event.data);
        break;

      case 'organizationMembership.updated':
        await handleMembershipUpdated(event.data);
        break;

      case 'organizationMembership.deleted':
        await handleMembershipDeleted(event.data);
        break;

      case 'user.updated':
        await handleUserUpdated(event.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;

      default:
        // Acknowledge unhandled events without error
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler error (${eventType}):`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ----- Event Handlers -----

/**
 * organizationMembership.created
 * When a user accepts a Clerk org invite, link their clerkUserId
 * to the matching Employee record by email.
 */
async function handleMembershipCreated(data) {
  const { organization, public_user_data } = data;
  if (!organization?.id || !public_user_data?.identifier) return;

  const clerkOrgId = organization.id;
  const email = public_user_data.identifier; // email address
  const clerkUserId = public_user_data.user_id;

  const org = await Organization.findOne({ clerkOrgId });
  if (!org) return;

  // Match employee by org + email and link clerkUserId
  await Employee.findOneAndUpdate(
    { organizationId: org._id, email: email.toLowerCase() },
    {
      clerkUserId,
      isActive: true,
    }
  );
}

/**
 * organizationMembership.updated
 * Sync role changes if needed (future use).
 */
async function handleMembershipUpdated(data) {
  const { organization, public_user_data } = data;
  if (!organization?.id || !public_user_data?.user_id) return;

  const clerkOrgId = organization.id;
  const clerkUserId = public_user_data.user_id;

  const org = await Organization.findOne({ clerkOrgId });
  if (!org) return;

  // Update clerkUserId on the employee if email changed
  const email = public_user_data.identifier;
  if (email) {
    await Employee.findOneAndUpdate(
      { organizationId: org._id, clerkUserId },
      { email: email.toLowerCase() }
    );
  }
}

/**
 * organizationMembership.deleted
 * When a member is removed from the Clerk org, deactivate the Employee record.
 */
async function handleMembershipDeleted(data) {
  const { organization, public_user_data } = data;
  if (!organization?.id || !public_user_data?.user_id) return;

  const clerkOrgId = organization.id;
  const clerkUserId = public_user_data.user_id;

  const org = await Organization.findOne({ clerkOrgId });
  if (!org) return;

  await Employee.findOneAndUpdate(
    { organizationId: org._id, clerkUserId },
    {
      isActive: false,
      terminationDate: new Date(),
    }
  );
}

/**
 * user.updated
 * Sync basic profile changes (email) across all Employee records for this user.
 */
async function handleUserUpdated(data) {
  const clerkUserId = data.id;
  if (!clerkUserId) return;

  const primaryEmail = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  )?.email_address;

  if (primaryEmail) {
    await Employee.updateMany(
      { clerkUserId },
      { email: primaryEmail.toLowerCase() }
    );
  }
}

/**
 * user.deleted
 * When a Clerk user is fully deleted, deactivate all their Employee records.
 */
async function handleUserDeleted(data) {
  const clerkUserId = data.id;
  if (!clerkUserId) return;

  await Employee.updateMany(
    { clerkUserId },
    {
      isActive: false,
      terminationDate: new Date(),
      clerkUserId: null,
    }
  );
}
