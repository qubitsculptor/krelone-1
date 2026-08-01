import React from "react";
import { Input } from "@/components/ui/input";

export default function Field({ label, hint, ...props }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      <Input {...props} />
      {hint && <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>}
    </div>
  );
}