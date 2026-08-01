import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSite } from "@/lib/SiteContext";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import SiteStep from "@/components/provisioning/SiteStep";
import ZonesStep, { emptyZone } from "@/components/provisioning/ZonesStep";
import AssetsStep, { emptyAsset } from "@/components/provisioning/AssetsStep";
import { Button } from "@/components/ui/button";
import { MapPin, Sprout, Zap, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/agripv";

const steps = [
  { id: 0, label: "Site Profile", icon: MapPin },
  { id: 1, label: "Zones & Crops", icon: Sprout },
  { id: 2, label: "Energy Assets", icon: Zap },
  { id: 3, label: "Review", icon: CheckCircle2 },
];

const num = (v) => (v === "" || v === undefined ? undefined : Number(v));

export default function SiteSetup() {
  const navigate = useNavigate();
  const { refresh, selectSite } = useSite();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState({ name: "", location: "", description: "", total_area_hectares: "", pv_capacity_kw: "", grid_connection: "on_grid" });
  const [zones, setZones] = useState([emptyZone()]);
  const [assets, setAssets] = useState([emptyAsset()]);

  const validZones = zones.filter((z) => z.name.trim());
  const validAssets = assets.filter((a) => a.name.trim());
  const canNext = step === 0 ? site.name.trim() : step === 1 ? validZones.length > 0 : true;

  const provision = async () => {
    setSaving(true);
    const created = await base44.entities.Site.create({
      api_key: "vrd_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      name: site.name, location: site.location, description: site.description,
      total_area_hectares: num(site.total_area_hectares), pv_capacity_kw: num(site.pv_capacity_kw),
      grid_connection: site.grid_connection, status: "active",
    });
    if (validZones.length) {
      await base44.entities.Zone.bulkCreate(validZones.map((z) => ({
        site_id: created.id, name: z.name, type: z.type, crop: z.type === "solar" ? undefined : z.crop || undefined,
        growth_stage: z.type === "solar" ? undefined : z.growth_stage, area_hectares: num(z.area_hectares),
        moisture_target_min: num(z.moisture_target_min), moisture_target_max: num(z.moisture_target_max),
        temp_target_min: num(z.temp_target_min), temp_target_max: num(z.temp_target_max),
        status: "optimal",
      })));
    }
    if (validAssets.length) {
      await base44.entities.EnergyAsset.bulkCreate(validAssets.map((a) => ({
        site_id: created.id, name: a.name, type: a.type, zone: a.zone || undefined,
        capacity_kw: num(a.capacity_kw), status: "online",
      })));
    }
    await refresh();
    selectSite(created.id);
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader eyebrow="Site Provisioning" title="New Site Setup"
        subtitle="Configure the site profile, zones, crop condition targets and PV assets. Everything in Krelone adapts to this configuration." />

      <div className="flex items-center gap-2 mb-6 overflow-x-auto agri-scroll pb-1">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap",
                step === i ? "bg-primary text-primary-foreground" : step > i ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                <Icon className="w-3.5 h-3.5" /> {s.label}
              </div>
              {i < steps.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      <Panel>
        {step === 0 && <SiteStep site={site} setSite={setSite} />}
        {step === 1 && <ZonesStep zones={zones} setZones={setZones} />}
        {step === 2 && <AssetsStep assets={assets} setAssets={setAssets} zoneNames={validZones.map((z) => z.name)} />}
        {step === 3 && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold text-foreground">{site.name}</div>
              <div className="text-muted-foreground text-xs">{site.location || "No location"} · {site.pv_capacity_kw || 0} kW PV · {site.total_area_hectares || 0} ha · {site.grid_connection.replace("_", "-")}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{validZones.length} zones</div>
              {validZones.map((z, i) => (
                <div key={i} className="text-xs text-muted-foreground py-1 border-b border-border last:border-0">
                  <span className="text-foreground font-medium">{z.name}</span> · {z.type}{z.crop && ` · ${z.crop} (${z.growth_stage})`}
                  {z.moisture_target_min !== "" && z.moisture_target_max !== "" && ` · moisture ${z.moisture_target_min}–${z.moisture_target_max}%`}
                  {z.temp_target_min !== "" && z.temp_target_max !== "" && ` · soil ${z.temp_target_min}–${z.temp_target_max}°C`}
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{validAssets.length} energy assets</div>
              {validAssets.map((a, i) => (
                <div key={i} className="text-xs text-muted-foreground py-1 border-b border-border last:border-0">
                  <span className="text-foreground font-medium">{a.name}</span> · {a.type} · {a.zone || "site-wide"}{a.capacity_kw && ` · ${a.capacity_kw} kW`}
                </div>
              ))}
              {validAssets.length === 0 && <p className="text-xs text-muted-foreground">None — you can add assets later.</p>}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Next <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={provision} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />} Provision Site
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}