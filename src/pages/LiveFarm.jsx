import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Droplets, Thermometer, Sun, Radio, MapPinned, Compass } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { statusColor, pct } from "@/lib/agripv";
import { useSite } from "@/lib/SiteContext";
import AddSensorDialog from "@/components/farm/AddSensorDialog";
import SensorHistoryPanel from "@/components/farm/SensorHistoryPanel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LiveFarm() {
  const [zones, setZones] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const { activeSite } = useSite();

  const load = () => {
    if (!activeSite) return;
    base44.entities.Zone.filter({ site_id: activeSite.id }).then(setZones);
    base44.entities.Sensor.filter({ site_id: activeSite.id }).then(setSensors);
  };
  useEffect(() => { load(); }, [activeSite]);

  const online = sensors.filter((s) => s.status === "online").length;

  return (
    <div>
      <PageHeader
        eyebrow="Digital Twin"
        title="Live Farm"
        subtitle="Real-time state of every crop and solar zone, backed by the sensor network."
        actions={<Pill className="bg-sky-500/10 text-sky-700 border-sky-500/20"><Radio className="w-3 h-3" /> {online}/{sensors.length} sensors online</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {zones.map((z) => (
          <div key={z.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-primary" />
                <span className="font-heading font-semibold text-foreground text-sm">{z.name}</span>
              </div>
              <Pill className={statusColor[z.status]}>{z.status}</Pill>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-muted-foreground capitalize">{z.type} · {z.crop || "—"}</div>
                  <div className="text-xs text-primary capitalize mt-0.5">{z.growth_stage} stage</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-medium text-foreground">{pct(z.health_score)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">health</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric icon={Droplets} color="text-sky-600" label="Moisture" value={`${z.soil_moisture ?? "—"}%`} />
                <Metric icon={Thermometer} color="text-amber-600" label="Soil Temp" value={`${z.soil_temp ?? "—"}°C`} />
                <Metric icon={Sun} color="text-yellow-600" label="PAR" value={`${z.par ?? "—"}`} />
                <Metric icon={Compass} color="text-violet-600" label="Tracker" value={`${z.tracker_angle ?? "—"}°`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Panel title="Sensor Network" icon={Radio}
        action={<Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Register device</Button>}>
        <div className="overflow-x-auto agri-scroll -mx-5 px-5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Sensor</th>
                <th className="pb-3 font-medium">Device ID</th>
                <th className="pb-3 font-medium">Zone</th>
                <th className="pb-3 font-medium">Protocol</th>
                <th className="pb-3 font-medium">Reading</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground capitalize">{s.name}</td>
                  <td className="py-3"><span className="font-mono text-xs text-muted-foreground">{s.external_id || "—"}</span></td>
                  <td className="py-3 text-muted-foreground">{s.zone || "—"}</td>
                  <td className="py-3"><span className="font-mono text-xs text-muted-foreground">{s.protocol}</span></td>
                  <td className="py-3 text-primary font-mono">{s.value ?? "—"} {s.unit}</td>
                  <td className="py-3"><Pill className={statusColor[s.status]}>{s.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-8">
        <SensorHistoryPanel sensors={sensors} siteId={activeSite?.id} />
      </div>

      <AddSensorDialog open={addOpen} onOpenChange={setAddOpen} siteId={activeSite?.id} zones={zones} onCreated={load} />
    </div>
  );
}

function Metric({ icon: Icon, color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <div className="text-foreground font-medium leading-tight">{value}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}