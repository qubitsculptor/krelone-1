import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Check, X, Bot, Zap } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { Button } from "@/components/ui/button";
import { priorityColor, pct } from "@/lib/agripv";
import { toast } from "@/components/ui/use-toast";
import { useSite } from "@/lib/SiteContext";

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [filter, setFilter] = useState("pending");
  const { activeSite } = useSite();

  const load = () => activeSite && base44.entities.Recommendation.filter({ site_id: activeSite.id }, "-confidence").then(setRecs);
  useEffect(() => { load(); }, [activeSite]);

  const act = async (r, status) => {
    await base44.entities.Recommendation.update(r.id, { status });
    if (status === "accepted" && r.automatable) {
      await base44.entities.Task.create({
        site_id: r.site_id || activeSite?.id,
        title: r.action, description: `${r.problem} — ${r.cause}`, type: "scouting",
        zone: r.zone, priority: r.priority, auto_created: true, status: "open",
      });
    }
    toast({ title: status === "executed" ? "Action executed" : status === "accepted" ? "Recommendation accepted" : "Dismissed" });
    load();
  };

  const shown = recs.filter((r) => filter === "all" || r.status === filter);

  return (
    <div>
      <PageHeader eyebrow="Recommendation Engine" title="Recommendations"
        subtitle="Every recommendation carries a problem, cause, action, confidence, and expected benefit."
        actions={
          <div className="flex gap-1 p-1 rounded-xl bg-muted">
            {["pending", "accepted", "all"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
        } />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {shown.map((r) => (
          <Panel key={r.id} className="!p-0">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Lightbulb className="w-4 h-4 text-amber-600" /></div>
                  <div>
                    <div className="text-foreground font-semibold text-sm">{r.problem}</div>
                    <div className="text-[11px] text-muted-foreground capitalize font-mono">{r.domain} · {r.zone}</div>
                  </div>
                </div>
                <Pill className={priorityColor[r.priority]}>{r.priority}</Pill>
              </div>

              <div className="space-y-2.5 text-sm">
                <Row label="Cause" value={r.cause} />
                <Row label="Action" value={r.action} accent />
                <Row label="Benefit" value={r.expected_benefit} />
                <Row label="Est. Savings" value={r.estimated_savings} />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="text-primary font-mono">{pct(r.confidence)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${r.confidence}%` }} />
                  </div>
                </div>
                {r.automatable && <Pill className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30"><Bot className="w-3 h-3" /> auto</Pill>}
              </div>
            </div>

            {r.status === "pending" && (
              <div className="flex gap-2 p-4 border-t border-border">
                {r.automatable ? (
                  <Button onClick={() => act(r, "executed")} className="flex-1 font-medium h-9">
                    <Zap className="w-4 h-4 mr-1.5" /> Approve & Execute
                  </Button>
                ) : (
                  <Button onClick={() => act(r, "accepted")} className="flex-1 font-medium h-9">
                    <Check className="w-4 h-4 mr-1.5" /> Accept & Create Task
                  </Button>
                )}
                <Button onClick={() => act(r, "dismissed")} variant="ghost" className="text-muted-foreground hover:text-foreground h-9">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {r.status !== "pending" && (
              <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground capitalize">Status: <span className="text-primary">{r.status}</span></div>
            )}
          </Panel>
        ))}
      </div>
      {shown.length === 0 && <p className="text-center text-muted-foreground py-16">No recommendations in this view.</p>}
    </div>
  );
}

function Row({ label, value, accent }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground w-20 shrink-0 pt-0.5">{label}</span>
      <span className={accent ? "text-primary font-medium" : "text-foreground"}>{value}</span>
    </div>
  );
}