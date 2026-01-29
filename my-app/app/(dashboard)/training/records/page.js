"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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

const TRAINING_TYPE_CONFIG = {
  initial: {
    label: "Initial",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  annual: {
    label: "Annual",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  new_hazard: {
    label: "New Hazard",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  plan_update: {
    label: "Plan Update",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

function TypeBadge({ type }) {
  const config = TRAINING_TYPE_CONFIG[type] || TRAINING_TYPE_CONFIG.initial;
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

export default function TrainingRecordsPage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (employeeFilter && employeeFilter !== "all")
        params.set("employeeId", employeeFilter);
      if (typeFilter && typeFilter !== "all")
        params.set("trainingType", typeFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/training?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to load training records");
      }
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employeeFilter, typeFilter, startDate, endDate]);

  // Fetch employees for the filter dropdown (only once)
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/employees?active=all");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch {
        // Non-critical — filter just won't show employee names
      }
    }
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Build an employee lookup map
  const employeeMap = {};
  for (const emp of employees) {
    employeeMap[emp._id] = `${emp.firstName} ${emp.lastName}`;
  }

  if (error && records.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError("");
            fetchRecords();
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
      <div className="flex items-center justify-between">
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
            Training Records
          </h1>
          <p className="text-sm text-muted-foreground">
            All training records with 1-year minimum retention per LC 6401.9.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="initial">Initial</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="new_hazard">New Hazard</SelectItem>
            <SelectItem value="plan_update">Plan Update</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[160px]"
            placeholder="Start date"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[160px]"
            placeholder="End date"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && records.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ClipboardList className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              {employeeFilter !== "all" ||
              typeFilter !== "all" ||
              startDate ||
              endDate
                ? "No records match your filters"
                : "No training records yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {employeeFilter !== "all" ||
              typeFilter !== "all" ||
              startDate ||
              endDate
                ? "Try adjusting your filter criteria."
                : "Training records will appear here as employees complete training."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Records list */}
      {!loading && records.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4">
            {records.map((record) => (
              <Card key={record._id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {record.moduleName}
                    </CardTitle>
                    <CardDescription>
                      {employeeMap[record.employeeId] || "Unknown Employee"} —{" "}
                      {formatDate(record.trainingDate)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <TypeBadge type={record.trainingType} />
                    {record.completedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="h-3 w-3" />
                        In Progress
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Trainer</span>
                      <p className="font-medium">{record.trainerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration</span>
                      <p className="font-medium">
                        {record.durationMinutes
                          ? `${record.durationMinutes} min`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quiz</span>
                      <p className="font-medium">
                        {record.quizPassed !== undefined ? (
                          record.quizPassed ? (
                            <span className="text-green-700 dark:text-green-400">
                              Passed
                              {record.quizScore !== undefined &&
                                ` (${record.quizScore}%)`}
                            </span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400">
                              Not Passed
                              {record.quizScore !== undefined &&
                                ` (${record.quizScore}%)`}
                            </span>
                          )
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </div>
                  {record.contentSummary && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">
                        Content Summary
                      </span>
                      <p className="mt-0.5 text-sm line-clamp-2">
                        {record.contentSummary}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {record.employeeAcknowledged && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Acknowledged {formatDate(record.acknowledgedAt)}
                      </span>
                    )}
                    {record.completedAt && (
                      <span>Completed {formatDate(record.completedAt)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
