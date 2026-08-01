// Shared design tokens & helpers for AgriPV OS

export const statusColor = {
  optimal: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  attention: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
  critical: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25",
  online: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  degraded: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
  offline: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/25",
  underperforming: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
  fault: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25",
};

export const severityColor = {
  critical: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
  high: "text-orange-700 dark:text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/30",
};

export const priorityColor = {
  urgent: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
  high: "text-orange-700 dark:text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/30",
};

export const executionModes = [
  { id: "observe", label: "Observe", desc: "Watch only, no action" },
  { id: "recommend", label: "Recommend", desc: "Suggest actions to operators" },
  { id: "approve", label: "Approve & Execute", desc: "Execute after human approval" },
  { id: "autonomous", label: "Fully Autonomous", desc: "Closed-loop, no human needed" },
];

export function pct(n) {
  return `${Math.round(n || 0)}%`;
}

export function cn(...c) {
  return c.filter(Boolean).join(" ");
}