"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className: "bg-muted text-muted-foreground",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load plans");
        }
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Workplace Violence Prevention Plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your WVPP documents required by California SB 553.
          </p>
        </div>
        <Button asChild>
          <Link href="/plans/new">
            <Plus className="h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {plans.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No plans yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first Workplace Violence Prevention
              Plan.
            </p>
            <Button asChild className="mt-6">
              <Link href="/plans/new">
                <Plus className="h-4 w-4" />
                Create Your First Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
      {plans.length > 0 && (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan._id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    WVPP — Version {plan.version}
                  </CardTitle>
                  <CardDescription>
                    Created {formatDate(plan.createdAt)}
                    {plan.publishedAt &&
                      ` · Published ${formatDate(plan.publishedAt)}`}
                  </CardDescription>
                </div>
                <StatusBadge status={plan.status} />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">
                      Responsible Persons
                    </span>
                    <p className="font-medium">
                      {plan.responsiblePersons?.length || 0} assigned
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Hazards Assessed
                    </span>
                    <p className="font-medium">
                      {plan.hazardAssessments?.length || 0} identified
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated</span>
                    <p className="font-medium">{formatDate(plan.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/plans/${plan._id}`}>
                    View Plan
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
