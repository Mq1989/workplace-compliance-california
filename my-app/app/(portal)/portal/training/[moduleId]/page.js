"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Video,
  HelpCircle,
  Clock,
  Lock,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/training/VideoPlayer";
import QuizComponent from "@/components/training/QuizComponent";

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

export default function ModulePlayerPage() {
  const { moduleId } = useParams();
  const router = useRouter();

  const [trainingModule, setTrainingModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch module details and employee progress
  const fetchData = useCallback(async () => {
    try {
      const [moduleRes, dashRes] = await Promise.all([
        fetch(`/api/training/modules/${moduleId}`),
        fetch("/api/portal/dashboard"),
      ]);

      if (!moduleRes.ok) {
        if (moduleRes.status === 404) throw new Error("Module not found");
        throw new Error("Failed to load module");
      }
      if (!dashRes.ok) {
        throw new Error("Failed to load training data");
      }

      const moduleData = await moduleRes.json();
      const dashData = await dashRes.json();

      setTrainingModule(moduleData);
      setDashboardData(dashData);

      // Extract progress for this module from dashboard data
      const modProgress = dashData.training.modules.find(
        (m) => m._id === moduleId
      );
      setProgress(modProgress || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if this module is locked (sequential enforcement)
  const isModuleLocked = useCallback(() => {
    if (!dashboardData) return false;
    const modules = dashboardData.training.modules;
    const currentIndex = modules.findIndex((m) => m._id === moduleId);
    if (currentIndex <= 0) return false;
    return modules[currentIndex - 1].status !== "completed";
  }, [dashboardData, moduleId]);

  // Handle video progress update
  const handleVideoProgress = useCallback(
    async ({ videoProgress, lastWatchedPosition }) => {
      try {
        await fetch("/api/training/progress/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId,
            videoProgress,
            lastWatchedPosition,
          }),
        });
      } catch {
        // Silently fail — progress saving is non-blocking
      }
    },
    [moduleId]
  );

  // Handle quiz completion
  const handleQuizComplete = useCallback(
    (results) => {
      // Refresh module progress data
      if (results.moduleCompleted) {
        // Small delay to let the server update
        setTimeout(() => fetchData(), 500);
      } else {
        // Just refresh progress
        setProgress((prev) =>
          prev
            ? {
                ...prev,
                bestScore: Math.max(prev.bestScore || 0, results.bestScore),
                quizPassed: results.passed || prev.quizPassed,
              }
            : prev
        );
      }
    },
    [fetchData]
  );

  // Find next module
  const getNextModule = useCallback(() => {
    if (!dashboardData) return null;
    const modules = dashboardData.training.modules;
    const currentIndex = modules.findIndex((m) => m._id === moduleId);
    if (currentIndex < 0 || currentIndex >= modules.length - 1) return null;
    return modules[currentIndex + 1];
  }, [dashboardData, moduleId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/portal/training">Back to Training</Link>
        </Button>
      </div>
    );
  }

  if (!trainingModule) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Module not found</p>
        <Button variant="outline" asChild>
          <Link href="/portal/training">Back to Training</Link>
        </Button>
      </div>
    );
  }

  // Check if locked
  if (isModuleLocked()) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Lock className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Module Locked</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You must complete the previous module before starting this one.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/portal/training">Back to Training Path</Link>
        </Button>
      </div>
    );
  }

  const categoryLabel =
    CATEGORY_LABELS[trainingModule.category] || trainingModule.category;
  const isCompleted = progress?.status === "completed";
  const videoCompleted = progress?.videoCompleted || false;
  const videoHasNoUrl = !trainingModule.videoUrl;
  const canTakeQuiz = videoCompleted || videoHasNoUrl;
  const nextModule = getNextModule();

  // Calculate module progress
  let modulePercent = 0;
  if (isCompleted) {
    modulePercent = 100;
  } else if (progress?.status === "in_progress") {
    if (trainingModule.hasQuiz) {
      const videoWeight = videoCompleted
        ? 50
        : ((progress?.videoProgress || 0) / 100) * 50;
      const quizWeight = progress?.quizPassed ? 50 : 0;
      modulePercent = Math.round(videoWeight + quizWeight);
    } else {
      modulePercent = progress?.videoProgress || 0;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/portal/training">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Training Path
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                Module {trainingModule.order}
              </span>
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {categoryLabel}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {trainingModule.title}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {trainingModule.description}
            </p>
          </div>

          {isCompleted && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </div>
          )}
        </div>

        {/* Module meta */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {trainingModule.videoDurationMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {trainingModule.videoDurationMinutes} min video
            </span>
          )}
          {trainingModule.hasQuiz && (
            <span className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              {trainingModule.questions?.length || 0} quiz questions (
              {trainingModule.passingScore}% to pass)
            </span>
          )}
        </div>

        {/* Module progress bar */}
        {!isCompleted && progress?.status === "in_progress" && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Module Progress</span>
              <span className="tabular-nums font-medium">{modulePercent}%</span>
            </div>
            <Progress value={modulePercent} className="h-2" />
          </div>
        )}
      </div>

      {/* Step 1: Video */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
              videoCompleted || videoHasNoUrl
                ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                : "border-primary bg-primary/10 text-primary"
            )}
          >
            {videoCompleted || videoHasNoUrl ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              "1"
            )}
          </div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Watch Video
          </h2>
        </div>

        <VideoPlayer
          videoUrl={trainingModule.videoUrl}
          transcript={trainingModule.transcript}
          initialPosition={progress?.lastWatchedPosition || 0}
          initialProgress={progress?.videoProgress || 0}
          videoCompleted={videoCompleted}
          onProgressUpdate={handleVideoProgress}
        />
      </section>

      {/* Step 2: Quiz */}
      {trainingModule.hasQuiz && trainingModule.questions?.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                progress?.quizPassed
                  ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                  : canTakeQuiz
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {progress?.quizPassed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                "2"
              )}
            </div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Knowledge Quiz
            </h2>
          </div>

          {canTakeQuiz ? (
            <QuizComponent
              moduleId={moduleId}
              questions={trainingModule.questions}
              passingScore={trainingModule.passingScore}
              bestScore={progress?.bestScore || 0}
              quizPassed={progress?.quizPassed || false}
              onQuizComplete={handleQuizComplete}
            />
          ) : (
            <Card className="border-dashed opacity-60">
              <CardContent className="flex items-center gap-3 p-4">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Complete the video (at least 90%) to unlock the quiz.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Module Complete / Next Module */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
            <Award className="h-10 w-10 shrink-0 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Module Complete!
              </h3>
              <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                You&apos;ve successfully completed this module.
                {nextModule
                  ? " Continue to the next module to keep progressing."
                  : " You have completed all training modules!"}
              </p>
            </div>
            <div className="flex gap-2">
              {nextModule ? (
                <Button asChild>
                  <Link href={`/portal/training/${nextModule._id}`}>
                    Next Module
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/portal/training">
                    View Training Path
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
