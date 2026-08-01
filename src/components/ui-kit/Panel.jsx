import React from "react";
import { cn } from "@/lib/agripv";

export default function Panel({ className, children, title, icon: Icon, action }) {
  return (
    <div className={cn(
      "rounded-[1.25rem] border border-border/70 bg-card shadow-[0_1px_2px_rgba(20,30,20,0.04),0_10px_28px_-16px_rgba(20,30,20,0.10)]",
      className
    )}>
      {title && (
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <h3 className="font-heading font-semibold text-foreground text-[15px] tracking-tight">{title}</h3>
          </div>
          {action}
        </div>
      )}
      <div className={title ? "px-6 pb-6" : "p-6"}>{children}</div>
    </div>
  );
}