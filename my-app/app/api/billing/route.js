import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';

/**
 * Lazy-initialize the Stripe client to avoid build-time errors
 * when STRIPE_SECRET_KEY is not available during static analysis.
 */
let _stripe;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

/**
 * GET /api/billing
 * Returns the current organization's billing info (plan, subscription status).
 */
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const org = await Organization.findOne({ clerkOrgId: orgId || userId });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const billing = {
      plan: org.plan || 'free',
      planExpiresAt: org.planExpiresAt || null,
      stripeCustomerId: org.stripeCustomerId || null,
      stripeSubscriptionId: org.stripeSubscriptionId || null,
    };

    // If there's an active subscription, fetch its status from Stripe
    if (org.stripeSubscriptionId) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(
          org.stripeSubscriptionId
        );
        billing.subscriptionStatus = subscription.status;
        billing.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        billing.currentPeriodEnd = new Date(
          subscription.current_period_end * 1000
        ).toISOString();
      } catch {
        // Subscription may no longer exist in Stripe
        billing.subscriptionStatus = null;
      }
    }

    return NextResponse.json(billing);
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/billing
 * Body: { action: 'checkout' | 'portal', priceId?: string }
 *
 * action=checkout: Creates a Stripe Checkout Session for a new subscription.
 * action=portal:   Creates a Stripe Customer Portal session for managing subscription.
 */
export async function POST(request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const org = await Organization.findOne({ clerkOrgId: orgId || userId });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { action, priceId } = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (action === 'checkout') {
      if (!priceId) {
        return NextResponse.json(
          { error: 'priceId is required for checkout' },
          { status: 400 }
        );
      }

      const sessionParams = {
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing?success=true`,
        cancel_url: `${appUrl}/billing?canceled=true`,
        metadata: {
          organizationId: org._id.toString(),
        },
      };

      // If org already has a Stripe customer, reuse it
      if (org.stripeCustomerId) {
        sessionParams.customer = org.stripeCustomerId;
      } else {
        sessionParams.customer_email = org.email;
      }

      const session = await getStripe().checkout.sessions.create(sessionParams);

      return NextResponse.json({ url: session.url });
    }

    if (action === 'portal') {
      if (!org.stripeCustomerId) {
        return NextResponse.json(
          { error: 'No billing account found. Please subscribe first.' },
          { status: 400 }
        );
      }

      const session = await getStripe().billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: `${appUrl}/billing`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "checkout" or "portal".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in billing action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
