import React from "react";
import Field from "./Field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SiteStep({ site, setSite }) {
  const set = (k, v) => setSite({ ...site, [k]: v });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Site name *" placeholder="e.g. Nashik AgriPV Pilot" value={site.name} onChange={(e) => set("name", e.target.value)} />
      <Field label="Location" placeholder="City / region, country" value={site.location} onChange={(e) => set("location", e.target.value)} />
      <Field label="Total area (hectares)" type="number" placeholder="e.g. 12" value={site.total_area_hectares} onChange={(e) => set("total_area_hectares", e.target.value)} />
      <Field label="PV capacity (kW)" type="number" placeholder="e.g. 500" value={site.pv_capacity_kw} onChange={(e) => set("pv_capacity_kw", e.target.value)} />
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Grid connection</label>
        <Select value={site.grid_connection} onValueChange={(v) => set("grid_connection", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="on_grid">On-grid</SelectItem>
            <SelectItem value="off_grid">Off-grid</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field label="Description" placeholder="Short description of the site" value={site.description} onChange={(e) => set("description", e.target.value)} />
    </div>
  );
}