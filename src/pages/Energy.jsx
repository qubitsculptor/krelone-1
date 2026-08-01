import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Gauge, TrendingUp, Sparkles, DollarSign } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import StatCard from "@/components/ui-kit/StatCard";
import Pill from "@/components/ui-kit/Pill";
import { statusColor, pct } from "@/lib/agripv";
import { useSite } from "@/lib/SiteContext";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";
import TrackerStrategyPanel from "@/components/energy/TrackerStrategyPanel";

export default function Energy() {
  const [assets, setAssets] = useState([]);
  const { activeSite } = useSite();
  useEffect(() => {
    if (!activeSite) return;
    base44.entities.EnergyAsset.filter({ site_id: activeSite.id }).then(setAssets);
  }, [activeSite]);

  const output = assets.reduce((s, a) => s + (a.current_output_kw || 0), 0);
  const capacity = assets.reduce((s, a) => s + (a.capacity_kw || 0), 0);
  const avgPR = assets.length ? assets.reduce((s, a) => s + (a.performance_ratio || 0), 0) / assets.length : 0;
  const revenue = Math.round(output * 24 * 0.08);
  const chartData = assets.map((a) => ({ name: a.name.replace(/inverter|string/i, "").trim() || a.name, pr: Math.round(a.performance_ratio || 0), status: a.status }));

  return (
    <div>
      <PageHeader eyebrow="Energy Module" title="Solar Performance"
        subtitle="PV generation, inverter health, performance ratio and revenue — with cleaning and fault intelligence." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Live Output" value={Math.round(output)} unit="kW" icon={Zap} accent="amber" />
        <StatCard label="Capacity Factor" value={pct(capacity ? (output / capacity) * 100 : 0)} icon={Gauge} accent="emerald" />
        <StatCard label="Perf. Ratio" value={pct(avgPR)} icon={TrendingUp} accent="sky" />
        <StatCard label="Est. Revenue / day" value={`$${revenue.toLocaleString()}`} icon={DollarSign} accent="violet" />
      </div>

      <TrackerStrategyPanel />

      <Panel title="Performance Ratio by Asset" icon={Sparkles} className="mb-6">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="pr" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.status === "fault" ? "#fb7185" : d.status === "underperforming" ? "#fbbf24" : "#34d399"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Asset Health & Diagnostics" icon={Gauge}>
        <div className="space-y-3">
          {assets.map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-foreground font-medium text-sm capitalize">{a.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{a.type} · {a.zone || "site"} · {a.capacity_kw} kW</div>
                </div>
                <Pill className={statusColor[a.status]}>{a.status}</Pill>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <Bar2 label="Output" value={a.capacity_kw ? (a.current_output_kw / a.capacity_kw) * 100 : 0} text={`${a.current_output_kw} kW`} color="bg-amber-400" />
                <Bar2 label="Health" value={a.health} text={pct(a.health)} color="bg-emerald-400" />
                <Bar2 label="Soiling loss" value={a.soiling_loss} text={pct(a.soiling_loss)} color="bg-rose-400" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Bar2({ label, value, text, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-mono">{text}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, value || 0)}%` }} />
      </div>
    </div>
  );
}