import React from "react";
import Field from "./Field";
import CropAutocomplete from "./CropAutocomplete";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export const emptyZone = () => ({
  name: "", type: "mixed", crop: "", growth_stage: "vegetative", area_hectares: "",
  moisture_target_min: "", moisture_target_max: "", temp_target_min: "", temp_target_max: "",
});

export default function ZonesStep({ zones, setZones }) {
  const set = (i, k, v) => setZones(zones.map((z, idx) => (idx === i ? { ...z, [k]: v } : z)));
  const applyProfile = (i, p) => setZones(zones.map((z, idx) => (idx === i ? {
    ...z,
    crop: p.crop,
    moisture_target_min: p.moisture_min ?? z.moisture_target_min,
    moisture_target_max: p.moisture_max ?? z.moisture_target_max,
    temp_target_min: p.soil_temp_min ?? z.temp_target_min,
    temp_target_max: p.soil_temp_max ?? z.temp_target_max,
  } : z)));
  return (
    <div className="space-y-4">
      {zones.map((z, i) => (
        <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Zone {i + 1}</span>
            {zones.length > 1 && (
              <button onClick={() => setZones(zones.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Name *" placeholder="Zone A" value={z.name} onChange={(e) => set(i, "name", e.target.value)} />
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Type</label>
              <Select value={z.type} onValueChange={(v) => set(i, "type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crop">Crop only</SelectItem>
                  <SelectItem value="solar">Solar only</SelectItem>
                  <SelectItem value="mixed">Mixed (AgriPV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Area (ha)" type="number" value={z.area_hectares} onChange={(e) => set(i, "area_hectares", e.target.value)} />
          </div>
          {z.type !== "solar" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <CropAutocomplete value={z.crop} onChange={(v) => set(i, "crop", v)} onSelectProfile={(p) => applyProfile(i, p)} />
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Growth stage</label>
                <Select value={z.growth_stage} onValueChange={(v) => set(i, "growth_stage", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["seeding", "vegetative", "flowering", "fruiting", "harvest"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Moisture min %" type="number" value={z.moisture_target_min} onChange={(e) => set(i, "moisture_target_min", e.target.value)} />
                <Field label="Moisture max %" type="number" value={z.moisture_target_max} onChange={(e) => set(i, "moisture_target_max", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Soil temp min °C" type="number" value={z.temp_target_min} onChange={(e) => set(i, "temp_target_min", e.target.value)} />
                <Field label="Soil temp max °C" type="number" value={z.temp_target_max} onChange={(e) => set(i, "temp_target_max", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" onClick={() => setZones([...zones, emptyZone()])} className="w-full">
        <Plus className="w-4 h-4 mr-1.5" /> Add zone
      </Button>
    </div>
  );
}