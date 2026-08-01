import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, Droplets, Sun, Wind, Fan, Lightbulb, Bell, Gauge, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommandQueue from "@/components/automation/CommandQueue";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { Switch } from "@/components/ui/switch";
import { executionModes, cn } from "@/lib/agripv";
import { toast } from "@/components/ui/use-toast";
import { useSite } from "@/lib/SiteContext";
import { useRole } from "@/hooks/use-role";

const targetIcon = { irrigation: Droplets, valve: Droplets, pump: Gauge, tracker: Sun, vent: Wind, fan: Fan, fogger: Wind, lighting: Lightbulb, notification: Bell };
const modeColor = {
  observe: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
  recommend: "text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  approve: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  autonomous: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function Automation() {
  const [autos, setAutos] = useState([]);
  const { activeSite } = useSite();
  const { isAdmin, user } = useRole();
  const load = () => activeSite && base44.entities.Automation.filter({ site_id: activeSite.id }).then(setAutos);
  useEffect(() => { load(); }, [activeSite]);

  const toggle = async (a) => { await base44.entities.Automation.update(a.id, { enabled: !a.enabled }); load(); };
  const setMode = async (a, mode) => {
    await base44.entities.Automation.update(a.id, { mode });
    toast({ title: `${a.name} → ${mode} mode` });
    load();
  };

  const runNow = async (a) => {
    const status = a.mode === "autonomous" ? "queued" : "pending_approval";
    await base44.entities.Command.create({
      site_id: activeSite.id,
      automation_id: a.id,
      target: a.target,
      zone: a.zone,
      action: a.action || a.name,
      status,
      issued_by: user?.email || "manual",
    });
    toast({ title: status === "queued" ? "Command queued — gateway will pick it up" : "Command created — awaiting approval below" });
  };

  return (
    <div>
      <PageHeader eyebrow="Automation Engine" title="Automation & Control"
        subtitle="Route decisions to equipment across four execution modes — from observe-only to fully autonomous closed loops."
        actions={!isAdmin && <Pill className="bg-muted text-muted-foreground border-border">View only — admin controls</Pill>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {executionModes.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
            <Pill className={modeColor[m.id]}>{m.label}</Pill>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{m.desc}</p>
            <div className="text-lg font-heading font-bold text-foreground mt-2">{autos.filter((a) => a.mode === m.id).length}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {autos.map((a) => {
          const Icon = targetIcon[a.target] || Bot;
          return (
            <Panel key={a.id} className="!p-0">
              <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", a.enabled ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("w-5 h-5", a.enabled ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-foreground font-medium text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">IF {a.trigger} → {a.action}</div>
                    <div className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">{a.zone} · {a.runs_today || 0} runs today</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <>
                      <div className="flex gap-1 p-1 rounded-xl bg-muted/60">
                        {executionModes.map((m) => (
                          <button key={m.id} onClick={() => setMode(a, m.id)} title={m.desc}
                            className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors capitalize",
                              a.mode === m.id ? modeColor[m.id] + " border" : "text-muted-foreground hover:text-foreground")}>
                            {m.id}
                          </button>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" disabled={!a.enabled} onClick={() => runNow(a)}>
                        <Play className="w-3.5 h-3.5 mr-1" /> Run
                      </Button>
                      <Switch checked={a.enabled} onCheckedChange={() => toggle(a)} />
                    </>
                  ) : (
                    <Pill className={modeColor[a.mode]}>{a.mode}</Pill>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-8">
        <CommandQueue siteId={activeSite?.id} />
      </div>
    </div>
  );
}