import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useSite } from "@/lib/SiteContext";
import PageHeader from "@/components/ui-kit/PageHeader";
import ChatMessage from "@/components/assistant/ChatMessage";
import ChatInput from "@/components/assistant/ChatInput";
import SuggestedQuestions from "@/components/assistant/SuggestedQuestions";
import { Sparkles } from "lucide-react";

export default function Assistant() {
  const { activeSite } = useSite();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim() || loading || !activeSite) return;
    setError(null);
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("askAssistant", {
        question: text,
        site_id: activeSite.id,
        history,
      });
      setMessages((m) => [...m, { role: "assistant", content: res.data.answer }]);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-4xl mx-auto w-full px-4 lg:px-8 py-6">
      <PageHeader
        eyebrow="AI Agronomist"
        title="Assistant"
        description={activeSite ? `Ask anything about ${activeSite.name} — live data included.` : "Select a site to begin."}
      />
      <div className="flex-1 overflow-y-auto agri-scroll mt-4 space-y-4 pb-4">
        {messages.length === 0 && !loading && (
          <SuggestedQuestions onPick={send} />
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Analyzing your farm data…
          </div>
        )}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={send} disabled={loading || !activeSite} />
    </div>
  );
}