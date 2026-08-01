import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Settings as SettingsIcon, Users, Mail, MessageSquare, Bell, Webhook, LogOut, Radio } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import IngestionPanel from "@/components/settings/IngestionPanel";
import TeamPanel from "@/components/settings/TeamPanel";
import { useRole } from "@/hooks/use-role";

const channels = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "push", label: "Push", icon: Bell },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "webhook", label: "Webhook", icon: Webhook },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [ch, setCh] = useState({ email: true, sms: false, push: true, whatsapp: true, webhook: false });
  const { isAdmin } = useRole();
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Settings" subtitle="Manage account, roles, alert channels and integrations." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Account" icon={Users}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-heading font-bold text-xl">
              {user?.full_name?.[0] || "U"}
            </div>
            <div>
              <div className="text-foreground font-medium">{user?.full_name || "—"}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
              <Pill className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 mt-1 capitalize">{user?.role || "user"}</Pill>
            </div>
          </div>
          <Button variant="ghost" onClick={() => base44.auth.logout()} className="text-muted-foreground w-full justify-start">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </Panel>

        <Panel title="Alert Channels" icon={Bell}>
          <div className="space-y-3">
            {channels.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{c.label}</span>
                  </div>
                  <Switch checked={ch[c.id]} onCheckedChange={(v) => setCh({ ...ch, [c.id]: v })} />
                </div>
              );
            })}
          </div>
        </Panel>

        <TeamPanel />

        <Panel title="Protocols & Ingestion" icon={Radio}>
          <div className="flex flex-wrap gap-2">
            {["MQTT", "Modbus", "OPC-UA", "HTTP", "LoRaWAN", "Zigbee", "BLE"].map((p) => (
              <Pill key={p} className="bg-primary/5 text-primary border-primary/15 font-mono">{p}</Pill>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Sensor, camera and telemetry data ingested continuously into the unified digital twin.</p>
        </Panel>

        {isAdmin && <IngestionPanel />}
      </div>
    </div>
  );
}