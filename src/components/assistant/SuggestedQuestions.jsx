import React from "react";
import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "How are my zones doing right now?",
  "Should I irrigate today given the weather forecast?",
  "Any disease risks I should watch for this week?",
  "How is my PV output vs. the crop shading needs?",
];

export default function SuggestedQuestions({ onPick }) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        Try asking
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="text-left text-sm px-4 py-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}