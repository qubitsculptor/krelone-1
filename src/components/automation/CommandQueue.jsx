import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Terminal, Check, X } from "lucide-react";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";

const cmdStatusColor = {
  pending_approval: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  queued: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  sent: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-700 border-red-500/20",
  rejected: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function CommandQueue({ siteId }) {
  const [commands, setCommands] = useState([]);
  const { isAdmin } = useRole();

  const load = () => {
    if (!siteId) return;
    base44.entities.Command.filter({ site_id: siteId }, "-created_date", 25).then(setCommands);
  };
  useEffect(() => { load(); }, [siteId]);

  useEffect(() => {
    const unsubscribe = base44.entities.Command.subscribe(() => load());
    return unsubscribe;
  }, [siteId]);

  const decide = async (cmd, approved) => {
    await base44.entities.Command.update(cmd.id, { status: approved ? "queued" : "rejected" });
    load();
  };

  const pending = commands.filter((c) => c.status === "pending_approval");

  return (
    <Panel title="Command Queue" icon={Terminal}>
      {pending.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            {isAdmin ? "Awaiting your approval" : "Awaiting admin approval"}
          </div>
          {pending.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground font-medium truncate">{c.action}</div>
                <div className="text-xs text-muted-foreground capitalize">{c.target} · {c.zone || "site-wide"} · by {c.issued_by}</div>
              </div>
              {isAdmin && (
                <>
                  <Button size="sm" onClick={() => decide(c, true)}><Check className="w-3.5 h-3.5 mr-1" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decide(c, false)}><X className="w-3.5 h-3.5 mr-1" /> Reject</Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {commands.filter((c) => c.status !== "pending_approval").slice(0, 10).map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground truncate">{c.action}</div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {c.zone || "—"} · {new Date(c.created_date).toLocaleString()}
                {c.result_message && ` · ${c.result_message}`}
              </div>
            </div>
            <Pill className={cmdStatusColor[c.status]}>{c.status.replace("_", " ")}</Pill>
          </div>
        ))}
        {commands.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No commands yet. Automations in approve or autonomous mode dispatch commands here; your gateway polls and executes them.
          </p>
        )}
      </div>
    </Panel>
  );
}