import React, { useMemo, useState } from "react";
import Panel from "@/components/ui-kit/Panel";
import { Droplets, Thermometer, Zap } from "lucide-react";
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { cn } from "@/lib/agripv";

const RANGES = [{ k: "24h", h: 24 }, { k: "7d", h: 168 }, { k: "30d", h: 720 }];
const COLORS = ["#34d399", "#38bdf8", "#fbbf24", "#a78bfa", "#f87171", "#2dd4bf"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))", fontSize: 12 };
const tick = { fill: "#64748b", fontSize: 11 };

function buildSeries(readings, metric, rangeH, groupByZone) {
  const cutoff = Date.now() - rangeH * 3600e3;
  const buckets = {};
  const keys = new Set();
  for (const r of readings) {
    if (r.metric !== metric) continue;
    const ts = r.timestamp || r.created_date;
    if (new Date(ts).getTime() < cutoff) continue;
    const b = rangeH <= 24 ? ts.slice(0, 13) + ":00" : ts.slice(0, 10);
    const g = groupByZone ? (r.zone || "Site") : "value";
    keys.add(g);
    buckets[b] = buckets[b] || {};
    (buckets[b][g] = buckets[b][g] || []).push(r.value);
  }
  const data = Object.keys(buckets).sort().map((b) => {
    const row = { t: rangeH <= 24 ? b.slice(11, 16) : b.slice(5) };
    for (const g of Object.keys(buckets[b])) {
      row[g] = Math.round((buckets[b][g].reduce((a, v) => a + v, 0) / buckets[b][g].length) * 10) / 10;
    }
    return row;
  });
  return { data, keys: [...keys].sort() };
}

function ZoneLineChart({ readings, metric, rangeH, unit }) {
  const { data, keys } = useMemo(() => buildSeries(readings, metric, rangeH, true), [readings, metric, rangeH]);
  if (!data.length) return <p className="text-sm text-muted-foreground py-10 text-center">No readings in this range yet.</p>;
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="t" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} unit={unit} width={44} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EnergyAreaChart({ readings, rangeH }) {
  const { data } = useMemo(() => buildSeries(readings, "energy", rangeH, false), [readings, rangeH]);
  if (!data.length) return <p className="text-sm text-muted-foreground py-10 text-center">No energy readings in this range yet.</p>;
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="t" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} unit=" kW" width={56} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="value" name="Avg output (kW)" stroke="#fbbf24" strokeWidth={2} fill="url(#energyFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrendCharts({ readings }) {
  const [range, setRange] = useState("7d");
  const rangeH = RANGES.find((r) => r.k === range).h;
  const selector = (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
      {RANGES.map((r) => (
        <button key={r.k} onClick={() => setRange(r.k)}
          className={cn("px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
            range === r.k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {r.k}
        </button>
      ))}
    </div>
  );
  return (
    <div className="space-y-6">
      <Panel title="Soil Moisture by Zone" icon={Droplets} action={selector}>
        <ZoneLineChart readings={readings} metric="soil_moisture" rangeH={rangeH} unit="%" />
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Soil Temperature by Zone" icon={Thermometer}>
          <ZoneLineChart readings={readings} metric="soil_temp" rangeH={rangeH} unit="°C" />
        </Panel>
        <Panel title="Energy Output" icon={Zap}>
          <EnergyAreaChart readings={readings} rangeH={rangeH} />
        </Panel>
      </div>
    </div>
  );
}