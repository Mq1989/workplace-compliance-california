"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import IncidentForm from "@/components/forms/IncidentForm";

export default function NewIncidentPage() {
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchActivePlan() {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) {
          throw new Error("Failed to load plans");
        }
        const plans = await res.json();
        const active = plans.find((p) => p.status === "active");
        if (active) {
          setPlanId(active._id);
        } else {
          setError(
            "No active WVPP found. You need an active plan before logging incidents."
          );
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchActivePlan();
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
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/plans/new">Create a WVPP</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Log New Incident
        </h1>
        <p className="text-sm text-muted-foreground">
          Record a workplace violence incident per California LC 6401.9(d).
          Do not include personally identifiable information.
        </p>
      </div>

      <IncidentForm planId={planId} />
    </div>
  );
}
