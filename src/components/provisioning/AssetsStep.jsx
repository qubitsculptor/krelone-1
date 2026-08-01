import React from "react";
import Field from "./Field";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export const emptyAsset = () => ({ name: "", type: "inverter", zone: "", capacity_kw: "" });

export default function AssetsStep({ assets, setAssets, zoneNames }) {
  const set = (i, k, v) => setAssets(assets.map((a, idx) => (idx === i ? { ...a, [k]: v } : a)));
  return (
    <div className="space-y-3">
      {assets.map((a, i) => (
        <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <Field label="Name *" placeholder="Inverter 1" value={a.name} onChange={(e) => set(i, "name", e.target.value)} />
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Type</label>
              <Select value={a.type} onValueChange={(v) => set(i, "type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["inverter", "string", "tracker", "meter"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Zone</label>
              <Select value={a.zone || "site"} onValueChange={(v) => set(i, "zone", v === "site" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site-wide</SelectItem>
                  {zoneNames.filter(Boolean).map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><Field label="Capacity (kW)" type="number" value={a.capacity_kw} onChange={(e) => set(i, "capacity_kw", e.target.value)} /></div>
              {assets.length > 1 && (
                <button onClick={() => setAssets(assets.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive pb-2.5"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={() => setAssets([...assets, emptyAsset()])} className="w-full">
        <Plus className="w-4 h-4 mr-1.5" /> Add asset
      </Button>
    </div>
  );
}