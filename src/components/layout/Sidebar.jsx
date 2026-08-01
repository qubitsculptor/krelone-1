import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Sprout, Zap, Bot, Lightbulb, Bell,
  ClipboardList, LineChart, Settings, Leaf, MapPinned, Sun, Moon, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/agripv";
import SiteSwitcher from "./SiteSwitcher";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/live-farm", label: "Live Farm", icon: MapPinned },
  { to: "/energy", label: "Energy", icon: Zap },
  { to: "/agriculture", label: "Agriculture", icon: Sprout },
  { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { to: "/automation", label: "Automation", icon: Bot },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/assistant", label: "Assistant", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const loc = useLocation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-white text-[15px] tracking-tight leading-none">Krelone</div>
            <div className="text-[10px] text-sidebar-foreground/50 font-mono uppercase tracking-widest mt-0.5">intelligence</div>
          </div>
        </div>
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-7 h-7 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/80 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Site switcher */}
      <div className="px-3 pt-3">
        <SiteSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto agri-scroll py-4 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = loc.pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:text-white hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className={cn("w-[17px] h-[17px] shrink-0", active ? "text-sidebar-primary" : "")} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl bg-sidebar-accent/60 border border-sidebar-border p-3.5">
          <div className="text-[10px] text-sidebar-foreground/40 font-mono uppercase tracking-widest mb-1.5">Decision Loop</div>
          <div className="text-[11px] text-sidebar-primary/80 font-medium leading-relaxed">
            Observe · Understand · Predict<br />Decide · Execute · Learn
          </div>
        </div>
      </div>
    </aside>
  );
}