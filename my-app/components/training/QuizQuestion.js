"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  feedback,
}) {
  const [selected, setSelected] = useState([]);
  const isMultiSelect = question.questionType === "select_all";
  const answered = !!feedback;

  const toggleOption = (optionId) => {
    if (answered) return;

    if (isMultiSelect) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    onAnswer(selected);
  };

  return (
    <div className="space-y-5">
      {/* Question header */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </p>
        <h3 className="text-base font-semibold leading-snug">
          {question.questionText}
        </h3>
        {isMultiSelect && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Select all that apply
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isCorrect =
            answered && feedback.correctOptionIds.includes(option.id);
          const isWrongSelected = answered && isSelected && !isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              disabled={answered}
              onClick={() => toggleOption(option.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                !answered && isSelected && "border-primary bg-primary/5",
                !answered &&
                  !isSelected &&
                  "border-border hover:border-primary/50 hover:bg-accent",
                answered && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/50",
                isWrongSelected && "border-red-500 bg-red-50 dark:bg-red-950/50",
                answered && !isCorrect && !isWrongSelected && "border-border opacity-60",
                answered && "cursor-default"
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  isMultiSelect && "rounded-sm",
                  !answered && isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : !answered
                      ? "border-muted-foreground/40"
                      : isCorrect
                        ? "border-green-500 bg-green-500 text-white"
                        : isWrongSelected
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-muted-foreground/30"
                )}
              >
                {answered && isCorrect && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {isWrongSelected && <XCircle className="h-3 w-3" />}
                {!answered && isSelected && (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>

              <span className="flex-1">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && feedback.explanation && (
        <div
          className={cn(
            "rounded-lg border p-3 text-sm",
            feedback.isCorrect
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          )}
        >
          <p className="font-medium mb-1">
            {feedback.isCorrect ? "Correct!" : "Incorrect"}
          </p>
          <p>{feedback.explanation}</p>
        </div>
      )}

      {/* Submit / Next button */}
      {!answered ? (
        <Button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full sm:w-auto"
        >
          Submit Answer
        </Button>
      ) : (
        <Button onClick={feedback.onNext} className="w-full sm:w-auto">
          {questionNumber < totalQuestions ? (
            <>
              Next Question
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            "View Results"
          )}
        </Button>
      )}
    </div>
  );
}
