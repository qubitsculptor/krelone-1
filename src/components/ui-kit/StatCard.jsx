import React, { useMemo } from "react";
import { cn } from "@/lib/agripv";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const accents = {
  emerald: { icon: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400", stroke: "#34d399" },
  amber:   { icon: "text-amber-600 bg-amber-500/10 dark:text-amber-400", stroke: "#fbbf24" },
  sky:     { icon: "text-sky-600 bg-sky-500/10 dark:text-sky-400", stroke: "#38bdf8" },
  rose:    { icon: "text-rose-600 bg-rose-500/10 dark:text-rose-400", stroke: "#fb7185" },
  violet:  { icon: "text-violet-600 bg-violet-500/10 dark:text-violet-400", stroke: "#a78bfa" },
};

export default function StatCard({ label, value, unit, icon: Icon, trend, accent = "emerald" }) {
  const a = accents[accent] || accents.emerald;
  const spark = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ i, v: 40 + Math.sin(i / 2.5) * 18 + Math.random() * 22 })),
    []
  );
  const gid = `spark-${accent}`;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200">
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 -mt-1.5", a.icon)}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-medium text-foreground tracking-tight">{value}</span>
          {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
        </div>
        {trend && <p className="text-xs text-muted-foreground mt-1.5 truncate">{trend}</p>}
      </div>
      <div className="h-12 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={a.stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={a.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={a.stroke} strokeWidth={1.5} fill={`url(#${gid})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}