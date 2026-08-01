import React from "react";
import ReactMarkdown from "react-markdown";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/agripv";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 mr-2.5 mt-1">
          <Leaf className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border/70 shadow-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}