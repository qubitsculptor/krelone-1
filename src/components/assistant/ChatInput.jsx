import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-2 pt-3 border-t border-border/70">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask about irrigation, crop health, disease risk, PV output…"
        className="flex-1 h-11 rounded-xl border border-input bg-card px-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        disabled={disabled}
      />
      <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={disabled || !text.trim()}>
        <SendHorizonal className="w-4 h-4" />
      </Button>
    </form>
  );
}