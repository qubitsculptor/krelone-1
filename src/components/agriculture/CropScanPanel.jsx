import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, CheckCircle2 } from "lucide-react";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import moment from "moment";

const sevMap = {
  critical: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
  high: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
  medium: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  low: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

export default function CropScanPanel({ siteId }) {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    if (!siteId) return;
    const load = () => base44.entities.CropScan.filter({ site_id: siteId }, "-created_date", 8).then(setScans);
    load();
    const unsubscribe = base44.entities.CropScan.subscribe(() => load());
    return unsubscribe;
  }, [siteId]);

  return (
    <Panel title="Vision AI — Live Camera Scans" icon={Camera}>
      {scans.length === 0 ? (
        <div className="text-center py-10">
          <Camera className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No camera frames analyzed yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Point your field cameras at the camera ingestion endpoint (Settings → Data Ingestion API) and scans will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-muted/30 border border-border">
              <div className="flex gap-3">
                <a href={s.image_url} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={s.image_url} alt="Camera frame" className="w-20 h-20 rounded-lg object-cover border border-border" />
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {s.camera_id || "Camera"}{s.zone ? ` · ${s.zone}` : ""} · {moment(s.captured_at || s.created_date).fromNow()}
                    </span>
                    {s.healthy ? (
                      <Pill className={sevMap.low}><CheckCircle2 className="w-3 h-3" /> healthy</Pill>
                    ) : (
                      <Pill className={sevMap[s.findings?.[0]?.severity] || sevMap.medium}>{s.findings?.length || 0} issue{s.findings?.length === 1 ? "" : "s"}</Pill>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-snug">{s.summary}</p>
                  {s.trend && (
                    <p className="text-xs text-primary/90 mt-1.5 leading-snug">
                      <span className="font-semibold">Trend:</span> {s.trend}
                    </p>
                  )}
                  {(s.findings || []).map((f, i) => (
                    <div key={i} className="mt-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Pill className={sevMap[f.severity]}>{f.severity}</Pill>
                        <span className="text-foreground font-medium">{f.issue}</span>
                        <span className="text-muted-foreground font-mono">{Math.round(f.confidence)}%</span>
                      </div>
                      {f.recommended_action && <p className="text-muted-foreground mt-1">→ {f.recommended_action}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}