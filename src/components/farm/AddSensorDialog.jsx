import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const metrics = ["soil_moisture", "soil_temp", "soil_ec", "ph", "par", "air_temp", "humidity", "wind", "rain", "co2", "water_flow", "energy", "inverter", "tracker"];
const protocols = ["MQTT", "Modbus", "OPC-UA", "HTTP", "LoRaWAN", "Zigbee", "BLE"];

export default function AddSensorDialog({ open, onOpenChange, siteId, zones, onCreated }) {
  const [form, setForm] = useState({ name: "", external_id: "", metric: "soil_moisture", zone: "", protocol: "MQTT", unit: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    await base44.entities.Sensor.create({
      site_id: siteId,
      name: form.name,
      external_id: form.external_id || undefined,
      metric: form.metric,
      zone: form.zone || undefined,
      protocol: form.protocol,
      unit: form.unit || undefined,
      status: "offline",
    });
    setSaving(false);
    setForm({ name: "", external_id: "", metric: "soil_moisture", zone: "", protocol: "MQTT", unit: "" });
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Register Device</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Sensor name *</label>
              <Input placeholder="Soil probe A1" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Device ID</label>
              <Input placeholder="e.g. SM-101 (serial)" value={form.external_id} onChange={(e) => set("external_id", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Metric</label>
              <Select value={form.metric} onValueChange={(v) => set("metric", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {metrics.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Zone</label>
              <Select value={form.zone || "site"} onValueChange={(v) => set("zone", v === "site" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site-wide</SelectItem>
                  {zones.map((z) => <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Protocol</label>
              <Select value={form.protocol} onValueChange={(v) => set("protocol", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {protocols.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Unit</label>
              <Input placeholder="%, °C, W/m²…" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
            </div>
          </div>
          <Button onClick={save} disabled={!form.name.trim() || saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Register Device
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}