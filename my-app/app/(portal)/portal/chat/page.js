"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChatInterface from "@/components/chat/ChatInterface";
import {
  MessageCircle,
  Plus,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Clock,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const d = new Date(dateString);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  function handleNewConversation() {
    setActiveConversationId(null);
    setShowSidebar(false);
  }

  function handleSelectConversation(convId) {
    setActiveConversationId(convId);
    setShowSidebar(false);
  }

  function handleBackToList() {
    setShowSidebar(true);
    fetchConversations();
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Conversation list view
  if (showSidebar) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Ask a Question
            </h1>
            <p className="mt-1 text-muted-foreground">
              AI-powered Q&A about your Workplace Violence Prevention Plan and
              SB 553 requirements
            </p>
          </div>
          <Button onClick={handleNewConversation} className="gap-2">
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {/* Conversations list */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium">No conversations yet</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground max-w-sm">
                Start a conversation to ask questions about your workplace
                violence prevention plan, reporting procedures, or SB 553
                compliance.
              </p>
              <Button onClick={handleNewConversation} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Start a Conversation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.conversationId}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => handleSelectConversation(conv.conversationId)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {conv.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(conv.lastMessageAt)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Active conversation view
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b pb-3">
        <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Conversations
        </Button>
        <div className="h-4 w-px bg-border" />
        <p className="text-sm text-muted-foreground">
          {activeConversationId ? "Conversation" : "New Conversation"}
        </p>
      </div>

      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          key={activeConversationId || "new"}
          conversationId={activeConversationId}
        />
      </div>
    </div>
  );
}
