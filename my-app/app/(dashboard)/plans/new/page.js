"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import PlanWizard from "@/components/forms/PlanWizard";

export default function NewPlanPage() {
  const [industry, setIndustry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const org = await res.json();
          setIndustry(org.industry || null);
        }
      } catch {
        // If org not found, wizard will work without industry pre-population
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <PlanWizard industry={industry} />;
}
