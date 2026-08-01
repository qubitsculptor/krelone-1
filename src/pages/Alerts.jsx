import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Check, Archive } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { Button } from "@/components/ui/button";
import { severityColor, cn } from "@/lib/agripv";
import { useSite } from "@/lib/SiteContext";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("active");
  const { activeSite } = useSite();
  const load = () => activeSite && base44.entities.Alert.filter({ site_id: activeSite.id }, "-created_date").then(setAlerts);
  useEffect(() => { load(); }, [activeSite]);

  const update = async (a, status) => { await base44.entities.Alert.update(a.id, { status }); load(); };
  const shown = alerts.filter((a) => filter === "all" || a.status === filter);
  const counts = ["critical", "high", "medium", "low"].map((s) => ({ s, n: alerts.filter((a) => a.severity === s && a.status === "active").length }));

  return (
    <div>
      <PageHeader eyebrow="Alert System" title="Alerts"
        subtitle="Prioritized events across equipment, crop, weather, disease, security and automation."
        actions={
          <div className="flex gap-1 p-1 rounded-xl bg-muted">
            {["active", "acknowledged", "all"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize", filter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>{f}</button>
            ))}
          </div>
        } />

      <div className="grid grid-cols-4 gap-3 mb-6">
        {counts.map(({ s, n }) => (
          <div key={s} className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{n}</div>
            <Pill className={cn("mt-1.5", severityColor[s])}>{s}</Pill>
          </div>
        ))}
      </div>

      <Panel className="!p-0">
        <div className="divide-y divide-border">
          {shown.map((a) => (
            <div key={a.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-muted/20 transition-colors">
              <div className={cn("w-1 self-stretch rounded-full shrink-0", a.severity === "critical" ? "bg-rose-500" : a.severity === "high" ? "bg-orange-500" : a.severity === "medium" ? "bg-amber-500" : "bg-sky-500")} />
              <Bell className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground font-medium text-sm">{a.title}</span>
                  <Pill className={severityColor[a.severity]}>{a.severity}</Pill>
                  <Pill className="bg-muted text-muted-foreground border-border">{a.category}</Pill>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                <div className="text-[11px] text-muted-foreground/50 font-mono mt-1">{a.zone}</div>
              </div>
              {a.status === "active" && (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => update(a, "acknowledged")} className="text-muted-foreground h-8"><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => update(a, "resolved")} className="text-muted-foreground h-8"><Archive className="w-4 h-4" /></Button>
                </div>
              )}
              {a.status !== "active" && <Pill className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 shrink-0">{a.status}</Pill>}
            </div>
          ))}
          {shown.length === 0 && <p className="text-center text-muted-foreground py-16">No alerts in this view.</p>}
        </div>
      </Panel>
    </div>
  );
}