// Water & energy accounting helpers
export const FLOW_L_PER_MIN = 20;   // assumed drip-line flow when the gateway doesn't report litres
export const PUMP_KW = 1.5;         // assumed pump draw for consumption estimates

const minutesFromAction = (action) => {
  const m = /(\d+)\s*min/i.exec(action || "");
  return m ? Number(m[1]) : 0;
};

export function litersForCommand(c) {
  if (typeof c.water_liters === "number") return c.water_liters;
  return minutesFromAction(c.action) * FLOW_L_PER_MIN;
}

export function minutesForCommand(c) {
  const min = minutesFromAction(c.action);
  if (min) return min;
  return typeof c.water_liters === "number" ? c.water_liters / FLOW_L_PER_MIN : 0;
}

export function isWaterCommand(c) {
  return ["irrigation", "valve", "pump"].includes(c.target) && c.status === "completed";
}

export function commandTime(c) {
  return new Date(c.executed_at || c.created_date).getTime();
}

// kWh generated over the last N days, from 'energy' metric readings (kW):
// daily average power × 24h, summed per day with data.
export function generatedKwh(readings, days = 7) {
  const cutoff = Date.now() - days * 86400e3;
  const byDay = {};
  for (const r of readings) {
    if (r.metric !== "energy") continue;
    const t = new Date(r.timestamp || r.created_date).getTime();
    if (t < cutoff) continue;
    const d = new Date(t).toISOString().slice(0, 10);
    (byDay[d] = byDay[d] || []).push(r.value);
  }
  return Math.round(
    Object.values(byDay).reduce((s, vals) => s + (vals.reduce((a, v) => a + v, 0) / vals.length) * 24, 0)
  );
}