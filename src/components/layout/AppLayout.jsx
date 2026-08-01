import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import NoSites from "./NoSites";
import { SiteProvider, useSite } from "@/lib/SiteContext";

function LayoutInner() {
  const { sites, loading } = useSite();
  const loc = useLocation();
  const needsSite = !loading && sites.length === 0 && loc.pathname !== "/provision" && loc.pathname !== "/settings";

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <MobileNav />
          <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
            {needsSite ? <NoSites /> : <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SiteProvider>
      <LayoutInner />
    </SiteProvider>
  );
}