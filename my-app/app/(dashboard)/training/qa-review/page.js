"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flag,
  MessageSquare,
  User,
  Bot,
  ShieldAlert,
  Eye,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  wvpp_content: {
    label: "WVPP Content",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  sb553_general: {
    label: "SB 553 General",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  },
  reporting: {
    label: "Reporting",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  emergency: {
    label: "Emergency",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  training: {
    label: "Training",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  other: {
    label: "Other",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelative(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function ReviewStatusBadge({ reviewedAt }) {
  if (reviewedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
      <Clock className="h-3 w-3" />
      Pending Review
    </span>
  );
}

// ── Review Dialog ─────────────────────────────────────────────

function ReviewDialog({ message, open, onOpenChange, onReviewed }) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/chat/flagged/${message._id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes: notes || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark as reviewed");
      }

      onReviewed(message._id, data);
      setNotes("");
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Flagged Response</DialogTitle>
          <DialogDescription>
            Mark this AI response as reviewed. Add optional notes about the
            review outcome.
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div className="space-y-3">
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Flag Reason
              </p>
              <p className="mt-1 text-sm">
                {message.aiMetadata?.flagReason || "Unknown"}
              </p>
            </div>

            <div className="rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Employee Question
              </p>
              <p className="mt-1 text-sm">
                {message.userQuestion || "No question recorded"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-notes">Review Notes (optional)</Label>
              <Textarea
                id="review-notes"
                placeholder="Add notes about this review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Mark as Reviewed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Flagged Message Card ──────────────────────────────────────

function FlaggedMessageCard({ message, onReviewClick }) {
  const isReviewed = !!message.aiMetadata?.reviewedAt;

  return (
    <Card
      className={cn(
        isReviewed && "opacity-75"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <Flag className="h-4 w-4 text-orange-700 dark:text-orange-300" />
            </div>
            <div className="min-w-0">
              {message.employee ? (
                <>
                  <p className="text-sm font-medium truncate">
                    {message.employee.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {message.employee.email}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-muted-foreground">
                  Unknown employee
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ReviewStatusBadge reviewedAt={message.aiMetadata?.reviewedAt} />
            <CategoryBadge category={message.aiMetadata?.questionCategory} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Flag reason */}
        <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
          <p className="text-sm text-orange-800 dark:text-orange-200">
            {message.aiMetadata?.flagReason || "Flagged for review"}
          </p>
        </div>

        {/* User question */}
        {message.userQuestion && (
          <div className="rounded-md border p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Employee Question
              </span>
            </div>
            <p className="text-sm">{message.userQuestion}</p>
          </div>
        )}

        {/* AI response */}
        <div className="rounded-md border p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              AI Response
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>

        {/* Review notes (if reviewed) */}
        {isReviewed && message.aiMetadata?.reviewNotes && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-green-700 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Review Notes
              </span>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200">
              {message.aiMetadata.reviewNotes}
            </p>
          </div>
        )}

        <Separator />

        {/* Footer with metadata and action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span title={formatDate(message.createdAt) + " " + formatTime(message.createdAt)}>
              {formatRelative(message.createdAt)}
            </span>
            {message.aiMetadata?.model && (
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {message.aiMetadata.model}
              </span>
            )}
            {message.aiMetadata?.responseTimeMs && (
              <span>
                {(message.aiMetadata.responseTimeMs / 1000).toFixed(1)}s
              </span>
            )}
            {isReviewed && message.aiMetadata?.reviewedAt && (
              <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Reviewed {formatRelative(message.aiMetadata.reviewedAt)}
              </span>
            )}
          </div>
          {!isReviewed && (
            <Button size="sm" onClick={() => onReviewClick(message)}>
              <Eye className="h-4 w-4" />
              Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function QAReviewPage() {
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchFlagged = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const queryString = params.toString();
      const url = `/api/chat/flagged${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load flagged messages");
      }

      setMessages(data.flaggedMessages || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchFlagged();
  }, [fetchFlagged]);

  function handleReviewClick(message) {
    setSelectedMessage(message);
    setReviewDialogOpen(true);
  }

  function handleReviewed(messageId, reviewData) {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              aiMetadata: {
                ...msg.aiMetadata,
                reviewedBy: reviewData.reviewedBy,
                reviewedAt: reviewData.reviewedAt,
                reviewNotes: reviewData.reviewNotes,
              },
            }
          : msg
      )
    );

    // Update summary counts
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            pendingReview: Math.max(0, prev.pendingReview - 1),
            reviewed: prev.reviewed + 1,
          }
        : prev
    );
  }

  if (error && !loading) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchFlagged()}
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
        <div className="mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/training">
              <ArrowLeft className="h-4 w-4" />
              Back to Training
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Flagged Q&A Review
        </h1>
        <p className="text-sm text-muted-foreground">
          Review AI chatbot responses flagged for sensitive content. Ensure
          employees receive accurate, appropriate information.
        </p>
      </div>

      {/* Summary stat cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Flagged</CardDescription>
              <CardTitle className="text-2xl">{summary.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                All flagged responses
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle
                className={cn(
                  "text-2xl",
                  summary.pendingReview > 0 && "text-yellow-600"
                )}
              >
                {summary.pendingReview}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Awaiting admin review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Reviewed</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {summary.reviewed}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Marked as reviewed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="wvpp_content">WVPP Content</SelectItem>
              <SelectItem value="sb553_general">SB 553 General</SelectItem>
              <SelectItem value="reporting">Reporting</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(statusFilter !== "all" || categoryFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : messages.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              No flagged messages
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter !== "all" || categoryFilter !== "all"
                ? "No messages match the current filters. Try adjusting your filters."
                : "No AI responses have been flagged for review yet. Flagged messages will appear here when the AI detects sensitive topics in employee conversations."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {messages.length} flagged message{messages.length !== 1 ? "s" : ""}
          </p>
          {messages.map((msg) => (
            <FlaggedMessageCard
              key={msg._id}
              message={msg}
              onReviewClick={handleReviewClick}
            />
          ))}
        </div>
      )}

      {/* Review dialog */}
      <ReviewDialog
        message={selectedMessage}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
