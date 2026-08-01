import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSiteId, setActiveSiteId] = useState(() => localStorage.getItem("krelone_active_site") || "");

  const refresh = async () => {
    const list = await base44.entities.Site.list();
    setSites(list);
    setLoading(false);
    return list;
  };

  useEffect(() => { refresh(); }, []);

  const activeSite = sites.find((s) => s.id === activeSiteId) || sites[0] || null;

  const selectSite = (id) => {
    setActiveSiteId(id);
    localStorage.setItem("krelone_active_site", id);
  };

  return (
    <SiteContext.Provider value={{ sites, activeSite, selectSite, loading, refresh }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);