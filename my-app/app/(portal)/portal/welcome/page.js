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
import {
  Shield,
  GraduationCap,
  MessageCircle,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: GraduationCap,
    title: "Complete Your Training",
    description:
      "Work through required SB 553 workplace violence prevention training modules at your own pace. Each module includes a short video and quiz.",
    href: "/portal/training",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    icon: FileText,
    title: "Review Your WVPP",
    description:
      "Read your employer's Workplace Violence Prevention Plan. This plan outlines how your workplace identifies and addresses safety hazards.",
    href: "/portal/wvpp",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: MessageCircle,
    title: "Ask Questions",
    description:
      "Have questions about workplace safety or your WVPP? Use the AI-powered Q&A to get instant answers anytime.",
    href: "/portal/chat",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
  },
];

export default function WelcomePage() {
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
          throw new Error("Failed to load data");
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

  const { employee, organization } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Welcome header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to SafeWorkCA, {employee.firstName}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          You&apos;ve been added to <strong>{organization.name}</strong>&apos;s
          workplace safety portal. California law (SB 553) requires all
          employees to complete workplace violence prevention training.
        </p>
      </div>

      {/* What to expect */}
      <Card>
        <CardHeader>
          <CardTitle>What You&apos;ll Do</CardTitle>
          <CardDescription>
            Here&apos;s what&apos;s ahead in your compliance training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex items-start gap-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      step.bg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", step.color)} />
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="h-6 w-px bg-border" />
                  )}
                </div>
                <div className="min-w-0 pt-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Key info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div className="text-sm">
              <p className="font-medium">Your account is set up</p>
              <p className="mt-0.5 text-muted-foreground">
                You can return to this portal anytime to continue training,
                review documents, or ask questions about workplace safety.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/portal/training">
            Get Started with Training
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/portal">Go to Portal Home</Link>
        </Button>
      </div>
    </div>
  );
}
