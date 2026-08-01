import React, { useState } from "react";
import { useSite } from "@/lib/SiteContext";
import Panel from "@/components/ui-kit/Panel";
import { Cable, Copy, Check, Eye, EyeOff } from "lucide-react";

function CopyRow({ label, value, mono = true, maskable = false }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(!maskable);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="mb-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
        <code className={`flex-1 text-xs ${mono ? "font-mono" : ""} text-foreground truncate`}>
          {show ? value : "•".repeat(28)}
        </code>
        {maskable && (
          <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        <button onClick={copy} className="text-muted-foreground hover:text-foreground">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function IngestionPanel() {
  const { activeSite } = useSite();
  if (!activeSite) return null;
  const endpoint = `${window.location.origin}/functions/ingestTelemetry`;
  const sample = `{
  "api_key": "<site API key>",
  "readings": [
    { "device_id": "SM-101", "value": 42.5, "unit": "%" },
    { "device_id": "ST-102", "value": 21.3, "unit": "°C" }
  ]
}`;
  return (
    <Panel title="Data Ingestion API" icon={Cable} className="lg:col-span-2">
      <p className="text-xs text-muted-foreground mb-4">
        Point any gateway or datalogger at this endpoint to stream real telemetry into <span className="text-foreground font-medium">{activeSite.name}</span>.
        Each reading's <code className="font-mono">device_id</code> must match a registered sensor's Device ID. Readings update sensors, roll up into zone
        live values and are checked against the zone's configured targets — breaches raise alerts automatically.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
        <div>
          <CopyRow label="Telemetry endpoint (HTTP POST)" value={endpoint} />
          <CopyRow label="Commands endpoint (HTTP POST)" value={`${window.location.origin}/functions/gatewayCommands`} />
          <CopyRow label="Camera frames endpoint (HTTP POST)" value={`${window.location.origin}/functions/ingestCameraImage`} />
          <CopyRow label={`API key — ${activeSite.name}`} value={activeSite.api_key || "No key generated"} maskable />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Poll the commands endpoint with your API key to receive queued control commands (irrigation, valves, trackers).
            Report results back with <code className="font-mono">{'{"action":"ack","results":[{"command_id":"...","status":"completed"}]}'}</code>.
            Field cameras can push frames to the camera endpoint as <code className="font-mono">{'{"api_key":"...","camera_id":"CAM-1","zone":"Zone A","image_base64":"..."}'}</code> —
            each frame is analyzed by the vision AI and serious findings raise alerts and email admins instantly.
            To keep API usage low, frames are analyzed at most once per camera every 6 hours — extra frames are skipped
            (send <code className="font-mono">"force": true</code> to override).
          </p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Example payload</div>
          <pre className="text-[11px] font-mono text-foreground bg-muted/40 border border-border rounded-lg p-3 overflow-x-auto agri-scroll">{sample}</pre>
        </div>
      </div>
    </Panel>
  );
}