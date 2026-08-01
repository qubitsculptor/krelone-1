import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Zap, Droplets, Sprout, Bot, Bell, Lightbulb, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import PageHero from "@/components/ui-kit/PageHero";
import Panel from "@/components/ui-kit/Panel";
import StatCard from "@/components/ui-kit/StatCard";
import Pill from "@/components/ui-kit/Pill";
import { severityColor, priorityColor, pct } from "@/lib/agripv";
import { useSite } from "@/lib/SiteContext";
import WeatherPanel from "@/components/overview/WeatherPanel";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";

const genCurve = () =>
  Array.from({ length: 24 }, (_, h) => ({
    h: `${h}:00`,
    kw: Math.max(0, Math.round(Math.sin((h - 6) / 12 * Math.PI) * 420 + (Math.random() * 30))),
  }));

export default function Overview() {
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recs, setRecs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [autos, setAutos] = useState([]);
  const [curve] = useState(genCurve());
  const { activeSite } = useSite();

  useEffect(() => {
    if (!activeSite) return;
    const sid = activeSite.id;
    base44.entities.Zone.filter({ site_id: sid }).then(setZones);
    base44.entities.Alert.filter({ site_id: sid, status: "active" }, "-created_date").then(setAlerts);
    base44.entities.Recommendation.filter({ site_id: sid, status: "pending" }, "-confidence").then(setRecs);
    base44.entities.EnergyAsset.filter({ site_id: sid }).then(setAssets);
    base44.entities.Automation.filter({ site_id: sid }).then(setAutos);
  }, [activeSite]);

  const totalOutput = assets.reduce((s, a) => s + (a.current_output_kw || 0), 0);
  const capacity = assets.reduce((s, a) => s + (a.capacity_kw || 0), 0);
  const avgHealth = zones.length ? zones.reduce((s, z) => s + (z.health_score || 0), 0) / zones.length : 0;
  const avgMoisture = zones.length ? zones.reduce((s, z) => s + (z.soil_moisture || 0), 0) / zones.length : 0;
  const autonomous = autos.filter((a) => a.mode === "autonomous" && a.enabled).length;

  return (
    <div>
      <PageHero
        eyebrow="Command Center"
        title={activeSite?.name || "Site Overview"}
        subtitle="A single operational picture of your agrivoltaic ecosystem — what's happening, why, and what to do next."
        image="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1800&q=80"
        actions={<Pill className="bg-white/15 text-white border-white/25 backdrop-blur-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</Pill>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="PV Output" value={Math.round(totalOutput)} unit="kW" icon={Zap} accent="amber" trend={`${pct(capacity ? (totalOutput / capacity) * 100 : 0)} of capacity`} />
        <StatCard label="Crop Health" value={pct(avgHealth)} icon={Sprout} accent="emerald" trend={`${zones.length} zones monitored`} />
        <StatCard label="Soil Moisture" value={pct(avgMoisture)} icon={Droplets} accent="sky" trend="avg across zones" />
        <StatCard label="Autonomous Loops" value={autonomous} icon={Bot} accent="violet" trend={`${autos.filter(a=>a.enabled).length} automations active`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <Panel title="Energy Generation — Today" icon={Activity} className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} interval={3} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, color: "hsl(var(--foreground))", fontSize: 12 }} />
                <Area type="monotone" dataKey="kw" stroke="#059669" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Decision Loop" icon={ShieldCheck}>
          <div className="space-y-3">
            {["Observe", "Understand", "Predict", "Decide", "Execute", "Learn"].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono font-semibold">{i + 1}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${70 + i * 5 - (i % 2) * 15}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-20 font-mono">{step}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mb-8">
        <WeatherPanel site={activeSite} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Priority Recommendations" icon={Lightbulb}
          action={<Link to="/recommendations" className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1 hover:gap-1.5 transition-all">View all <ArrowRight className="w-3 h-3" /></Link>}>
          <div className="space-y-3">
            {recs.slice(0, 4).map((r) => (
              <Link to="/recommendations" key={r.id} className="block p-3 rounded-xl bg-muted/40 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground font-medium truncate">{r.problem}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.action}</div>
                  </div>
                  <Pill className={priorityColor[r.priority]}>{r.priority}</Pill>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground font-mono">
                  <span className="text-primary">{pct(r.confidence)} conf.</span>
                  {r.estimated_savings && <span>· {r.estimated_savings}</span>}
                </div>
              </Link>
            ))}
            {recs.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No pending recommendations.</p>}
          </div>
        </Panel>

        <Panel title="Active Alerts" icon={Bell}
          action={<Link to="/alerts" className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1 hover:gap-1.5 transition-all">View all <ArrowRight className="w-3 h-3" /></Link>}>
          <div className="space-y-3">
            {alerts.slice(0, 4).map((a) => (
              <Link to="/alerts" key={a.id} className="block p-3 rounded-xl bg-muted/40 border border-border hover:border-border/80 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{a.zone} · {a.category}</div>
                  </div>
                  <Pill className={severityColor[a.severity]}>{a.severity}</Pill>
                </div>
              </Link>
            ))}
            {alerts.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No active alerts. All systems nominal.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}