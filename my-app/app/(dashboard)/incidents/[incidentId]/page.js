"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  Search,
  CheckCircle2,
  MapPin,
  CalendarDays,
  ShieldAlert,
  FileText,
  Siren,
  Stethoscope,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const LOCATION_TYPES = {
  workplace: "Workplace",
  parking_lot: "Parking Lot",
  outside_workplace: "Outside Workplace",
  other: "Other",
};

const CIRCUMSTANCE_LABELS = {
  usualJobDuties: "Employee was performing usual job duties",
  poorlyLitArea: "Poorly lit area",
  rushed: "Employee was rushed or working under pressure",
  lowStaffing: "Low staffing levels",
  isolated: "Employee was working alone or isolated",
  unableToGetHelp: "Employee was unable to get help",
  communitySetting: "Incident occurred in a community setting",
  unfamiliarLocation: "Unfamiliar location",
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
  if (!dateString) return "\u2014";
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

function Section({ title, icon: Icon, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium">{value || "\u2014"}</p>
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0)
    return <p className="text-muted-foreground">None</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function BooleanRow({ value, label, detail }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {value ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 inline-block" />
        )}
        <span className="font-medium">
          {value ? "Yes" : "No"}
          {label && (
            <span className="ml-1 font-normal text-muted-foreground">
              — {label}
            </span>
          )}
        </span>
      </div>
      {value && detail && (
        <p className="ml-6 text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Investigation update state
  const [investigationStatus, setInvestigationStatus] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState("");

  useEffect(() => {
    async function fetchIncident() {
      try {
        const res = await fetch(`/api/incidents/${incidentId}`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load incident");
        }
        const data = await res.json();
        setIncident(data);
        setInvestigationStatus(data.investigationStatus || "pending");
        setInvestigationNotes(data.investigationNotes || "");
        setCorrectiveActions(
          (data.correctiveActionsTaken || []).join("\n")
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchIncident();
  }, [incidentId]);

  async function handleSaveInvestigation() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationStatus,
          investigationNotes,
          correctiveActionsTaken: correctiveActions
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update incident");
      }
      const updated = await res.json();
      setIncident(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/incidents">Back to Incidents</Link>
        </Button>
      </div>
    );
  }

  const inc = incident;

  // Gather active circumstances
  const activeCircumstances = Object.entries(CIRCUMSTANCE_LABELS)
    .filter(([key]) => inc.circumstances?.[key])
    .map(([, label]) => label);
  if (inc.circumstances?.other) {
    activeCircumstances.push(inc.circumstances.other);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/incidents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Incident — {formatDate(inc.incidentDate)}
              </h1>
              <StatusBadge status={inc.investigationStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              Logged {formatDate(inc.createdAt)}
              {inc.completedBy?.name &&
                ` by ${inc.completedBy.name}`}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Incident Sections */}
      <div className="grid gap-4">
        {/* Date, Time & Location */}
        <Section title="Date, Time & Location" icon={MapPin}>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow
              label="Date"
              value={formatDate(inc.incidentDate)}
            />
            <DetailRow label="Time" value={inc.incidentTime || "\u2014"} />
            <DetailRow
              label="Location Type"
              value={
                inc.location?.type
                  ? LOCATION_TYPES[inc.location.type] || inc.location.type
                  : undefined
              }
            />
          </div>
          <DetailRow
            label="Location Description"
            value={inc.location?.description}
          />
        </Section>

        {/* Incident Classification */}
        <Section title="Incident Classification" icon={ShieldAlert}>
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground">
                Workplace Violence Type
              </span>
              <div className="mt-1">
                <TagList
                  items={inc.workplaceViolenceTypes?.map((v) =>
                    lookupLabel(VIOLENCE_TYPES, v)
                  )}
                />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Incident Type</span>
              <div className="mt-1">
                <TagList
                  items={inc.incidentTypes?.map((t) =>
                    lookupLabel(INCIDENT_TYPES, t)
                  )}
                />
              </div>
            </div>
            <DetailRow
              label="Perpetrator Classification"
              value={
                inc.perpetratorClassification
                  ? lookupLabel(PERPETRATOR_TYPES, inc.perpetratorClassification)
                  : undefined
              }
            />
          </div>
        </Section>

        {/* Description & Circumstances */}
        <Section title="Description & Circumstances" icon={FileText}>
          <div>
            <span className="text-muted-foreground">
              Detailed Description
            </span>
            <p className="mt-1 whitespace-pre-wrap font-medium">
              {inc.detailedDescription || "\u2014"}
            </p>
          </div>
          {activeCircumstances.length > 0 && (
            <div>
              <span className="text-muted-foreground">Circumstances</span>
              <div className="mt-1">
                <TagList items={activeCircumstances} />
              </div>
            </div>
          )}
        </Section>

        {/* Response & Consequences */}
        <Section title="Response & Consequences" icon={Siren}>
          <BooleanRow
            value={inc.consequences?.securityContacted}
            label="Security contacted"
            detail={inc.consequences?.securityResponse}
          />
          <BooleanRow
            value={inc.consequences?.lawEnforcementContacted}
            label="Law enforcement contacted"
            detail={inc.consequences?.lawEnforcementResponse}
          />
          <DetailRow
            label="Actions Taken to Protect Employees"
            value={inc.consequences?.actionsToProtectEmployees}
          />
        </Section>

        {/* Injuries & Medical */}
        <Section title="Injuries & Medical" icon={Stethoscope}>
          <BooleanRow
            value={inc.injuries?.occurred}
            label="Injuries occurred"
            detail={inc.injuries?.description}
          />
          <BooleanRow
            value={inc.emergencyMedical?.contacted}
            label="Emergency medical contacted"
            detail={
              [inc.emergencyMedical?.responderType, inc.emergencyMedical?.description]
                .filter(Boolean)
                .join(" — ") || undefined
            }
          />
          <div className="border-t pt-3">
            <BooleanRow
              value={inc.calOshaReporting?.required}
              label="Cal/OSHA reporting required"
              detail={
                inc.calOshaReporting?.required
                  ? [
                      inc.calOshaReporting.reportedAt &&
                        `Reported: ${formatDate(inc.calOshaReporting.reportedAt)}`,
                      inc.calOshaReporting.representativeName &&
                        `Rep: ${inc.calOshaReporting.representativeName}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  : undefined
              }
            />
          </div>
        </Section>

        {/* Completed By */}
        <Section title="Completed By" icon={UserCheck}>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Name" value={inc.completedBy?.name} />
            <DetailRow label="Title" value={inc.completedBy?.title} />
            <DetailRow
              label="Filed On"
              value={formatDate(inc.completedAt)}
            />
          </div>
        </Section>

        {/* Investigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Investigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="investigationStatus">Status</Label>
              <Select
                value={investigationStatus}
                onValueChange={setInvestigationStatus}
              >
                <SelectTrigger id="investigationStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investigationNotes">
                Investigation Notes
              </Label>
              <Textarea
                id="investigationNotes"
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                placeholder="Document investigation findings, interviews conducted, evidence gathered..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correctiveActions">
                Corrective Actions Taken
              </Label>
              <p className="text-xs text-muted-foreground">
                One action per line.
              </p>
              <Textarea
                id="correctiveActions"
                value={correctiveActions}
                onChange={(e) => setCorrectiveActions(e.target.value)}
                placeholder="List each corrective action on a separate line..."
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {inc.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last updated {formatDate(inc.updatedAt)}
                </p>
              )}
              <Button
                onClick={handleSaveInvestigation}
                disabled={saving}
                className="ml-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Investigation"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
