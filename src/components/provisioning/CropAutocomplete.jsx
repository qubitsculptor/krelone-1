import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Leaf, Check } from "lucide-react";

export default function CropAutocomplete({ value, onChange, onSelectProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    base44.entities.CropProfile.list().then(setProfiles);
  }, []);

  useEffect(() => {
    const close = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const matches = value
    ? profiles.filter((p) => p.crop.toLowerCase().includes(value.toLowerCase()))
    : profiles;
  const exactMatch = profiles.some((p) => p.crop.toLowerCase() === (value || "").toLowerCase());

  return (
    <div ref={wrapRef} className="relative">
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">Crop</label>
      <Input
        placeholder="e.g. Tomato"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
      />
      {exactMatch && (
        <p className="text-[11px] text-primary mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Crop profile applied</p>
      )}
      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {matches.slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => { e.preventDefault(); onSelectProfile(p); setOpen(false); }}
            >
              <Leaf className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{p.crop}</span>
              <span className="text-[11px] text-muted-foreground ml-auto capitalize">{p.category?.replace("_", " ")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}