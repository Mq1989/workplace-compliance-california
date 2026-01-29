import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';

/**
 * Stripe webhook handler.
 * Verifies the webhook signature, then processes subscription lifecycle
 * events to keep the Organization's billing state in sync.
 *
 * Required env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Public route (no auth) — verified by Stripe signature instead.
 */

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
 * Map a Stripe Price ID to an internal plan tier.
 * Falls back to 'starter' if the price ID isn't recognized.
 */
function resolvePlanFromPrice(priceId) {
  const map = {
    [process.env.STRIPE_STARTER_PRICE_ID]: 'starter',
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
  };
  return map[priceId] || 'starter';
}

export async function POST(request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // ----- Verify signature -----
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
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
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        // Acknowledge unhandled events without error
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook handler error (${eventType}):`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ----- Event Handlers -----

/**
 * checkout.session.completed
 * When a customer completes Stripe Checkout, link the Stripe customer
 * and subscription to the Organization and activate the plan.
 *
 * Expects metadata.organizationId on the checkout session (set during
 * checkout session creation on the billing page).
 */
async function handleCheckoutCompleted(session) {
  const orgMongoId = session.metadata?.organizationId;
  if (!orgMongoId) {
    console.warn('checkout.session.completed: missing metadata.organizationId');
    return;
  }

  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!subscriptionId) return; // One-time payment, not subscription

  // Fetch the subscription to get price/plan details
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = resolvePlanFromPrice(priceId);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await Organization.findByIdAndUpdate(orgMongoId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan,
    planExpiresAt: periodEnd,
  });
}

/**
 * customer.subscription.updated
 * Handles plan changes (upgrades/downgrades) and renewal period updates.
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = resolvePlanFromPrice(priceId);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  const update = {
    plan,
    planExpiresAt: periodEnd,
  };

  // If the subscription is no longer active, downgrade to free
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    update.plan = 'free';
    update.stripeSubscriptionId = null;
  }

  await Organization.findOneAndUpdate(
    { stripeCustomerId: customerId },
    update
  );
}

/**
 * customer.subscription.deleted
 * When a subscription is fully canceled, revert the org to the free tier.
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  await Organization.findOneAndUpdate(
    { stripeCustomerId: customerId },
    {
      plan: 'free',
      stripeSubscriptionId: null,
      planExpiresAt: null,
    }
  );
}

/**
 * invoice.payment_failed
 * Log the failure. The subscription status change will be handled by
 * customer.subscription.updated when Stripe updates the sub status.
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  console.warn(
    `Payment failed for customer ${customerId}, subscription ${subscriptionId}`
  );
}
