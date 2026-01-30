"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Loader2,
  AlertCircle,
  Clock,
  Search,
  CheckCircle2,
  Eye,
  MessageSquare,
  Bell,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  new: {
    label: "New",
    icon: Bell,
    className:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  under_review: {
    label: "Under Review",
    icon: Eye,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  investigating: {
    label: "Investigating",
    icon: Search,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  medium: {
    label: "Medium",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  high: {
    label: "High",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  critical: {
    label: "Critical",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

const REPORT_TYPE_LABELS = {
  workplace_violence: "Workplace Violence",
  safety_concern: "Safety Concern",
  harassment: "Harassment",
  retaliation: "Retaliation",
  policy_violation: "Policy Violation",
  other: "Other",
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
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

function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium">
      {REPORT_TYPE_LABELS[type] || type}
    </span>
  );
}

function formatRelativeTime(dateString) {
  if (!dateString) return "—";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AnonymousReportsPage() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ total: 0, new: 0, active: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.set("reportType", typeFilter);
      if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/anonymous/reports?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to load reports");
      }
      const data = await res.json();
      setReports(data.reports);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const hasActiveFilters =
    statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
  }

  if (error && reports.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError("");
            fetchReports();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Anonymous Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and manage anonymous employee reports. Reporter identities are
          completely protected.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card className={cn(summary.new > 0 && "border-red-200 dark:border-red-800")}>
          <CardContent className="pt-6">
            <div className={cn("text-2xl font-bold", summary.new > 0 && "text-red-600 dark:text-red-400")}>
              {summary.new}
            </div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{summary.active}</div>
            <p className="text-xs text-muted-foreground">Active (Under Review / Investigating)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.resolved}
            </div>
            <p className="text-xs text-muted-foreground">Resolved / Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters:
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="workplace_violence">Workplace Violence</SelectItem>
            <SelectItem value="safety_concern">Safety Concern</SelectItem>
            <SelectItem value="harassment">Harassment</SelectItem>
            <SelectItem value="retaliation">Retaliation</SelectItem>
            <SelectItem value="policy_violation">Policy Violation</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldAlert className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              {hasActiveFilters
                ? "No reports match your filters"
                : "No anonymous reports yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your filter criteria."
                : "Anonymous reports submitted by employees will appear here."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports list */}
      {!loading && reports.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report._id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {report.anonymousId}
                      </span>
                      {report.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      Submitted {formatRelativeTime(report.createdAt)}
                      {report.incidentDate && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          Incident: {formatDate(report.incidentDate)}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={report.priority} />
                    <StatusBadge status={report.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-foreground line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <TypeBadge type={report.reportType} />
                    {report.threadCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {report.threadCount} message{report.threadCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {report.unreadResponses > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                        <Bell className="h-3 w-3" />
                        {report.unreadResponses} unread
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/anonymous-reports/${report._id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
