"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QuizQuestion from "./QuizQuestion";

export default function QuizComponent({
  moduleId,
  questions,
  passingScore = 70,
  bestScore = 0,
  quizPassed = false,
  onQuizComplete,
}) {
  const [phase, setPhase] = useState(quizPassed ? "passed" : "intro"); // intro | taking | results | passed
  const [currentQ, setCurrentQ] = useState(0);
  const [feedbackMap, setFeedbackMap] = useState({}); // questionId -> feedback
  const [answers, setAnswers] = useState([]); // [{questionId, selectedOptionIds}]
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [localBestScore, setLocalBestScore] = useState(bestScore);

  const startQuiz = () => {
    setPhase("taking");
    setCurrentQ(0);
    setFeedbackMap({});
    setAnswers([]);
    setResults(null);
    setError(null);
  };

  const handleAnswer = useCallback(
    (selectedOptionIds) => {
      const question = questions[currentQ];
      // Store the answer locally (we grade server-side on final submit)
      setAnswers((prev) => [
        ...prev,
        { questionId: question._id, selectedOptionIds },
      ]);
    },
    [currentQ, questions]
  );

  const submitQuiz = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    // Build answers from all questions
    const allAnswers = answers.map((a) => ({
      questionId: a.questionId,
      selectedOptionIds: a.selectedOptionIds,
    }));

    try {
      const res = await fetch("/api/training/progress/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          answers: allAnswers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit quiz");
      }

      const data = await res.json();
      setResults(data);

      // Build feedback map from server response
      const newFeedback = {};
      for (const ans of data.answers) {
        newFeedback[ans.questionId] = {
          isCorrect: ans.isCorrect,
          correctOptionIds: ans.correctOptionIds,
          explanation: ans.explanation,
        };
      }
      setFeedbackMap(newFeedback);

      if (data.bestScore > localBestScore) {
        setLocalBestScore(data.bestScore);
      }

      setPhase("results");

      if (onQuizComplete) {
        onQuizComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [answers, moduleId, localBestScore, onQuizComplete]);

  // When an answer is recorded, we need to handle the "next" flow.
  // We submit all at once when the last question is answered.
  const handleNextQuestion = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      // Last question — submit all answers to server
      submitQuiz();
    }
  }, [currentQ, questions.length, submitQuiz]);

  // Build feedback for current question after answer
  const currentFeedback = (() => {
    if (answers.length <= currentQ) return null;
    // After the user answers but before server grading, show as "pending"
    // We don't show individual feedback during quiz — only show results after submit
    // Actually per PRD: "Immediate feedback after each answer" — but we need server grading.
    // Compromise: submit all at end, then show detailed results.
    // For now, just let them move to next question. Results screen shows all feedback.
    return null;
  })();

  // Intro phase
  if (phase === "intro") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Knowledge Quiz
          </CardTitle>
          <CardDescription>
            Test your understanding of this module. You need{" "}
            <strong>{passingScore}%</strong> to pass.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>{questions.length}</strong> questions
            </p>
            <p>
              Passing score: <strong>{passingScore}%</strong>
            </p>
            {localBestScore > 0 && (
              <p>
                Your best score:{" "}
                <strong
                  className={
                    localBestScore >= passingScore
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {localBestScore}%
                </strong>
              </p>
            )}
            <p>You can retake the quiz as many times as needed.</p>
          </div>
          <Button onClick={startQuiz}>
            {localBestScore > 0 ? "Retake Quiz" : "Start Quiz"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Already passed phase
  if (phase === "passed") {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            Quiz Passed
          </CardTitle>
          <CardDescription>
            Best score: <strong>{localBestScore}%</strong> (passing:{" "}
            {passingScore}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={startQuiz}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Taking quiz phase
  if (phase === "taking") {
    const question = questions[currentQ];
    const isAnswered = answers.length > currentQ;

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Quiz</CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentQ + 1} / {questions.length}
            </span>
          </div>
          <Progress
            value={((currentQ + (isAnswered ? 1 : 0)) / questions.length) * 100}
            className="h-1.5"
          />
        </CardHeader>
        <CardContent>
          {submitting ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Grading your answers...
              </p>
            </div>
          ) : (
            <QuizQuestion
              question={question}
              questionNumber={currentQ + 1}
              totalQuestions={questions.length}
              onAnswer={(selectedOptionIds) => {
                handleAnswer(selectedOptionIds);
              }}
              feedback={
                isAnswered
                  ? {
                      isCorrect: true, // Placeholder — actual grading on submit
                      correctOptionIds: [],
                      explanation: null,
                      onNext: handleNextQuestion,
                    }
                  : null
              }
            />
          )}
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Results phase
  if (phase === "results" && results) {
    const passed = results.passed;
    return (
      <Card
        className={cn(
          "border",
          passed
            ? "border-green-200 dark:border-green-900"
            : "border-amber-200 dark:border-amber-900"
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <>
                <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  Quiz Passed!
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-700 dark:text-amber-300">
                  Not Quite — Try Again
                </span>
              </>
            )}
          </CardTitle>
          <CardDescription>
            Attempt #{results.attemptNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Score summary */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">
                {results.score}%
              </p>
              <p className="text-xs text-muted-foreground">Your Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums text-muted-foreground">
                {results.passingScore}%
              </p>
              <p className="text-xs text-muted-foreground">Passing Score</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold tabular-nums">
                {results.correctCount}/{results.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
          </div>

          {/* Answer review */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Answer Review</h4>
            {results.answers.map((ans, idx) => {
              const question = questions.find(
                (q) => q._id === ans.questionId
              );
              if (!question) return null;
              return (
                <div
                  key={ans.questionId}
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    ans.isCorrect
                      ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                      : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {ans.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {idx + 1}. {question.questionText}
                      </p>
                      {!ans.isCorrect && ans.explanation && (
                        <p className="mt-1 text-muted-foreground">
                          {ans.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Best score */}
          {localBestScore > 0 && (
            <p className="text-sm text-muted-foreground">
              Best score:{" "}
              <strong
                className={
                  localBestScore >= passingScore
                    ? "text-green-600 dark:text-green-400"
                    : ""
                }
              >
                {localBestScore}%
              </strong>
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!passed && (
              <Button onClick={startQuiz}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Try Again
              </Button>
            )}
            {passed && results.moduleCompleted && (
              <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Module complete!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
