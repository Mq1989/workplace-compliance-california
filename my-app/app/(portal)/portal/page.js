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
  GraduationCap,
  MessageCircle,
  FileText,
  FolderOpen,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
  Loader2,
  AlertCircle,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    label: "Complete",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/50",
  },
  in_progress: {
    icon: PlayCircle,
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
  },
  not_started: {
    icon: Circle,
    label: "Not Started",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  locked: {
    icon: Lock,
    label: "Locked",
    color: "text-muted-foreground/50",
    bg: "bg-muted/30",
  },
};

function ModuleStatusIcon({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const Icon = config.icon;
  return <Icon className={cn("h-5 w-5", config.color, className)} />;
}

export default function PortalDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/portal/dashboard");
        if (!res.ok) {
          if (res.status === 404) {
            setData(null);
            setLoading(false);
            return;
          }
          throw new Error("Failed to load portal data");
        }
        const json = await res.json();
        setData(json);
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
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Account Not Found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your employee record could not be found. Please contact your
            manager.
          </p>
        </div>
      </div>
    );
  }

  const { employee, organization, training } = data;

  // Determine which modules are locked (sequential — only unlock next after previous completed)
  const modulesWithLock = training.modules.map((mod, index) => {
    if (index === 0) return { ...mod, locked: false };
    const prevModule = training.modules[index - 1];
    const locked = prevModule.status !== "completed";
    return { ...mod, locked };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {employee.firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {organization.name} — Employee Portal
        </p>
      </div>

      {/* Training Progress Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Training Progress
              </CardTitle>
              <CardDescription>
                {training.trainingComplete
                  ? "All training modules completed"
                  : `${training.completedModules} of ${training.totalModules} modules complete`}
              </CardDescription>
            </div>
            {training.trainingComplete && (
              <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                <Award className="h-4 w-4" />
                Complete
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium tabular-nums">
                {training.overallProgress}%
              </span>
            </div>
            <Progress value={training.overallProgress} className="h-3" />
          </div>

          {/* Module list */}
          <div className="space-y-2">
            {modulesWithLock.map((mod) => {
              const effectiveStatus = mod.locked ? "locked" : mod.status;
              const config =
                STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.not_started;
              const isClickable = !mod.locked;

              const content = (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    isClickable
                      ? "hover:bg-accent/50 cursor-pointer"
                      : "opacity-60"
                  )}
                >
                  <ModuleStatusIcon status={effectiveStatus} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        mod.locked && "text-muted-foreground"
                      )}
                    >
                      {mod.order}. {mod.title}
                    </p>
                    {mod.videoDurationMinutes > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {mod.videoDurationMinutes} min
                        {mod.hasQuiz ? " + quiz" : ""}
                        {mod.status === "completed" && mod.bestScore > 0 && (
                          <> &middot; Score: {mod.bestScore}%</>
                        )}
                      </p>
                    )}
                  </div>
                  {isClickable && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              );

              if (isClickable) {
                return (
                  <Link
                    key={mod._id}
                    href={`/portal/training/${mod._id}`}
                  >
                    {content}
                  </Link>
                );
              }

              return <div key={mod._id}>{content}</div>;
            })}
          </div>

          {/* Continue button */}
          {training.nextModule && (
            <Button asChild className="w-full">
              <Link href={`/portal/training/${training.nextModule._id}`}>
                {training.nextModule.status === "in_progress"
                  ? "Continue Training"
                  : "Start Next Module"}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-3 p-4"
              asChild
            >
              <Link href="/portal/training">
                <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/50">
                  <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Training</p>
                  <p className="text-xs text-muted-foreground">
                    View all training modules
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-3 p-4"
              asChild
            >
              <Link href="/portal/chat">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/50">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Ask a Question</p>
                  <p className="text-xs text-muted-foreground">
                    AI-powered Q&A about your WVPP
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-3 p-4"
              asChild
            >
              <Link href="/portal/wvpp">
                <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/50">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">View WVPP</p>
                  <p className="text-xs text-muted-foreground">
                    Your workplace violence prevention plan
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-3 p-4"
              asChild
            >
              <Link href="/portal/documents">
                <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-950/50">
                  <FolderOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Documents</p>
                  <p className="text-xs text-muted-foreground">
                    Certificates and acknowledgments
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
