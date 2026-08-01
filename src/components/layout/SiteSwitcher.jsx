import React from "react";
import { Link } from "react-router-dom";
import { useSite } from "@/lib/SiteContext";
import { MapPin, ChevronsUpDown, Check, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRole } from "@/hooks/use-role";

export default function SiteSwitcher() {
  const { sites, activeSite, selectSite } = useSite();
  const { isAdmin } = useRole();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/60 border border-sidebar-border hover:bg-sidebar-accent transition-colors text-left">
          <MapPin className="w-4 h-4 text-sidebar-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-sidebar-accent-foreground truncate">{activeSite?.name || "No site"}</div>
            <div className="text-[10px] text-sidebar-foreground/60 truncate">{activeSite?.location || "Provision a site"}</div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-foreground/50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {sites.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => selectSite(s.id)} className="gap-2">
            <span className="flex-1 truncate">{s.name}</span>
            {activeSite?.id === s.id && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            {sites.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem asChild>
              <Link to="/provision" className="gap-2 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Provision new site</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}