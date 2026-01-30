"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import { Bot, Loader2 } from "lucide-react";

export default function ChatInterface({ conversationId: initialConversationId }) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(initialConversationId || null);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // Load existing conversation
  const loadConversation = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.messages.map((m) => ({
            _id: m._id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch {
      // Silently fail — start fresh
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, loadConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text) {
    // Optimistic user message
    const tempUserMsg = {
      _id: "temp-user-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }

      const data = await res.json();

      // Set conversation ID from first response
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Replace optimistic user message and add assistant response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempUserMsg._id);
        return [
          ...filtered,
          {
            _id: data.userMessage._id,
            role: "user",
            content: data.userMessage.content,
            createdAt: data.userMessage.createdAt,
          },
          {
            _id: data.assistantMessage._id,
            role: "assistant",
            content: data.assistantMessage.content,
            createdAt: data.assistantMessage.createdAt,
          },
        ];
      });
    } catch (error) {
      // Remove optimistic message and show error
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempUserMsg._id);
        return [
          ...filtered,
          {
            _id: "error-" + Date.now(),
            role: "assistant",
            content: `Sorry, something went wrong: ${error.message}. Please try again.`,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">Ask a Question</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Ask about your company&apos;s Workplace Violence Prevention Plan,
                SB 553 requirements, or any workplace safety questions.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {[
                "What should I do if I witness workplace violence?",
                "How do I report a safety concern?",
                "What are my rights under SB 553?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={sending}
                  className="rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg._id}
                role={msg.role}
                content={msg.content}
                createdAt={msg.createdAt}
              />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t bg-muted/50 px-4 py-2">
        <p className="text-[11px] text-muted-foreground">
          This AI assistant provides general information about workplace violence
          prevention. For legal advice or complex situations, please consult HR or
          legal counsel. All conversations are logged for compliance purposes.
        </p>
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
