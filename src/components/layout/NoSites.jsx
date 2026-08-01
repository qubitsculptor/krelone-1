import React from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";

export default function NoSites() {
  return (
    <div className="max-w-md mx-auto text-center py-24">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <MapPin className="w-6 h-6 text-primary" />
      </div>
      <h2 className="font-display text-2xl text-foreground mb-2">No sites configured yet</h2>
      <p className="text-sm text-muted-foreground mb-6">Provision your first site — define its zones, crops, condition targets and PV assets, and Krelone adapts to it.</p>
      <Link to="/provision" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
        Provision a site <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}