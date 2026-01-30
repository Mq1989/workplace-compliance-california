"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Clock,
  Search,
  CheckCircle2,
  Eye,
  Bell,
  MessageSquare,
  Send,
  StickyNote,
  LinkIcon,
  User,
  UserCog,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  return formatDate(dateString);
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

export default function AnonymousReportDetailPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);

  // Thread message state
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState("admin_question");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Internal note state
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Link incident state
  const [incidentId, setIncidentId] = useState("");
  const [linkingIncident, setLinkingIncident] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/anonymous/reports/${reportId}`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load report");
        }
        const data = await res.json();
        setReport(data.report);
        setThread(data.thread);
        setStatus(data.report.status);
        setPriority(data.report.priority);
        setAssignedTo(data.report.assignedTo || "");
        setResolution(data.report.resolution || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  async function handleUpdateReport() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/anonymous/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, assignedTo, resolution }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update report");
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendMessage() {
    if (!messageContent.trim()) return;
    setSendingMessage(true);
    setError("");
    try {
      const res = await fetch(`/api/anonymous/reports/${reportId}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent.trim(),
          messageType,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to send message");
      }
      const data = await res.json();
      setThread((prev) => [...prev, data.message]);
      setMessageContent("");
      // Auto-update status if it was 'new'
      if (report.status === "new") {
        setReport((prev) => ({ ...prev, status: "under_review" }));
        setStatus("under_review");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    setError("");
    try {
      const res = await fetch(`/api/anonymous/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNote: noteContent.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to add note");
      }
      const data = await res.json();
      setReport(data.report);
      setNoteContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleLinkIncident() {
    if (!incidentId.trim()) return;
    setLinkingIncident(true);
    setError("");
    try {
      const res = await fetch(`/api/anonymous/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedIncidentId: incidentId.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to link incident");
      }
      const data = await res.json();
      setReport(data.report);
      setIncidentId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLinkingIncident(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/anonymous-reports">Back to Reports</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/anonymous-reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {report.anonymousId}
              </h1>
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted {formatRelativeTime(report.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — left 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Report details */}
          <Section title="Report Details" icon={ShieldAlert}>
            <DetailRow label="Title" value={report.title} />
            <div>
              <span className="text-muted-foreground">Description</span>
              <p className="mt-1 whitespace-pre-wrap font-medium">
                {report.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <DetailRow
                label="Report Type"
                value={REPORT_TYPE_LABELS[report.reportType] || report.reportType}
              />
              <DetailRow
                label="Incident Date"
                value={report.incidentDate ? formatDate(report.incidentDate) : undefined}
              />
              <DetailRow
                label="Location"
                value={report.incidentLocation}
              />
            </div>
            {report.witnessesPresent !== undefined && report.witnessesPresent !== null && (
              <DetailRow
                label="Witnesses Present"
                value={report.witnessesPresent ? "Yes" : "No"}
              />
            )}
          </Section>

          {/* Resolution (if resolved) */}
          {report.resolution && (report.status === "resolved" || report.status === "closed") && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{report.resolution}</p>
                {report.resolvedAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Resolved {formatDate(report.resolvedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Thread messages */}
          <Section title="Communication Thread" icon={MessageSquare}>
            {thread.length === 0 ? (
              <p className="text-muted-foreground">
                No messages yet. Send a question or update to the reporter.
              </p>
            ) : (
              <div className="space-y-4">
                {thread.map((msg) => {
                  const isAdmin = msg.messageType === "admin_question" || msg.messageType === "admin_update";
                  return (
                    <div
                      key={msg._id}
                      className={cn(
                        "flex gap-3",
                        isAdmin ? "flex-row" : "flex-row-reverse"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isAdmin
                            ? "bg-primary/10"
                            : "bg-muted"
                        )}
                      >
                        {isAdmin ? (
                          <UserCog className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          isAdmin
                            ? "bg-primary/5 border"
                            : "bg-muted"
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {isAdmin
                              ? (msg.adminName || "Management")
                              : "Anonymous Reporter"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {msg.messageType === "admin_update" && "(Update)"}
                            {msg.messageType === "admin_question" && "(Question)"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">
                          {msg.content}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Send message form */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_question">Question</SelectItem>
                      <SelectItem value="admin_update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type a question or update for the reporter..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !messageContent.trim()}
                    size="sm"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Status & Priority management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Name or user ID"
                />
              </div>

              {(status === "resolved" || status === "closed") && (
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe how this report was resolved..."
                    rows={3}
                  />
                </div>
              )}

              <Button
                onClick={handleUpdateReport}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Internal notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4 text-primary" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Notes are only visible to admins, not to the reporter.
              </p>

              {report.internalNotes && report.internalNotes.length > 0 ? (
                <div className="space-y-3">
                  {report.internalNotes.map((note, i) => (
                    <div key={i} className="rounded border bg-muted/50 p-3">
                      <p className="whitespace-pre-wrap text-sm">{note.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(note.addedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}

              <div className="space-y-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add an internal note..."
                  rows={2}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteContent.trim()}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {savingNote ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <StickyNote className="h-4 w-4" />
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Link to incident */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="h-4 w-4 text-primary" />
                Link to Incident
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.linkedIncidentId ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    Linked to incident:
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/incidents/${report.linkedIncidentId}`}>
                      View Linked Incident
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Link this anonymous report to an official incident log entry.
                  </p>
                  <div className="space-y-2">
                    <Input
                      value={incidentId}
                      onChange={(e) => setIncidentId(e.target.value)}
                      placeholder="Incident ID"
                    />
                    <Button
                      onClick={handleLinkIncident}
                      disabled={linkingIncident || !incidentId.trim()}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      {linkingIncident ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4" />
                          Link Incident
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <DetailRow label="Report ID" value={report.anonymousId} />
              <DetailRow label="Submitted" value={formatDate(report.createdAt)} />
              <DetailRow label="Last Updated" value={formatDate(report.updatedAt)} />
              {report.resolvedAt && (
                <DetailRow label="Resolved" value={formatDate(report.resolvedAt)} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
