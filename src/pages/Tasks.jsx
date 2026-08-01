import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, Bot } from "lucide-react";
import PageHeader from "@/components/ui-kit/PageHeader";
import Pill from "@/components/ui-kit/Pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { priorityColor, cn } from "@/lib/agripv";
import { useSite } from "@/lib/SiteContext";

const columns = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
  { id: "verified", label: "Verified" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "inspection", zone: "", priority: "medium", assignee: "" });
  const { activeSite } = useSite();
  const load = () => activeSite && base44.entities.Task.filter({ site_id: activeSite.id }, "-created_date").then(setTasks);
  useEffect(() => { load(); }, [activeSite]);

  const move = async (t, status) => { await base44.entities.Task.update(t.id, { status }); load(); };
  const create = async () => {
    if (!form.title) return;
    await base44.entities.Task.create({ ...form, site_id: activeSite?.id, status: "open" });
    setForm({ title: "", type: "inspection", zone: "", priority: "medium", assignee: "" });
    setOpen(false); load();
  };

  const next = { open: "in_progress", in_progress: "done", done: "verified" };

  return (
    <div>
      <PageHeader eyebrow="Task Management" title="Work Orders"
        subtitle="Auto-generated and manual tasks — assign, track, and verify completion."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium"><Plus className="w-4 h-4 mr-1.5" /> New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Create Task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Zone" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
                <Input placeholder="Assignee" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["inspection", "maintenance", "cleaning", "repair", "harvest", "calibration", "scouting"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["urgent", "high", "medium", "low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="rounded-2xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <span className="font-heading font-semibold text-foreground text-sm">{col.label}</span>
                <span className="text-xs text-muted-foreground font-mono">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm text-foreground font-medium leading-snug">{t.title}</span>
                      {t.auto_created && <Bot className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" title="Auto-created" />}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Pill className={priorityColor[t.priority]}>{t.priority}</Pill>
                      <span className="text-[11px] text-muted-foreground capitalize">{t.type}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground/60 mb-2">{t.zone} {t.assignee && `· ${t.assignee}`}</div>
                    {next[t.status] && (
                      <button onClick={() => move(t, next[t.status])}
                        className="w-full text-[11px] py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors capitalize">
                        Move to {next[t.status].replace("_", " ")}
                      </button>
                    )}
                  </div>
                ))}
                {items.length === 0 && <div className="text-center text-xs text-muted-foreground/50 py-6">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}