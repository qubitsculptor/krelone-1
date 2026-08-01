import React from "react";

export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-[1.15]">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-[15px] mt-3 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}