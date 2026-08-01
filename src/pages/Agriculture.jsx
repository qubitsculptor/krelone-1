import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sprout, Bug, ShieldAlert, Droplets, Camera, Leaf } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import StatCard from "@/components/ui-kit/StatCard";
import Pill from "@/components/ui-kit/Pill";
import { statusColor, pct } from "@/lib/agripv";
import { useSite } from "@/lib/SiteContext";
import CropScanPanel from "@/components/agriculture/CropScanPanel";

export default function Agriculture() {
  const [zones, setZones] = useState([]);
  const { activeSite } = useSite();
  useEffect(() => {
    if (!activeSite) return;
    base44.entities.Zone.filter({ site_id: activeSite.id }).then((all) => setZones(all.filter((z) => z.crop)));
  }, [activeSite]);

  const avgHealth = zones.length ? zones.reduce((s, z) => s + (z.health_score || 0), 0) / zones.length : 0;
  const atRisk = zones.filter((z) => z.status !== "optimal").length;

  return (
    <div>
      <PageHeader eyebrow="Agriculture Module" title="Crop Intelligence"
        subtitle="Growth tracking, computer-vision diagnostics, stress and disease prediction across crop zones." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Avg Crop Health" value={pct(avgHealth)} icon={Sprout} accent="emerald" />
        <StatCard label="Zones At Risk" value={atRisk} icon={ShieldAlert} accent="amber" />
        <StatCard label="Vision AI" value="Live" icon={Camera} accent="violet" />
        <StatCard label="Disease Risk" value={atRisk > 0 ? "Elevated" : "Low"} icon={Bug} accent={atRisk > 0 ? "rose" : "emerald"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Crop Zones" icon={Leaf}>
          <div className="space-y-3">
            {zones.map((z) => (
              <div key={z.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-foreground font-medium text-sm">{z.name} · <span className="text-primary">{z.crop}</span></div>
                    <div className="text-xs text-muted-foreground capitalize">{z.growth_stage} · {z.area_hectares} ha</div>
                  </div>
                  <Pill className={statusColor[z.status]}>{z.status}</Pill>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-muted-foreground">Moisture {z.soil_moisture}%</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden ml-2">
                    <div className="h-full bg-emerald-500" style={{ width: `${z.health_score}%` }} />
                  </div>
                  <span className="text-primary font-mono">{pct(z.health_score)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <CropScanPanel siteId={activeSite?.id} />
      </div>
    </div>
  );
}