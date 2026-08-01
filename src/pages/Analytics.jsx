import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Droplets, Zap, Bot, Target, Waves } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import StatCard from "@/components/ui-kit/StatCard";
import TrendCharts from "@/components/analytics/TrendCharts";
import WaterEnergyPanel from "@/components/analytics/WaterEnergyPanel";
import { litersForCommand, isWaterCommand, commandTime, generatedKwh } from "@/lib/accounting";
import { useSite } from "@/lib/SiteContext";

export default function Analytics() {
  const [recs, setRecs] = useState([]);
  const [readings, setReadings] = useState([]);
  const [commands, setCommands] = useState([]);
  const { activeSite } = useSite();

  useEffect(() => {
    if (!activeSite) return;
    base44.entities.Recommendation.filter({ site_id: activeSite.id }).then(setRecs);
    base44.entities.Reading.filter({ site_id: activeSite.id }, "-timestamp", 1000).then(setReadings);
    base44.entities.Command.filter({ site_id: activeSite.id }, "-created_date", 200).then(setCommands);
  }, [activeSite]);

  const accepted = recs.filter((r) => r.status === "accepted" || r.status === "executed").length;
  const acceptance = recs.length ? Math.round((accepted / recs.length) * 100) : 0;

  const weekCutoff = Date.now() - 7 * 86400e3;
  const waterCmds = commands.filter((c) => isWaterCommand(c) && commandTime(c) >= weekCutoff);
  const waterLiters = waterCmds.reduce((s, c) => s + litersForCommand(c), 0);
  const genKwh = generatedKwh(readings, 7);

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="Operational Analytics"
        subtitle="Real trends from your sensor readings — soil moisture, temperature, energy output, and water accounting per zone." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Water Used (7d)" value={waterLiters >= 1000 ? `${Math.round(waterLiters / 100) / 10}k` : `${waterLiters}`} unit="L" icon={Droplets} accent="sky" trend={`${waterCmds.length} irrigation runs`} />
        <StatCard label="Energy Generated (7d)" value={genKwh.toLocaleString()} unit="kWh" icon={Zap} accent="amber" trend="from PV output readings" />
        <StatCard label="Readings Stored" value={readings.length >= 1000 ? "1k+" : `${readings.length}`} icon={Waves} accent="emerald" trend="recent telemetry points" />
        <StatCard label="Rec. Acceptance" value={`${acceptance}%`} icon={Target} accent="violet" trend={`${accepted}/${recs.length} actioned`} />
      </div>

      <div className="mb-6">
        <TrendCharts readings={readings} />
      </div>

      <div className="mb-6">
        <WaterEnergyPanel commands={commands} readings={readings} />
      </div>

      <Panel title="Recommendation Intelligence" icon={Bot}>
        <div className="space-y-4">
          {[
            { l: "Acceptance rate", v: acceptance },
            { l: "Avg confidence", v: recs.length ? Math.round(recs.reduce((s, r) => s + (r.confidence || 0), 0) / recs.length) : 0 },
            { l: "Automatable share", v: recs.length ? Math.round((recs.filter(r => r.automatable).length / recs.length) * 100) : 0 },
          ].map((x) => (
            <div key={x.l}>
              <div className="flex justify-between text-sm mb-1.5"><span className="text-muted-foreground">{x.l}</span><span className="text-primary font-mono">{x.v}%</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-teal-400" style={{ width: `${x.v}%` }} /></div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}