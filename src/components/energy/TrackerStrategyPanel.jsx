import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useSite } from "@/lib/SiteContext";
import { useRole } from "@/hooks/use-role";
import Panel from "@/components/ui-kit/Panel";
import { Button } from "@/components/ui/button";
import { Compass, RefreshCw } from "lucide-react";
import TrackerPlanCard from "@/components/energy/TrackerPlanCard";

export default function TrackerStrategyPanel() {
  const { activeSite } = useSite();
  const { isAdmin } = useRole();
  const [plans, setPlans] = useState([]);
  const [zones, setZones] = useState([]);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    if (!activeSite) return;
    const [allPlans, z] = await Promise.all([
      base44.entities.TrackerPlan.filter({ site_id: activeSite.id }, "-computed_at", 60),
      base44.entities.Zone.filter({ site_id: activeSite.id }),
    ]);
    const latest = {};
    allPlans.forEach((p) => { if (!latest[p.zone]) latest[p.zone] = p; });
    setPlans(Object.values(latest));
    setZones(z);
  }, [activeSite]);

  useEffect(() => { load(); }, [load]);

  const runNow = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("optimizeTrackers", { site_id: activeSite.id });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const setWeight = async (zone, value) => {
    await base44.entities.Zone.update(zone.id, { crop_priority: value });
    setZones((zs) => zs.map((z) => (z.id === zone.id ? { ...z, crop_priority: value } : z)));
  };

  return (
    <Panel title="Tracker Optimization Engine" icon={Compass} className="mb-6"
      action={isAdmin && (
        <Button size="sm" variant="outline" onClick={runNow} disabled={running}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${running ? "animate-spin" : ""}`} />
          {running ? "Optimizing…" : "Optimize now"}
        </Button>
      )}>
      <p className="text-xs text-muted-foreground mb-4">
        Trackers are steered by a multi-objective policy: crop growth stage, daily light budget (DLI), heat-stress forecast
        and each zone's crop/energy weighting decide why a panel moves — not just where the sun is. Commands follow your
        tracker automation mode (recommend, approve or autonomous).
      </p>
      {plans.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No tracker plans yet — {isAdmin ? "press \"Optimize now\" to compute the first strategy." : "the optimizer hasn't run yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((p) => (
            <TrackerPlanCard key={p.id} plan={p} zone={zones.find((z) => z.name === p.zone)}
              isAdmin={isAdmin} onWeightChange={setWeight} />
          ))}
        </div>
      )}
    </Panel>
  );
}