"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatMessage({ role, content, createdAt }) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[80%] space-y-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
        {createdAt && (
          <p
            className={cn(
              "text-[10px] text-muted-foreground",
              isUser ? "text-right" : "text-left"
            )}
          >
            {formatTime(createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
