"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertCircle,
  Download,
  FilePlus,
  Filter,
  ShieldCheck,
  GraduationCap,
  ClipboardList,
  Calendar,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPE_CONFIG = {
  wvpp_full: { label: "WVPP (Full)", icon: FileText, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  wvpp_summary: { label: "WVPP Summary", icon: FileText, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  emergency_contacts: { label: "Emergency Contacts", icon: FileText, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  incident_report_form: { label: "Incident Report Form", icon: ClipboardList, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  training_acknowledgment: { label: "Training Acknowledgment", icon: GraduationCap, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  employee_acknowledgment: { label: "Employee Acknowledgment", icon: FileText, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  incident_log_export: { label: "Incident Log", icon: ClipboardList, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  training_records_export: { label: "Training Records", icon: GraduationCap, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  compliance_report: { label: "Compliance Report", icon: ShieldCheck, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  posting_notice: { label: "Posting Notice", icon: FileText, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  training_certificate: { label: "Training Certificate", icon: GraduationCap, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

function TypeBadge({ type }) {
  const config = DOCUMENT_TYPE_CONFIG[type] || { label: type, icon: FileText, color: "bg-gray-100 text-gray-800" };
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", config.color)}>
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

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [generating, setGenerating] = useState(null);
  const [generateError, setGenerateError] = useState("");

  // Certificate dialog state
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [certDate, setCertDate] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Incident log dialog state
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentStartDate, setIncidentStartDate] = useState("");
  const [incidentEndDate, setIncidentEndDate] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to load documents");
      }
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function fetchEmployees() {
    try {
      setLoadingEmployees(true);
      const res = await fetch("/api/employees?active=true");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch {
      // Silently handle — user can still enter manually
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function generateDocument(type, body = {}) {
    try {
      setGenerating(type);
      setGenerateError("");
      const res = await fetch(`/api/documents/generate/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate document");
      }

      const doc = await res.json();

      // Trigger download immediately
      window.open(`/api/documents/${doc._id}/download`, "_blank");

      // Refresh list
      await fetchDocuments();
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setGenerating(null);
    }
  }

  function handleGenerateIncidentLog() {
    setIncidentDialogOpen(true);
  }

  function handleConfirmIncidentLog() {
    setIncidentDialogOpen(false);
    const body = {};
    if (incidentStartDate) body.startDate = incidentStartDate;
    if (incidentEndDate) body.endDate = incidentEndDate;
    generateDocument("incident_log", body);
    setIncidentStartDate("");
    setIncidentEndDate("");
  }

  function handleGenerateCertificate() {
    setCertDialogOpen(true);
    fetchEmployees();
  }

  function handleConfirmCertificate() {
    if (!selectedEmployeeId) return;
    setCertDialogOpen(false);
    const body = { employeeId: selectedEmployeeId };
    if (certDate) body.completionDate = certDate;
    generateDocument("training_certificate", body);
    setSelectedEmployeeId("");
    setCertDate("");
  }

  function handleGenerateComplianceReport() {
    generateDocument("compliance_report");
  }

  function handleDownload(docId) {
    window.open(`/api/documents/${docId}/download`, "_blank");
  }

  const hasActiveFilters = typeFilter !== "all";

  if (error && documents.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError("");
            fetchDocuments();
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage compliance documents, certificates, and reports.
          </p>
        </div>
      </div>

      {/* Generate error */}
      {generateError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {generateError}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-red-600" />
              <CardTitle className="text-base">Incident Log</CardTitle>
            </div>
            <CardDescription>
              Export incident log as PDF with optional date range filter.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleGenerateIncidentLog}
              disabled={generating === "incident_log"}
              size="sm"
            >
              {generating === "incident_log" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Training Certificate</CardTitle>
            </div>
            <CardDescription>
              Generate a training completion certificate for an employee.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleGenerateCertificate}
              disabled={generating === "training_certificate"}
              size="sm"
            >
              {generating === "training_certificate" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Compliance Report</CardTitle>
            </div>
            <CardDescription>
              Generate a full SB 553 compliance status report with scores.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={handleGenerateComplianceReport}
              disabled={generating === "compliance_report"}
              size="sm"
            >
              {generating === "compliance_report" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filter:
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="incident_log_export">Incident Log</SelectItem>
            <SelectItem value="training_certificate">Training Certificate</SelectItem>
            <SelectItem value="compliance_report">Compliance Report</SelectItem>
            <SelectItem value="wvpp_full">WVPP (Full)</SelectItem>
            <SelectItem value="wvpp_summary">WVPP Summary</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => setTypeFilter("all")}>
            Clear Filters
          </Button>
        )}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              {hasActiveFilters
                ? "No documents match your filter"
                : "No documents generated yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your filter criteria."
                : "Use the Generate buttons above to create compliance documents."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-6" onClick={() => setTypeFilter("all")}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents list */}
      {!loading && documents.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc._id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{doc.fileName}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      Generated {formatRelativeTime(doc.generatedAt || doc.createdAt)}
                      {doc.fileSize && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          {formatFileSize(doc.fileSize)}
                        </>
                      )}
                      {doc.version > 1 && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          v{doc.version}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <TypeBadge type={doc.type} />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {doc.dateRangeStart && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(doc.dateRangeStart)} — {formatDate(doc.dateRangeEnd)}
                      </span>
                    )}
                    {doc.metadata?.employeeName && (
                      <span>Employee: {doc.metadata.employeeName}</span>
                    )}
                    {doc.metadata?.overallScore !== undefined && (
                      <span>Score: {doc.metadata.overallScore}%</span>
                    )}
                    {doc.metadata?.incidentCount !== undefined && (
                      <span>{doc.metadata.incidentCount} incident{doc.metadata.incidentCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc._id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Incident Log Date Range Dialog */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Incident Log</DialogTitle>
            <DialogDescription>
              Optionally select a date range for the incident log export. Leave
              blank to include all incidents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="incident-start">Start Date</Label>
              <Input
                id="incident-start"
                type="date"
                value={incidentStartDate}
                onChange={(e) => setIncidentStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="incident-end">End Date</Label>
              <Input
                id="incident-end"
                type="date"
                value={incidentEndDate}
                onChange={(e) => setIncidentEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmIncidentLog}>
              <FilePlus className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Training Certificate Dialog */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Training Certificate</DialogTitle>
            <DialogDescription>
              Select an employee to generate their training completion
              certificate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cert-employee">Employee</Label>
              {loadingEmployees ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading employees...
                </div>
              ) : (
                <Select
                  value={selectedEmployeeId}
                  onValueChange={setSelectedEmployeeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} — {emp.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cert-date">Completion Date (optional)</Label>
              <Input
                id="cert-date"
                type="date"
                value={certDate}
                onChange={(e) => setCertDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the employee&apos;s last training completion
                date.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCertificate}
              disabled={!selectedEmployeeId}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
