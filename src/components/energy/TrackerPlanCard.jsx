import React from "react";
import Pill from "@/components/ui-kit/Pill";
import { Slider } from "@/components/ui/slider";

const strategyStyle = {
  maximize_energy: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  balanced: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  crop_light_priority: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  heat_protection: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

export default function TrackerPlanCard({ plan, zone, isAdmin, onWeightChange }) {
  const dliPct = plan.dli_target ? Math.min(100, (plan.dli_projected / plan.dli_target) * 100) : 0;
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-foreground">{plan.zone}</div>
          <div className="text-xs text-muted-foreground capitalize">{plan.crop ? `${plan.crop} · ${plan.growth_stage}` : "Solar only"}</div>
        </div>
        <Pill className={strategyStyle[plan.strategy]}>{plan.strategy.replace(/_/g, " ")}</Pill>
      </div>
      <p className="text-xs text-foreground mb-2">{plan.action}</p>
      {plan.dli_target > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Light budget (DLI)</span>
            <span className="font-mono text-foreground">{plan.dli_projected} / {plan.dli_target} mol/m²</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${dliPct >= 90 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${dliPct}%` }} />
          </div>
        </div>
      )}
      <ul className="text-[11px] text-muted-foreground space-y-0.5 mb-3 list-disc pl-4">
        {(plan.reasoning || []).map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      {zone && zone.type !== "solar" && zone.crop && (
        <div>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
            <span>Energy priority</span>
            <span className="font-semibold text-foreground">{zone.crop_priority ?? 50}% crop</span>
            <span>Crop priority</span>
          </div>
          <Slider value={[zone.crop_priority ?? 50]} min={0} max={100} step={5} disabled={!isAdmin}
            onValueCommit={(v) => onWeightChange(zone, v[0])} />
        </div>
      )}
    </div>
  );
}