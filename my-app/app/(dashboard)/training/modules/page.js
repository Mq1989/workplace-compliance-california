"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  MousePointerClick,
  BookOpen,
  Users,
  BarChart3,
  UserPlus,
  CalendarDays,
  AlertTriangle,
  Trophy,
  CircleDot,
  Lock,
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
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS = {
  wvpp_overview: "WVPP Overview",
  reporting_procedures: "Reporting Procedures",
  hazard_recognition: "Hazard Recognition",
  avoidance_strategies: "Avoidance Strategies",
  incident_log: "Incident Log",
  emergency_response: "Emergency Response",
  de_escalation: "De-escalation",
  active_shooter: "Active Shooter",
};

const TYPE_CONFIG = {
  video: {
    label: "Video",
    icon: Video,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  interactive: {
    label: "Interactive",
    icon: MousePointerClick,
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  document: {
    label: "Document",
    icon: FileText,
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
};

const MODULE_STATUS_CONFIG = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  not_started: {
    label: "Not Started",
    icon: CircleDot,
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

function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.video;
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

function StatusBadge({ status }) {
  const config = MODULE_STATUS_CONFIG[status] || MODULE_STATUS_CONFIG.not_started;
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

// ── Modules Tab ──────────────────────────────────────────────

function ModulesTab({ modules, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No training modules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Run the seed script to populate default SB 553 training modules.
          </p>
          <p className="mt-2 text-xs font-mono text-muted-foreground">
            node --env-file=.env.local lib/seed/trainingModules.js
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {modules.length} module{modules.length !== 1 ? "s" : ""} in the
        training path
      </p>

      {modules.map((mod) => (
        <Card key={mod._id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {mod.order}
                </span>
                <CardTitle className="text-base">{mod.title}</CardTitle>
              </div>
              <CardDescription className="ml-9">
                {mod.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TypeBadge type={mod.type} />
              {mod.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  <Lock className="h-3 w-3" />
                  Inactive
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="ml-9 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium">
                  {CATEGORY_LABELS[mod.category] || mod.category}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration</span>
                <p className="font-medium">
                  {mod.videoDurationMinutes
                    ? `${mod.videoDurationMinutes} min`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Quiz</span>
                <p className="font-medium">
                  {mod.hasQuiz ? (
                    <>
                      Pass: {mod.passingScore}%
                      {mod.maxAttempts > 0
                        ? ` · ${mod.maxAttempts} attempts`
                        : " · Unlimited"}
                    </>
                  ) : (
                    "No quiz"
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Required</span>
                <p className="font-medium">
                  {mod.isRequired ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Analytics row */}
            <div className="ml-9 mt-4 flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {mod.totalCompletions} completion
                {mod.totalCompletions !== 1 ? "s" : ""}
              </span>
              {mod.hasQuiz && mod.avgQuizScore > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Avg score: {Math.round(mod.avgQuizScore)}%
                </span>
              )}
              <span className="flex items-center gap-1">
                v{mod.version}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Reports Tab ──────────────────────────────────────────────

function ReportsTab({ report, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            Unable to load reports.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, modules, employees } = report;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-2xl">{summary.completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={summary.completionRate} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fully Trained</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {summary.fullyTrained}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              of {summary.totalEmployees} employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {summary.inProgress}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Partially completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Started</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                summary.notStarted > 0 && "text-red-600"
              )}
            >
              {summary.notStarted}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              No modules begun
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                summary.overdue > 0 && "text-red-600"
              )}
            >
              {summary.overdue}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-2xl">{summary.totalEmployees}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active roster</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee breakdown */}
      {employees.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No employees</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add employees to see training progress reports.
            </p>
            <Button asChild className="mt-6">
              <Link href="/employees">Manage Employees</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Employee Progress Breakdown
            </CardTitle>
            <CardDescription>
              Per-module completion status for each employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((empReport) => (
                <div
                  key={empReport.employee._id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {empReport.employee.firstName}{" "}
                        {empReport.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {empReport.employee.jobTitle}
                        {empReport.employee.email &&
                          ` · ${empReport.employee.email}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {empReport.completedModules}/{empReport.totalModules}{" "}
                          modules
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {empReport.overallProgress}% complete
                        </p>
                      </div>
                      {empReport.trainingComplete ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </span>
                      ) : empReport.completedModules > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertTriangle className="h-3 w-3" />
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Progress
                      value={empReport.overallProgress}
                      className="h-2"
                    />
                  </div>

                  {/* Per-module breakdown */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {empReport.modules.map((mod) => (
                      <div
                        key={mod.moduleId}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {mod.moduleTitle}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                            <span>Video: {mod.videoProgress}%</span>
                            {mod.quizPassed ? (
                              <span className="text-green-700 dark:text-green-400">
                                Quiz: {mod.bestScore}%
                              </span>
                            ) : mod.bestScore > 0 ? (
                              <span className="text-yellow-700 dark:text-yellow-400">
                                Quiz: {mod.bestScore}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <StatusBadge status={mod.status} />
                      </div>
                    ))}
                  </div>

                  {/* Training dates */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {empReport.initialTrainingCompletedAt && (
                      <span>
                        Initial: {formatDate(empReport.initialTrainingCompletedAt)}
                      </span>
                    )}
                    {empReport.lastAnnualTrainingCompletedAt && (
                      <span>
                        Last annual:{" "}
                        {formatDate(empReport.lastAnnualTrainingCompletedAt)}
                      </span>
                    )}
                    {empReport.nextTrainingDueDate && (
                      <span>
                        Next due: {formatDate(empReport.nextTrainingDueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Assign Tab ───────────────────────────────────────────────

function AssignTab({ employees, loadingEmployees }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [assignError, setAssignError] = useState("");

  function toggleEmployee(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map((e) => e._id));
    }
  }

  async function handleAssign() {
    if (selectedIds.length === 0) return;

    setSubmitting(true);
    setAssignError("");
    setResult(null);

    try {
      const res = await fetch("/api/training/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: selectedIds,
          dueDate: dueDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign training");
      }

      setResult(data);
      setSelectedIds([]);
      setDueDate("");
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="py-12 text-center">
        <CardContent>
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No active employees</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add employees before assigning training.
          </p>
          <Button asChild className="mt-6">
            <Link href="/employees">Manage Employees</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {result && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Training assigned successfully
                </p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  {result.assigned} module assignment
                  {result.assigned !== 1 ? "s" : ""} created for{" "}
                  {result.employees} employee
                  {result.employees !== 1 ? "s" : ""} across{" "}
                  {result.modules} module{result.modules !== 1 ? "s" : ""}.
                  {result.dueDate && (
                    <> Due: {formatDate(result.dueDate)}.</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {assignError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Assignment failed
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {assignError}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Employees</CardTitle>
          <CardDescription>
            Choose employees to assign all active training modules. Existing
            assignments are skipped automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Select all */}
          <div className="mb-4 flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                selectedIds.length === employees.length && employees.length > 0
              }
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              Select all ({employees.length})
            </Label>
          </div>

          <Separator className="mb-4" />

          {/* Employee list */}
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {employees.map((emp) => (
              <div
                key={emp._id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <Checkbox
                  id={`emp-${emp._id}`}
                  checked={selectedIds.includes(emp._id)}
                  onCheckedChange={() => toggleEmployee(emp._id)}
                />
                <Label
                  htmlFor={`emp-${emp._id}`}
                  className="flex-1 cursor-pointer"
                >
                  <p className="text-sm font-medium">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {emp.jobTitle}
                    {emp.department && ` · ${emp.department}`}
                  </p>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="due-date" className="text-sm">
              Due Date (optional)
            </Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-[200px]"
            />
          </div>
          <Button
            onClick={handleAssign}
            disabled={selectedIds.length === 0 || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Assign Training
            {selectedIds.length > 0 && ` (${selectedIds.length})`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function TrainingModulesPage() {
  const [modules, setModules] = useState([]);
  const [report, setReport] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [modRes, repRes, empRes] = await Promise.all([
          fetch("/api/training/modules"),
          fetch("/api/training/reports"),
          fetch("/api/employees?active=true"),
        ]);

        if (modRes.ok) {
          setModules(await modRes.json());
        }
        setLoadingModules(false);

        if (repRes.ok) {
          setReport(await repRes.json());
        }
        setLoadingReport(false);

        if (empRes.ok) {
          setEmployees(await empRes.json());
        }
        setLoadingEmployees(false);
      } catch (err) {
        setError(err.message);
        setLoadingModules(false);
        setLoadingReport(false);
        setLoadingEmployees(false);
      }
    }
    fetchAll();
  }, []);

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
          Training Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage LMS modules, view completion reports, and assign training to
          employees.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">
            <BookOpen className="mr-1.5 h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Completion Reports
          </TabsTrigger>
          <TabsTrigger value="assign">
            <UserPlus className="mr-1.5 h-4 w-4" />
            Assign Training
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <ModulesTab modules={modules} loading={loadingModules} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab report={report} loading={loadingReport} />
        </TabsContent>

        <TabsContent value="assign">
          <AssignTab
            employees={employees}
            loadingEmployees={loadingEmployees}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
