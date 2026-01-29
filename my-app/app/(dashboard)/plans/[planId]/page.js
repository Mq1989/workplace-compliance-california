"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Archive,
  FileText,
  UserCheck,
  Users,
  MessageSquare,
  ShieldAlert,
  Search,
  FileSearch,
  GraduationCap,
  FolderArchive,
  CalendarClock,
  PenLine,
  Pencil,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VIOLENCE_TYPES, ALERT_METHODS, TRAINING_TOPICS } from "@/constants";
import PlanWizard from "@/components/forms/PlanWizard";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  active: {
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className: "bg-muted text-muted-foreground",
  },
};

const REVIEW_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

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

function getMonthLabel(month) {
  const m = REVIEW_MONTHS.find((rm) => rm.value === Number(month));
  return m ? m.label : "—";
}

function getViolenceTypeLabel(value) {
  const t = VIOLENCE_TYPES.find((v) => v.value === value);
  return t ? t.label : value;
}

function getAlertMethodLabel(value) {
  const a = ALERT_METHODS.find((m) => m.value === value);
  return a ? a.label : value;
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
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <p className="text-muted-foreground">None</p>;
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

function BooleanIndicator({ value, label }) {
  return (
    <span className="text-sm">
      {value ? (
        <span className="text-green-700 dark:text-green-400">Yes</span>
      ) : (
        <span className="text-muted-foreground">No</span>
      )}
      {label && <span className="ml-1 text-muted-foreground">— {label}</span>}
    </span>
  );
}

export default function PlanDetailPage() {
  const { planId } = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [industry, setIndustry] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planRes, orgRes] = await Promise.all([
          fetch(`/api/plans/${planId}`),
          fetch("/api/organizations"),
        ]);

        if (!planRes.ok) {
          const body = await planRes.json();
          throw new Error(body.error || "Failed to load plan");
        }
        const planData = await planRes.json();
        setPlan(planData);

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setIndustry(orgData.industry || null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [planId]);

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/plans/${planId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to publish plan");
      }
      const updated = await res.json();
      setPlan(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/plans">Back to Plans</Link>
        </Button>
      </div>
    );
  }

  if (editing) {
    return <PlanWizard existingPlan={plan} industry={industry} />;
  }

  const p = plan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                WVPP — Version {p.version}
              </h1>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(p.createdAt)}
              {p.publishedAt && ` · Published ${formatDate(p.publishedAt)}`}
              {p.updatedAt && ` · Updated ${formatDate(p.updatedAt)}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {p.status === "draft" && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit Plan
              </Button>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            </>
          )}
          {p.status === "active" && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit Plan
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Plan Sections */}
      <div className="grid gap-4">
        {/* Responsible Persons */}
        <Section title="Responsible Persons" icon={UserCheck}>
          {p.responsiblePersons?.length > 0 ? (
            <div className="space-y-4">
              {p.responsiblePersons.map((person, i) => (
                <div key={i} className="rounded-md border p-3">
                  <p className="font-medium">
                    {person.name}
                    <span className="ml-1 font-normal text-muted-foreground">
                      — {person.title}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {person.phone} · {person.email}
                  </p>
                  {person.responsibilities?.length > 0 && (
                    <div className="mt-2">
                      <TagList items={person.responsibilities} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No responsible persons assigned.</p>
          )}
        </Section>

        {/* Employee Involvement & Compliance */}
        <Section title="Employee Involvement & Compliance" icon={Users}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow
              label="Meeting Frequency"
              value={p.employeeInvolvement?.meetingFrequency}
            />
            <DetailRow
              label="Meeting Description"
              value={p.employeeInvolvement?.meetingDescription}
            />
            <DetailRow
              label="Training Involvement"
              value={p.employeeInvolvement?.trainingInvolvementDescription}
            />
            <DetailRow
              label="Reporting Procedures"
              value={p.employeeInvolvement?.reportingProceduresDescription}
            />
          </div>
          {(p.complianceProcedures?.trainingDescription ||
            p.complianceProcedures?.supervisionDescription) && (
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Compliance Procedures
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label="Training"
                  value={p.complianceProcedures?.trainingDescription}
                />
                <DetailRow
                  label="Supervision"
                  value={p.complianceProcedures?.supervisionDescription}
                />
                <DetailRow
                  label="Recognition Program"
                  value={p.complianceProcedures?.recognitionProgram}
                />
                <DetailRow
                  label="Disciplinary Process"
                  value={p.complianceProcedures?.disciplinaryProcess}
                />
              </div>
            </div>
          )}
        </Section>

        {/* Communication System */}
        <Section title="Communication System" icon={MessageSquare}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Methods</span>
              <div className="mt-1 space-y-1">
                <BooleanIndicator
                  value={p.communicationSystem?.newEmployeeOrientation}
                  label="New Employee Orientation"
                />
                <br />
                <BooleanIndicator
                  value={p.communicationSystem?.regularMeetings}
                  label={`Regular Meetings (${p.communicationSystem?.meetingFrequency || "—"})`}
                />
                <br />
                <BooleanIndicator
                  value={p.communicationSystem?.postedInformation}
                  label={`Posted Info at ${p.communicationSystem?.postingLocations || "—"}`}
                />
                <br />
                <BooleanIndicator
                  value={p.communicationSystem?.anonymousReporting}
                  label="Anonymous Reporting"
                />
              </div>
            </div>
            <div>
              <DetailRow
                label="Reporting Hotline"
                value={p.communicationSystem?.reportingHotline}
              />
              <DetailRow
                label="Reporting Form"
                value={p.communicationSystem?.reportingForm}
              />
            </div>
          </div>
        </Section>

        {/* Emergency Response */}
        <Section title="Emergency Response" icon={ShieldAlert}>
          <div>
            <span className="text-muted-foreground">Alert Methods</span>
            <div className="mt-1">
              <TagList
                items={p.emergencyResponse?.alertMethods?.map(getAlertMethodLabel)}
              />
            </div>
          </div>
          <DetailRow
            label="Evacuation Plan"
            value={p.emergencyResponse?.evacuationPlanDescription}
          />
          <div>
            <span className="text-muted-foreground">Shelter Locations</span>
            <div className="mt-1">
              <TagList
                items={p.emergencyResponse?.shelterLocations?.filter(Boolean)}
              />
            </div>
          </div>
          <DetailRow
            label="Law Enforcement Contact"
            value={p.emergencyResponse?.lawEnforcementContact}
          />
          {p.emergencyResponse?.emergencyContacts?.filter((c) => c.name).length >
            0 && (
            <div>
              <span className="text-muted-foreground">Emergency Contacts</span>
              <div className="mt-1 space-y-2">
                {p.emergencyResponse.emergencyContacts
                  .filter((c) => c.name)
                  .map((c, i) => (
                    <p key={i}>
                      <strong>{c.name}</strong> — {c.title} · {c.phone}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </Section>

        {/* Hazard Assessment */}
        <Section title="Hazard Assessment" icon={Search}>
          {p.hazardAssessments?.length > 0 ? (
            <div className="space-y-3">
              {p.hazardAssessments.map((h, i) => (
                <div key={i} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{h.description}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        h.riskLevel === "high" &&
                          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                        h.riskLevel === "medium" &&
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        h.riskLevel === "low" &&
                          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}
                    >
                      {h.riskLevel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getViolenceTypeLabel(h.hazardType)}
                  </p>
                  {h.controlMeasures?.length > 0 && (
                    <div className="mt-2">
                      <TagList items={h.controlMeasures} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No hazards assessed.</p>
          )}
        </Section>

        {/* Post-Incident Procedures */}
        <Section title="Post-Incident Procedures" icon={FileSearch}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">
                Hazard Correction
              </span>
              <DetailRow
                label="Immediate Threat Procedure"
                value={p.hazardCorrectionProcedures?.immediateThreatProcedure}
              />
              <DetailRow
                label="Documentation Process"
                value={p.hazardCorrectionProcedures?.documentationProcess}
              />
              {p.hazardCorrectionProcedures?.engineeringControls?.filter(Boolean)
                .length > 0 && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Engineering Controls</span>
                  <TagList
                    items={p.hazardCorrectionProcedures.engineeringControls.filter(Boolean)}
                  />
                </div>
              )}
              {p.hazardCorrectionProcedures?.workPracticeControls?.filter(Boolean)
                .length > 0 && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Work Practice Controls</span>
                  <TagList
                    items={p.hazardCorrectionProcedures.workPracticeControls.filter(Boolean)}
                  />
                </div>
              )}
              {p.hazardCorrectionProcedures?.administrativeControls?.filter(Boolean)
                .length > 0 && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Administrative Controls</span>
                  <TagList
                    items={p.hazardCorrectionProcedures.administrativeControls.filter(Boolean)}
                  />
                </div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">
                Investigation Steps
              </span>
              {p.postIncidentProcedures?.investigationSteps?.length > 0 ? (
                <ol className="mt-1 list-inside list-decimal space-y-1">
                  {p.postIncidentProcedures.investigationSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
              <div className="mt-3">
                <span className="text-muted-foreground">Support Resources</span>
                <TagList
                  items={p.postIncidentProcedures?.supportResources}
                />
              </div>
              <div className="mt-3">
                <BooleanIndicator
                  value={p.postIncidentProcedures?.counselingAvailable}
                  label={
                    p.postIncidentProcedures?.counselingProvider
                      ? `Counseling via ${p.postIncidentProcedures.counselingProvider}`
                      : "Counseling Available"
                  }
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Training Program */}
        <Section title="Training Program" icon={GraduationCap}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow
              label="Initial Training"
              value={p.trainingProgram?.initialTrainingDescription}
            />
            <DetailRow
              label="Annual Refresher"
              value={p.trainingProgram?.annualRefresherDescription}
            />
            <DetailRow
              label="New Hazard Training"
              value={p.trainingProgram?.newHazardTrainingDescription}
            />
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground">Training Topics</span>
            <div className="mt-1">
              <TagList items={p.trainingProgram?.trainingTopics} />
            </div>
          </div>
        </Section>

        {/* Recordkeeping & Access */}
        <Section title="Recordkeeping & Access" icon={FolderArchive}>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow
              label="Hazard Records Retention"
              value={
                p.recordkeepingProcedures?.hazardRecordsRetention
                  ? `${p.recordkeepingProcedures.hazardRecordsRetention} years`
                  : undefined
              }
            />
            <DetailRow
              label="Training Records Retention"
              value={
                p.recordkeepingProcedures?.trainingRecordsRetention
                  ? `${p.recordkeepingProcedures.trainingRecordsRetention} year(s)`
                  : undefined
              }
            />
            <DetailRow
              label="Incident Log Retention"
              value={
                p.recordkeepingProcedures?.incidentLogRetention
                  ? `${p.recordkeepingProcedures.incidentLogRetention} years`
                  : undefined
              }
            />
          </div>
          <DetailRow
            label="Access Procedure"
            value={p.recordkeepingProcedures?.accessProcedure}
          />
          <div className="mt-2 border-t pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plan Accessibility
            </p>
            <DetailRow
              label="Physical Location"
              value={p.planAccessibility?.physicalLocation}
            />
            <BooleanIndicator
              value={p.planAccessibility?.electronicAccess}
              label={
                p.planAccessibility?.electronicLocation
                  ? `Electronic at ${p.planAccessibility.electronicLocation}`
                  : "Electronic Access"
              }
            />
          </div>
        </Section>

        {/* Review Schedule */}
        <Section title="Review Schedule" icon={CalendarClock}>
          <DetailRow
            label="Annual Review Month"
            value={
              p.reviewSchedule?.annualReviewMonth
                ? getMonthLabel(p.reviewSchedule.annualReviewMonth)
                : undefined
            }
          />
          <DetailRow
            label="Review Procedure"
            value={p.reviewSchedule?.reviewProcedure}
          />
          {p.reviewSchedule?.lastReviewDate && (
            <DetailRow
              label="Last Reviewed"
              value={formatDate(p.reviewSchedule.lastReviewDate)}
            />
          )}
          {p.reviewSchedule?.nextReviewDate && (
            <DetailRow
              label="Next Review"
              value={formatDate(p.reviewSchedule.nextReviewDate)}
            />
          )}
        </Section>

        {/* Authorization */}
        <Section title="Authorization" icon={PenLine}>
          <DetailRow
            label="Authorized By"
            value={
              p.authorization?.authorizerName
                ? `${p.authorization.authorizerName}, ${p.authorization.authorizerTitle || ""}`
                : undefined
            }
          />
          {p.authorization?.authorizationStatement && (
            <DetailRow
              label="Statement"
              value={p.authorization.authorizationStatement}
            />
          )}
          {p.authorization?.signedAt && (
            <DetailRow
              label="Signed"
              value={formatDate(p.authorization.signedAt)}
            />
          )}
        </Section>
      </div>
    </div>
  );
}
