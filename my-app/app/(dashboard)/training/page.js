"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
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
import { cn } from "@/lib/utils";

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function TrainingStatusBadge({ employee }) {
  const now = new Date();
  const nextDue = employee.nextTrainingDueDate
    ? new Date(employee.nextTrainingDueDate)
    : null;
  const hasInitial = !!employee.initialTrainingCompletedAt;

  if (!hasInitial) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
        <AlertTriangle className="h-3 w-3" />
        Not Started
      </span>
    );
  }

  if (nextDue && nextDue < now) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
        <AlertCircle className="h-3 w-3" />
        Overdue
      </span>
    );
  }

  if (nextDue) {
    const daysUntil = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 30) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3" />
          Due in {daysUntil}d
        </span>
      );
    }
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
      <CheckCircle2 className="h-3 w-3" />
      Current
    </span>
  );
}

export default function TrainingPage() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, recRes] = await Promise.all([
          fetch("/api/employees?active=true"),
          fetch("/api/training"),
        ]);

        if (!empRes.ok) {
          const body = await empRes.json();
          throw new Error(body.error || "Failed to load employees");
        }
        if (!recRes.ok) {
          const body = await recRes.json();
          throw new Error(body.error || "Failed to load training records");
        }

        const [empData, recData] = await Promise.all([
          empRes.json(),
          recRes.json(),
        ]);
        setEmployees(empData);
        setRecords(recData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

  // Compute stats
  const totalEmployees = employees.length;
  const now = new Date();

  const trained = employees.filter(
    (e) => e.initialTrainingCompletedAt
  ).length;

  const overdue = employees.filter((e) => {
    if (!e.nextTrainingDueDate) return false;
    return new Date(e.nextTrainingDueDate) < now;
  }).length;

  const dueSoon = employees.filter((e) => {
    if (!e.nextTrainingDueDate) return false;
    const due = new Date(e.nextTrainingDueDate);
    const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  }).length;

  const notStarted = employees.filter(
    (e) => !e.initialTrainingCompletedAt
  ).length;

  const completionRate =
    totalEmployees > 0 ? Math.round((trained / totalEmployees) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training</h1>
          <p className="text-sm text-muted-foreground">
            Track employee training compliance per California LC 6401.9.
          </p>
        </div>
        <Button asChild>
          <Link href="/training/records">
            <ClipboardList className="h-4 w-4" />
            View Records
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Training Completion</CardDescription>
            <CardTitle className="text-2xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completionRate} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {trained} of {totalEmployees} employees trained
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Started</CardDescription>
            <CardTitle
              className={cn("text-2xl", notStarted > 0 && "text-red-600")}
            >
              {notStarted}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Employees with no training record
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle
              className={cn("text-2xl", overdue > 0 && "text-red-600")}
            >
              {overdue}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Past annual training due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due Soon</CardDescription>
            <CardTitle
              className={cn("text-2xl", dueSoon > 0 && "text-yellow-600")}
            >
              {dueSoon}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Due within next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent records summary */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Training Records</CardTitle>
            <CardDescription>
              Last {Math.min(records.length, 5)} completed training sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.slice(0, 5).map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{record.moduleName}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.trainingType === "initial"
                        ? "Initial"
                        : record.trainingType === "annual"
                          ? "Annual"
                          : record.trainingType === "new_hazard"
                            ? "New Hazard"
                            : "Plan Update"}{" "}
                      — {formatDate(record.trainingDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    {record.completedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
                        <Clock className="h-3 w-3" />
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          {records.length > 5 && (
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/training/records">View All Records</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Employee training status list */}
      {totalEmployees === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No employees yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add employees to start tracking training compliance.
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
              Employee Training Status
            </CardTitle>
            <CardDescription>
              Training compliance for all active employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.map((emp) => (
                <div
                  key={emp._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emp.jobTitle}
                      {emp.lastAnnualTrainingCompletedAt &&
                        ` — Last trained: ${formatDate(emp.lastAnnualTrainingCompletedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrainingStatusBadge employee={emp} />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/employees/${emp._id}`}>View</Link>
                    </Button>
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
