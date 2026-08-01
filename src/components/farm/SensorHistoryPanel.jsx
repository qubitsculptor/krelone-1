import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { History } from "lucide-react";
import Panel from "@/components/ui-kit/Panel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function SensorHistoryPanel({ sensors, siteId }) {
  const [sensorId, setSensorId] = useState("");
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sensorId && sensors.length > 0) setSensorId(sensors[0].id);
  }, [sensors, sensorId]);

  useEffect(() => {
    if (!sensorId || !siteId) return;
    setLoading(true);
    base44.entities.Reading.filter({ site_id: siteId, sensor_id: sensorId }, "-timestamp", 200)
      .then((rows) => setReadings(rows.reverse()))
      .finally(() => setLoading(false));
  }, [sensorId, siteId]);

  const sensor = sensors.find((s) => s.id === sensorId);
  const data = readings.map((r) => ({
    time: new Date(r.timestamp || r.created_date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    value: r.value,
  }));

  return (
    <Panel title="Reading History" icon={History}
      action={
        <Select value={sensorId} onValueChange={setSensorId}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Select sensor" /></SelectTrigger>
          <SelectContent>
            {sensors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      }>
      {loading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading history…</div>
      ) : data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground text-center px-6">
          No historical readings yet — data appears here as your gateway pushes telemetry.
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
              <Tooltip formatter={(v) => [`${v} ${sensor?.unit || ""}`, sensor?.metric?.replace(/_/g, " ")]} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}