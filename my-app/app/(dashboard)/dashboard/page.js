"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  AlertTriangle,
  Users,
  GraduationCap,
  Plus,
  Download,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Activity,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle2,
  Loader2,
  MessageSquareWarning,
  Eye,
  BookOpen,
  Bot,
  ShieldQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_LABELS = {
  plan_created: "Plan created",
  plan_updated: "Plan updated",
  plan_published: "Plan published",
  plan_archived: "Plan archived",
  incident_logged: "Incident logged",
  incident_updated: "Incident updated",
  training_completed: "Training completed",
  employee_added: "Employee added",
  employee_removed: "Employee removed",
  employee_updated: "Employee updated",
  employee_invited: "Employee invited",
  document_exported: "Document exported",
  document_generated: "Document generated",
  settings_changed: "Settings changed",
  pdf_generated: "PDF generated",
  training_assigned: "Training assigned",
  quiz_submitted: "Quiz submitted",
  chat_message_sent: "Q&A message sent",
  chat_message_flagged: "Q&A response flagged",
  chat_message_reviewed: "Flagged Q&A reviewed",
  anonymous_report_submitted: "Anonymous report submitted",
  anonymous_report_updated: "Anonymous report updated",
  anonymous_report_responded: "Admin responded to report",
};

const RESOURCE_ICONS = {
  plan: FileText,
  incident: AlertTriangle,
  employee: Users,
  training: GraduationCap,
  organization: ShieldCheck,
  chat: Bot,
  anonymous_report: ShieldQuestion,
  document: FileText,
  training_module: BookOpen,
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function ScoreRing({ score, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = "text-green-500";
  if (score < 50) color = "text-red-500";
  else if (score < 75) color = "text-yellow-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700", color)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  const criticalAlerts = alerts.filter((a) => a.level === "critical");
  const warningAlerts = alerts.filter((a) => a.level === "warning");
  const infoAlerts = alerts.filter((a) => a.level === "info");

  return (
    <div className="space-y-2">
      {criticalAlerts.map((alert, i) => (
        <div
          key={`critical-${i}`}
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
        >
          <ShieldX className="h-4 w-4 shrink-0" />
          {alert.message}
        </div>
      ))}
      {warningAlerts.map((alert, i) => (
        <div
          key={`warning-${i}`}
          className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {alert.message}
        </div>
      ))}
      {infoAlerts.map((alert, i) => (
        <div
          key={`info-${i}`}
          className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200"
        >
          <Info className="h-4 w-4 shrink-0" />
          {alert.message}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          if (res.status === 404) {
            // No org yet — show empty state
            setData(null);
            setLoading(false);
            return;
          }
          throw new Error("Failed to load dashboard");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Welcome to SafeWorkCA</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by setting up your organization.
          </p>
        </div>
        <Button asChild>
          <Link href="/onboarding">Set Up Organization</Link>
        </Button>
      </div>
    );
  }

  const { compliance, stats, alerts, deadlines, recentActivity } = data;

  const scoreBreakdown = [
    {
      label: "WVPP Status",
      value: compliance.scores.wvpp,
      icon: FileText,
      description: stats.activePlan
        ? `Active (v${stats.activePlanVersion})`
        : "No active plan",
    },
    {
      label: "Training",
      value: compliance.scores.training,
      icon: GraduationCap,
      description:
        stats.activeEmployees > 0
          ? `${stats.trainedEmployees} / ${stats.activeEmployees} trained`
          : "No employees yet",
    },
    {
      label: "Annual Review",
      value: compliance.scores.annualReview,
      icon: Clock,
      description:
        compliance.scores.annualReview === 100
          ? "Up to date"
          : compliance.scores.annualReview > 0
            ? "Review needed soon"
            : "Review overdue",
    },
    {
      label: "Incident Log",
      value: compliance.scores.incidentLog,
      icon: AlertTriangle,
      description:
        stats.totalIncidents === 0
          ? "No incidents"
          : stats.openIncidents > 0
            ? `${stats.openIncidents} open`
            : "All investigated",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          SB 553 compliance overview for your organization.
        </p>
      </div>

      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Compliance Score + Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
            <CardDescription>
              Overall SB 553 compliance status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-6">
            <ScoreRing score={compliance.overall} />
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>Each area contributes 25%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scoreBreakdown.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="tabular-nums">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/50">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPlans}</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalPlans === 1 ? "Plan" : "Plans"} Created
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/50">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeEmployees}</p>
              <p className="text-xs text-muted-foreground">
                Active Employee{stats.activeEmployees !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950/50">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalIncidents}</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalIncidents === 1 ? "Incident" : "Incidents"} Logged
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/50">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.trainedEmployees}</p>
              <p className="text-xs text-muted-foreground">
                Employee{stats.trainedEmployees !== 1 ? "s" : ""} Trained
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-950/50">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.completedModuleProgress}
              </p>
              <p className="text-xs text-muted-foreground">
                Module{stats.completedModuleProgress !== 1 ? "s" : ""} Completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn(
              "rounded-lg p-2",
              stats.pendingFlaggedQA > 0
                ? "bg-red-50 dark:bg-red-950/50"
                : "bg-orange-50 dark:bg-orange-950/50"
            )}>
              <MessageSquareWarning className={cn(
                "h-5 w-5",
                stats.pendingFlaggedQA > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-orange-600 dark:text-orange-400"
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingFlaggedQA}</p>
              <p className="text-xs text-muted-foreground">
                Flagged Q&A Pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn(
              "rounded-lg p-2",
              stats.newAnonymousReports > 0
                ? "bg-red-50 dark:bg-red-950/50"
                : "bg-teal-50 dark:bg-teal-950/50"
            )}>
              <ShieldQuestion className={cn(
                "h-5 w-5",
                stats.newAnonymousReports > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-teal-600 dark:text-teal-400"
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.newAnonymousReports}</p>
              <p className="text-xs text-muted-foreground">
                New Anonymous Report{stats.newAnonymousReports !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-950/50">
              <Bot className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalChatMessages}</p>
              <p className="text-xs text-muted-foreground">
                Q&A Question{stats.totalChatMessages !== 1 ? "s" : ""} Asked
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Deadlines + Recent Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming deadlines.
              </p>
            ) : (
              <div className="space-y-3">
                {deadlines.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(d.date)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        d.overdue
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : d.daysUntil <= 7
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      )}
                    >
                      {d.overdue
                        ? `${Math.abs(d.daysUntil)}d overdue`
                        : `${d.daysUntil}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((log) => {
                  const Icon =
                    RESOURCE_ICONS[log.resourceType] || Activity;
                  return (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {ACTION_LABELS[log.action] || log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/incidents/new">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Log New Incident
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/employees/new">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Add Employee
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/training/qa-review">
                <span className="flex items-center gap-2">
                  <MessageSquareWarning className="h-4 w-4" />
                  View Flagged Q&A
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/anonymous-reports">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Anonymous Reports
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/documents">
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Compliance Report
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            {stats.activePlan && (
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <Link href="/plans">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    View WVPP
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
