import React, { useMemo } from "react";
import Panel from "@/components/ui-kit/Panel";
import { Droplets, Zap } from "lucide-react";
import { litersForCommand, minutesForCommand, isWaterCommand, commandTime, generatedKwh, PUMP_KW } from "@/lib/accounting";

const DAYS = 7;

export default function WaterEnergyPanel({ commands, readings }) {
  const { perZone, totalLiters, pumpKwh, genKwh } = useMemo(() => {
    const cutoff = Date.now() - DAYS * 86400e3;
    const water = commands.filter((c) => isWaterCommand(c) && commandTime(c) >= cutoff);
    const perZone = {};
    let totalLiters = 0, totalMinutes = 0;
    for (const c of water) {
      const l = litersForCommand(c);
      totalLiters += l;
      totalMinutes += minutesForCommand(c);
      const z = c.zone || "Site";
      perZone[z] = (perZone[z] || 0) + l;
    }
    return {
      perZone: Object.entries(perZone).sort((a, b) => b[1] - a[1]),
      totalLiters,
      pumpKwh: Math.round((totalMinutes * PUMP_KW) / 60 * 10) / 10,
      genKwh: generatedKwh(readings, DAYS),
    };
  }, [commands, readings]);

  const maxZone = perZone.length ? perZone[0][1] : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Panel title={`Water Used by Zone (${DAYS}d)`} icon={Droplets}>
        {perZone.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No completed irrigation commands in the last {DAYS} days.</p>
        ) : (
          <div className="space-y-3">
            {perZone.map(([zone, liters]) => (
              <div key={zone}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{zone}</span>
                  <span className="text-foreground font-mono">{liters.toLocaleString()} L</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-400 to-cyan-500" style={{ width: `${Math.round((liters / maxZone) * 100)}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground/70 pt-1">Total {totalLiters.toLocaleString()} L · from gateway reports or estimated at 20 L/min run time.</p>
          </div>
        )}
      </Panel>
      <Panel title={`Energy Balance (${DAYS}d)`} icon={Zap}>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <div className="font-heading text-lg font-bold text-foreground">{genKwh.toLocaleString()} kWh</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">PV generated</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border">
            <div className="font-heading text-lg font-bold text-foreground">{pumpKwh.toLocaleString()} kWh</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Irrigation pump use (est.)</div>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border col-span-2">
            <div className="font-heading text-lg font-bold text-primary">
              {genKwh > 0 ? `${Math.max(0, Math.round(((genKwh - pumpKwh) / genKwh) * 1000) / 10)}%` : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Net energy surplus after farm operations</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}