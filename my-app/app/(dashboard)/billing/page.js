"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/constants";

const PLAN_KEYS = ["starter", "professional", "enterprise"];

const PRICE_ID_MAP = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  professional: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID,
  enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const config = {
    active: {
      label: "Active",
      className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
    trialing: {
      label: "Trial",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    past_due: {
      label: "Past Due",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    },
    canceled: {
      label: "Canceled",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
    unpaid: {
      label: "Unpaid",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
  };

  const c = config[status] || {
    label: status || "Free",
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // plan key or 'portal'

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing");
        if (!res.ok) {
          if (res.status === 404) {
            setBilling(null);
            setLoading(false);
            return;
          }
          throw new Error("Failed to load billing info");
        }
        const data = await res.json();
        setBilling(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  async function handleCheckout(planKey) {
    const priceId = PRICE_ID_MAP[planKey];
    if (!priceId) {
      setError(`No price ID configured for ${planKey} plan. Set NEXT_PUBLIC_STRIPE_${planKey.toUpperCase()}_PRICE_ID in environment variables.`);
      return;
    }

    setActionLoading(planKey);
    setError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portal access failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = billing?.plan || "free";
  const hasSubscription = !!billing?.stripeSubscriptionId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Success / Canceled Banners */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Subscription activated successfully! Your plan is now active.
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-200">
          <XCircle className="h-4 w-4 shrink-0" />
          Checkout was canceled. You have not been charged.
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">
                  {SUBSCRIPTION_PLANS[currentPlan]?.name || "Free Trial"}
                </p>
                {billing?.subscriptionStatus && (
                  <StatusBadge status={billing.subscriptionStatus} />
                )}
                {!hasSubscription && (
                  <StatusBadge status={null} />
                )}
              </div>
              {billing?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {billing.cancelAtPeriodEnd
                    ? `Cancels on ${formatDate(billing.currentPeriodEnd)}`
                    : `Renews on ${formatDate(billing.currentPeriodEnd)}`}
                </p>
              )}
              {currentPlan !== "free" && (
                <p className="text-sm text-muted-foreground">
                  ${SUBSCRIPTION_PLANS[currentPlan]?.price}/month
                </p>
              )}
            </div>
            {hasSubscription && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={actionLoading === "portal"}
              >
                {actionLoading === "portal" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {hasSubscription ? "Change Plan" : "Choose a Plan"}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const plan = SUBSCRIPTION_PLANS[key];
            const isCurrent = currentPlan === key;

            return (
              <Card
                key={key}
                className={cn(
                  "relative",
                  isCurrent && "border-primary",
                  key === "professional" && !isCurrent && "border-blue-300 dark:border-blue-700"
                )}
              >
                {key === "professional" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : hasSubscription ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageBilling}
                      disabled={actionLoading === "portal"}
                    >
                      {actionLoading === "portal" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Change Plan
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        key === "professional" && "bg-blue-600 hover:bg-blue-700"
                      )}
                      onClick={() => handleCheckout(key)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === key ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Subscribe
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ / Info */}
      <Card>
        <CardHeader>
          <CardTitle>Billing FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">
              Can I change my plan at any time?
            </p>
            <p>
              Yes. Upgrades take effect immediately and you&apos;ll be charged a
              prorated amount. Downgrades take effect at the end of your current
              billing period.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              What happens if I cancel?
            </p>
            <p>
              Your plan remains active until the end of the current billing
              period. After that, your account reverts to the Free tier. Your
              data is retained.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              How do I update my payment method?
            </p>
            <p>
              Click &quot;Manage Billing&quot; above to access the Stripe
              customer portal where you can update your card, view invoices, and
              manage your subscription.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
