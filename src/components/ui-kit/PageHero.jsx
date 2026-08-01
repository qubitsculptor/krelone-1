import React from "react";

export default function PageHero({ eyebrow, title, subtitle, image, actions }) {
  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 min-h-[260px] flex items-end">
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
      <div className="relative w-full p-7 lg:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 mb-3">{eyebrow}</p>
          )}
          <h1 className="font-display text-3xl lg:text-[2.75rem] font-medium text-white tracking-tight leading-[1.08]">{title}</h1>
          {subtitle && <p className="text-white/75 text-[15px] mt-3 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}