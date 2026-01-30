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
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
  Loader2,
  AlertCircle,
  Award,
  ArrowLeft,
  Clock,
  HelpCircle,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    label: "Complete",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/50",
    border: "border-green-200 dark:border-green-900",
  },
  in_progress: {
    icon: PlayCircle,
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-900",
  },
  not_started: {
    icon: Circle,
    label: "Not Started",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
  },
  locked: {
    icon: Lock,
    label: "Locked",
    color: "text-muted-foreground/50",
    bg: "bg-muted/30",
    border: "border-border/50",
  },
};

const CATEGORY_LABELS = {
  wvpp_overview: "WVPP Overview",
  reporting_procedures: "Reporting Procedures",
  hazard_recognition: "Hazard Recognition",
  avoidance_strategies: "Avoidance Strategies",
  incident_log: "Incident Log",
  emergency_response: "Emergency Response",
  de_escalation: "De-Escalation",
  active_shooter: "Active Shooter",
};

function ModuleStatusIcon({ status, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const Icon = config.icon;
  return <Icon className={cn("h-5 w-5", config.color, className)} />;
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

export default function TrainingPathPage() {
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
          throw new Error("Failed to load training data");
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

  const { training } = data;

  // Determine which modules are locked (sequential — only unlock next after previous completed)
  const modulesWithLock = training.modules.map((mod, index) => {
    if (index === 0) return { ...mod, locked: false };
    const prevModule = training.modules[index - 1];
    const locked = prevModule.status !== "completed";
    return { ...mod, locked };
  });

  // Calculate total duration
  const totalDuration = training.modules.reduce(
    (sum, mod) => sum + (mod.videoDurationMinutes || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/portal">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Portal
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Training Path
          </h1>
          <p className="mt-1 text-muted-foreground">
            Complete all modules in order to finish your SB 553 workplace
            violence prevention training.
          </p>
        </div>
        {training.trainingComplete && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            <Award className="h-4 w-4" />
            Complete
          </div>
        )}
      </div>

      {/* Progress Summary Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Overall Progress</p>
              <p className="text-2xl font-bold tabular-nums">
                {training.overallProgress}%
              </p>
              <p className="text-sm text-muted-foreground">
                {training.completedModules} of {training.totalModules} modules
                complete
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span>{training.totalModules} modules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>~{totalDuration} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                <span>
                  {training.modules.filter((m) => m.hasQuiz).length} quizzes
                </span>
              </div>
            </div>
          </div>
          <Progress
            value={training.overallProgress}
            className="mt-4 h-3"
          />
        </CardContent>
      </Card>

      {/* Continue button at top if training in progress */}
      {training.nextModule && !training.trainingComplete && (
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/portal/training/${training.nextModule._id}`}>
            {training.nextModule.status === "in_progress"
              ? "Continue Training"
              : "Start Next Module"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      )}

      {/* Module List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Modules</h2>
        {modulesWithLock.map((mod, index) => {
          const effectiveStatus = mod.locked ? "locked" : mod.status;
          const config =
            STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.not_started;
          const isClickable = !mod.locked;
          const categoryLabel =
            CATEGORY_LABELS[mod.category] || mod.category;

          // Calculate individual module progress percentage
          let modulePercent = 0;
          if (mod.status === "completed") {
            modulePercent = 100;
          } else if (mod.status === "in_progress") {
            // Weight: video = 50%, quiz = 50% (if has quiz), otherwise video = 100%
            if (mod.hasQuiz) {
              const videoWeight = mod.videoCompleted ? 50 : (mod.videoProgress / 100) * 50;
              const quizWeight = mod.quizPassed ? 50 : 0;
              modulePercent = Math.round(videoWeight + quizWeight);
            } else {
              modulePercent = mod.videoProgress || 0;
            }
          }

          const cardContent = (
            <Card
              className={cn(
                "transition-all",
                isClickable && "hover:shadow-md hover:border-primary/30",
                mod.locked && "opacity-60",
                config.border
              )}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex gap-4">
                  {/* Step number / status icon */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                        effectiveStatus === "completed"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/50"
                          : effectiveStatus === "in_progress"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50"
                            : "border-muted-foreground/30 bg-muted/30"
                      )}
                    >
                      {effectiveStatus === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : effectiveStatus === "in_progress" ? (
                        <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : effectiveStatus === "locked" ? (
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {mod.order}
                        </span>
                      )}
                    </div>
                    {/* Connector line */}
                    {index < modulesWithLock.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-4",
                          effectiveStatus === "completed"
                            ? "bg-green-300 dark:bg-green-800"
                            : "bg-border"
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={cn(
                            "font-semibold",
                            mod.locked && "text-muted-foreground"
                          )}
                        >
                          {mod.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {mod.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={effectiveStatus} />
                        {isClickable && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                        {categoryLabel}
                      </span>
                      {mod.videoDurationMinutes > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {mod.videoDurationMinutes} min
                        </span>
                      )}
                      {mod.hasQuiz && (
                        <span className="inline-flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" />
                          Quiz
                          {mod.quizPassed && (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          )}
                        </span>
                      )}
                      {mod.bestScore > 0 && (
                        <span className="font-medium">
                          Best Score: {mod.bestScore}%
                        </span>
                      )}
                      {mod.completedAt && (
                        <span>
                          Completed:{" "}
                          {new Date(mod.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Progress bar for in-progress modules */}
                    {effectiveStatus === "in_progress" && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {mod.videoCompleted
                              ? "Video complete — quiz remaining"
                              : `Video: ${mod.videoProgress}%`}
                          </span>
                          <span className="font-medium tabular-nums">
                            {modulePercent}%
                          </span>
                        </div>
                        <Progress value={modulePercent} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );

          if (isClickable) {
            return (
              <Link key={mod._id} href={`/portal/training/${mod._id}`}>
                {cardContent}
              </Link>
            );
          }

          return <div key={mod._id}>{cardContent}</div>;
        })}
      </div>

      {/* Training complete callout */}
      {training.trainingComplete && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Award className="h-10 w-10 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Training Complete!
              </h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                You have completed all required SB 553 workplace violence
                prevention training modules. Your training record has been
                logged for compliance purposes.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/portal/chat">
                  Ask a Question
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/portal/documents">
                  View Certificate
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info footer */}
      <p className="text-xs text-muted-foreground">
        Modules must be completed in order. Each module requires watching the
        video (at least 90%) and passing the quiz with a score of 70% or
        higher. After completing all modules, you may be prompted to ask
        questions via the AI Q&A chatbot to fulfill the interactive training
        requirement.
      </p>
    </div>
  );
}
