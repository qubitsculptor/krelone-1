import React from "react";
import { cn } from "@/lib/agripv";

export default function Pill({ children, className }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize tracking-wide",
      className
    )}>
      {children}
    </span>
  );
}