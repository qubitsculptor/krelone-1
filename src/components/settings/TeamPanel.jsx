import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, UserPlus, Loader2, ShieldCheck } from "lucide-react";
import Panel from "@/components/ui-kit/Panel";
import Pill from "@/components/ui-kit/Pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useRole } from "@/hooks/use-role";
import { useSite } from "@/lib/SiteContext";

export default function TeamPanel() {
  const { isAdmin } = useRole();
  const { sites, refresh } = useSite();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const load = () => base44.entities.User.list().then(setMembers).catch(() => {});
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const invite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(email.trim(), role);
      toast({ title: `Invitation sent to ${email.trim()} as ${role}` });
      setEmail("");
      load();
    } catch (e) {
      toast({ title: "Invite failed", description: e.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const assignSite = async (member, siteId) => {
    // Keep site membership lists in sync with the user's assignment
    for (const s of sites) {
      const has = (s.member_emails || []).includes(member.email);
      if (s.id === siteId && !has) {
        await base44.entities.Site.update(s.id, { member_emails: [...(s.member_emails || []), member.email] });
      } else if (s.id !== siteId && has) {
        await base44.entities.Site.update(s.id, { member_emails: (s.member_emails || []).filter((e) => e !== member.email) });
      }
    }
    await base44.entities.User.update(member.id, { site_id: siteId });
    toast({ title: `${member.email} assigned to ${sites.find((s) => s.id === siteId)?.name || "site"}` });
    refresh();
    load();
  };

  if (!isAdmin) {
    return (
      <Panel title="Team & Roles" icon={Users}>
        <p className="text-sm text-muted-foreground">
          Only administrators can manage team members and roles. Ask your admin for access changes.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Team & Roles" icon={Users}>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={invite} disabled={inviting || !email.trim()}>
          {inviting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1.5" />} Invite
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {(m.full_name || m.email)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground font-semibold truncate">{m.full_name || m.email}</div>
              <div className="text-xs text-muted-foreground truncate">{m.email}</div>
            </div>
            {m.role !== "admin" && (
              <Select value={m.site_id || ""} onValueChange={(v) => assignSite(m, v)}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Assign site…" /></SelectTrigger>
                <SelectContent>
                  {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Pill className={m.role === "admin"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-muted text-muted-foreground border-border"}>
              {m.role === "admin" && <ShieldCheck className="w-3 h-3" />} {m.role}
            </Pill>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Admins can provision sites, control automations and approve commands, and see every site. Operators (users) only see the single site they are assigned to — assign one with the dropdown above.
      </p>
    </Panel>
  );
}