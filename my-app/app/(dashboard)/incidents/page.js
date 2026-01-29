"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  Search,
  CheckCircle2,
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
import {
  VIOLENCE_TYPES,
  INCIDENT_TYPES,
  PERPETRATOR_TYPES,
} from "@/constants";

const INVESTIGATION_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  in_progress: {
    label: "In Progress",
    icon: Search,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

function StatusBadge({ status }) {
  const config =
    INVESTIGATION_STATUS_CONFIG[status] ||
    INVESTIGATION_STATUS_CONFIG.pending;
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

function lookupLabel(list, value) {
  const item = list.find((i) => i.value === value);
  return item ? item.label : value;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const res = await fetch("/api/incidents");
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load incidents");
        }
        const data = await res.json();
        setIncidents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchIncidents();
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
            Violent Incident Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Record and track workplace violence incidents as required by
            California LC 6401.9(d).
          </p>
        </div>
        <Button asChild>
          <Link href="/incidents/new">
            <Plus className="h-4 w-4" />
            Log Incident
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {incidents.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <AlertTriangle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No incidents logged</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When a workplace violence incident occurs, log it here to maintain
              your required incident record.
            </p>
            <Button asChild className="mt-6">
              <Link href="/incidents/new">
                <Plus className="h-4 w-4" />
                Log First Incident
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Incidents list */}
      {incidents.length > 0 && (
        <div className="grid gap-4">
          {incidents.map((incident) => (
            <Card key={incident._id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {formatDate(incident.incidentDate)}
                    {incident.incidentTime && ` at ${incident.incidentTime}`}
                  </CardTitle>
                  <CardDescription>
                    {incident.location?.description || "No location specified"}
                  </CardDescription>
                </div>
                <StatusBadge status={incident.investigationStatus} />
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-foreground line-clamp-2">
                  {incident.detailedDescription}
                </p>
                <div className="grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground">Violence Type</span>
                    <p className="font-medium">
                      {incident.workplaceViolenceTypes?.length > 0
                        ? incident.workplaceViolenceTypes
                            .map((v) => lookupLabel(VIOLENCE_TYPES, v))
                            .join(", ")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Incident Type</span>
                    <p className="font-medium">
                      {incident.incidentTypes?.length > 0
                        ? incident.incidentTypes
                            .map((t) => lookupLabel(INCIDENT_TYPES, t))
                            .join(", ")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Perpetrator</span>
                    <p className="font-medium">
                      {incident.perpetratorClassification
                        ? lookupLabel(
                            PERPETRATOR_TYPES,
                            incident.perpetratorClassification
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/incidents/${incident._id}`}>
                    View Details
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
