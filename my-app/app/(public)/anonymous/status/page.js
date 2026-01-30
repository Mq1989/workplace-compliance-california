"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Search,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  User,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  investigating: { label: "Investigating", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
};

const REPORT_TYPE_LABELS = {
  workplace_violence: "Workplace Violence",
  safety_concern: "Safety Concern",
  harassment: "Harassment",
  retaliation: "Retaliation",
  policy_violation: "Policy Violation",
  other: "Other",
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function AnonymousStatusContent() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  const [anonymousId, setAnonymousId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);

  // Response form state
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [responseSuccess, setResponseSuccess] = useState(false);

  async function handleCheckStatus(e) {
    e.preventDefault();
    if (!anonymousId.trim() || !accessToken.trim()) {
      setError("Both Report ID and Access Code are required.");
      return;
    }

    setLoading(true);
    setError("");
    setReportData(null);

    try {
      const res = await fetch("/api/anonymous/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId: anonymousId.trim(),
          accessToken: accessToken.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to check report status");
      }

      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResponse(e) {
    e.preventDefault();
    if (!responseText.trim()) {
      setResponseError("Please enter a response.");
      return;
    }

    setSendingResponse(true);
    setResponseError("");
    setResponseSuccess(false);

    try {
      const res = await fetch("/api/anonymous/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId: anonymousId.trim(),
          accessToken: accessToken.trim(),
          content: responseText.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to send response");
      }

      const data = await res.json();

      // Add the new message to the thread
      setReportData((prev) => ({
        ...prev,
        thread: [...(prev.thread || []), data.message],
      }));

      setResponseText("");
      setResponseSuccess(true);
      setTimeout(() => setResponseSuccess(false), 3000);
    } catch (err) {
      setResponseError(err.message);
    } finally {
      setSendingResponse(false);
    }
  }

  function handleBack() {
    setReportData(null);
    setError("");
    setResponseText("");
    setResponseError("");
    setResponseSuccess(false);
  }

  // Report detail view
  if (reportData) {
    const { report, thread } = reportData;
    const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.new;
    const isClosed = report.status === "closed";
    const isResolved = report.status === "resolved" || report.status === "closed";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Check Another Report
          </Button>

          {/* Report Status Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono">
                    {report.anonymousId}
                  </p>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <CardDescription>
                {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                {report.incidentDate && (
                  <> &middot; Incident: {formatDate(report.incidentDate)}</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>

              {report.incidentLocation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Location
                  </p>
                  <p className="text-sm">{report.incidentLocation}</p>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Submitted {formatDate(report.createdAt)}
              </div>

              {/* Resolution (only for resolved/closed) */}
              {isResolved && report.resolution && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Resolution
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {report.resolution}
                      </p>
                      {report.resolvedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Resolved {formatDate(report.resolvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thread Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
                {thread && thread.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({thread.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!thread || thread.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No messages yet. Management may post questions or updates here.
                </p>
              ) : (
                <div className="space-y-3">
                  {thread.map((msg) => {
                    const isReporter = msg.messageType === "reporter_response";
                    const isUpdate = msg.messageType === "admin_update";

                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-3 ${isReporter ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            isReporter
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          {isReporter ? (
                            <User className="h-4 w-4 text-primary" />
                          ) : (
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div
                          className={`flex-1 rounded-lg p-3 ${
                            isReporter
                              ? "bg-primary/10 text-right"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {isReporter
                                ? "You"
                                : isUpdate
                                  ? "Status Update"
                                  : msg.adminName || "Management"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap text-left">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Response form (not shown for closed reports) */}
              {!isClosed ? (
                <form onSubmit={handleSendResponse} className="space-y-3 pt-3 border-t">
                  <Label htmlFor="response" className="text-sm">
                    Send a Response
                  </Label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => {
                      setResponseText(e.target.value);
                      setResponseError("");
                    }}
                    placeholder="Type your response to management..."
                    rows={3}
                  />
                  {responseError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2">
                      <p className="text-xs text-destructive">{responseError}</p>
                    </div>
                  )}
                  {responseSuccess && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-950">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Response sent successfully.
                      </p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sendingResponse || !responseText.trim()}
                  >
                    {sendingResponse ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Response
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    This report has been closed and no longer accepts responses.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy footer */}
          <p className="text-center text-xs text-muted-foreground px-4">
            Your identity remains completely protected. Management cannot see who submitted
            or is viewing this report.
          </p>
        </div>
      </div>
    );
  }

  // Lookup form view
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Check Report Status
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter your Report ID and Access Code to view the status of your
            anonymous report and any responses from management.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Your identity is protected</p>
              <p className="mt-1">
                Checking your report status does not reveal your identity.
                Management cannot see who is viewing this page.
              </p>
            </div>
          </div>
        </div>

        {/* Lookup Form */}
        <form onSubmit={handleCheckStatus}>
          <Card>
            <CardHeader>
              <CardTitle>Report Lookup</CardTitle>
              <CardDescription>
                Enter the credentials you received when you submitted your report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anonymousId">
                  Report ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="anonymousId"
                  value={anonymousId}
                  onChange={(e) => {
                    setAnonymousId(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., ANON-A1B2C3D4E5F6"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">
                  Access Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={accessToken}
                  onChange={(e) => {
                    setAccessToken(e.target.value);
                    setError("");
                  }}
                  placeholder="Your access code"
                  className="font-mono"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
              {orgId && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/anonymous?org=${orgId}`}>
                    Submit a New Report
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>

        {/* Footer disclaimer */}
        <p className="text-center text-xs text-muted-foreground px-4">
          Your identity is completely protected. This system does not collect or store
          any information that could identify you. Management cannot see who submitted this report.
        </p>
      </div>
    </div>
  );
}

export default function AnonymousStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AnonymousStatusContent />
    </Suspense>
  );
}
