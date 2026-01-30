"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Send,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REPORT_TYPES = [
  {
    value: "workplace_violence",
    label: "Workplace Violence Incident",
    description: "Physical violence, threats, or aggressive behavior",
  },
  {
    value: "safety_concern",
    label: "Safety Concern",
    description: "Unsafe conditions, equipment, or practices",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "Verbal, physical, or sexual harassment",
  },
  {
    value: "retaliation",
    label: "Retaliation for Reporting",
    description: "Negative consequences for reporting a concern",
  },
  {
    value: "policy_violation",
    label: "Policy Violation",
    description: "Violation of workplace policies or procedures",
  },
  {
    value: "other",
    label: "Other",
    description: "Any other workplace concern",
  },
];

function AnonymousReportContent() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  const [formData, setFormData] = useState({
    reportType: "",
    title: "",
    description: "",
    incidentDate: "",
    incidentLocation: "",
    witnessesPresent: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [copied, setCopied] = useState(false);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function validate() {
    if (!orgId) return "Invalid report link. Please use the link provided by your employer.";
    if (!formData.reportType) return "Please select a report type.";
    if (!formData.title.trim()) return "Please provide a brief title for your report.";
    if (formData.title.trim().length > 200) return "Title must be 200 characters or fewer.";
    if (!formData.description.trim()) return "Please describe the issue in detail.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        organizationId: orgId,
        reportType: formData.reportType,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (formData.incidentDate) {
        payload.incidentDate = formData.incidentDate;
      }
      if (formData.incidentLocation.trim()) {
        payload.incidentLocation = formData.incidentLocation.trim();
      }
      if (formData.witnessesPresent !== "") {
        payload.witnessesPresent = formData.witnessesPresent === "yes";
      }

      const res = await fetch("/api/anonymous/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit report");
      }

      const data = await res.json();
      setConfirmation({
        anonymousId: data.anonymousId,
        accessToken: data.accessToken,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!confirmation) return;
    const text = `Report ID: ${confirmation.anonymousId}\nAccess Code: ${confirmation.accessToken}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  }

  function handleSubmitAnother() {
    setFormData({
      reportType: "",
      title: "",
      description: "",
      incidentDate: "",
      incidentLocation: "",
      witnessesPresent: "",
    });
    setConfirmation(null);
    setError("");
    setCopied(false);
  }

  // No org ID in URL
  if (!orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Report Link</CardTitle>
            <CardDescription>
              This anonymous reporting form requires a valid organization link.
              Please use the link provided by your employer to submit a report.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Confirmation view
  if (confirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Report Submitted Successfully</CardTitle>
              <CardDescription>
                Your anonymous report has been received and will be reviewed by management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Save this information now!</p>
                    <p className="mt-1">
                      This is the <strong>only time</strong> your access code will be shown.
                      You need it to check the status of your report and view responses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Report ID:</span>
                  <span className="font-semibold">{confirmation.anonymousId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Access Code:</span>
                  <span className="font-semibold break-all">{confirmation.accessToken}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Use your Report ID and Access Code to check for updates at:
              </p>
              <div className="text-center">
                <a
                  href={`/anonymous/status?org=${orgId}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Check Report Status
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <a href={`/anonymous/status?org=${orgId}`}>Check Status</a>
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitAnother}
              >
                Submit Another Report
              </Button>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground px-4">
            Your identity is completely protected. This system does not collect or store
            any information that could identify you. Management cannot see who submitted this report.
          </p>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Submit Anonymous Report
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Report workplace concerns safely and anonymously. Your identity is
            completely protected.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Your identity is protected</p>
              <p className="mt-1">
                This system does not collect or store any information that could
                identify you. Management cannot see who submitted this report.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>
                Provide as much detail as you can. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="reportType">
                  Report Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.reportType}
                  onValueChange={(v) => updateField("reportType", v)}
                >
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select the type of report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.reportType && (
                  <p className="text-xs text-muted-foreground">
                    {REPORT_TYPES.find((rt) => rt.value === formData.reportType)?.description}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Brief description of the issue"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.title.length}/200
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe what happened in as much detail as possible. Include dates, times, locations, and any other relevant information."
                  rows={5}
                />
              </div>

              {/* Optional Fields */}
              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium">
                  Optional Details
                </p>
                <p className="text-xs text-muted-foreground">
                  Share only what you are comfortable with. These fields are optional.
                </p>
              </div>

              {/* Incident Date */}
              <div className="space-y-2">
                <Label htmlFor="incidentDate">When did this occur?</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => updateField("incidentDate", e.target.value)}
                />
              </div>

              {/* Incident Location */}
              <div className="space-y-2">
                <Label htmlFor="incidentLocation">Where did this occur?</Label>
                <Input
                  id="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={(e) => updateField("incidentLocation", e.target.value)}
                  placeholder="e.g., Front entrance, break room, parking lot"
                />
              </div>

              {/* Witnesses */}
              <div className="space-y-2">
                <Label htmlFor="witnessesPresent">Were witnesses present?</Label>
                <Select
                  value={formData.witnessesPresent}
                  onValueChange={(v) => updateField("witnessesPresent", v)}
                >
                  <SelectTrigger id="witnessesPresent">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
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

export default function AnonymousReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AnonymousReportContent />
    </Suspense>
  );
}
