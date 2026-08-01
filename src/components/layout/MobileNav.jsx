import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Leaf } from "lucide-react";
import {
  LayoutDashboard, Sprout, Zap, Bot, Lightbulb, Bell,
  ClipboardList, LineChart, Settings, MapPinned, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/agripv";

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

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-sm tracking-tight">Krelone</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-sidebar-foreground p-1">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-1.5 p-3 bg-sidebar border-b border-sidebar-border">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium",
                  isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground bg-sidebar-accent/40"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}