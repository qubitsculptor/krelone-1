import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CloudSun, Droplets, Wind, Umbrella } from "lucide-react";
import Panel from "@/components/ui-kit/Panel";

const wmoLabel = (code) => {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  return "Thunderstorm";
};

const fetchDirect = async (lat, lon) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,cloud_cover",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    forecast_days: "7",
    timezone: "auto",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  const w = await r.json();
  return { current: w.current, daily: w.daily };
};

export default function WeatherPanel({ site }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!site) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (site.latitude != null && site.longitude != null) {
          setWeather(await fetchDirect(site.latitude, site.longitude));
        } else {
          // Backend geocodes the site's location once, saves coordinates, and returns the forecast
          const res = await base44.functions.invoke("getWeather", { site_id: site.id });
          setWeather(res.data);
        }
      } catch {
        try {
          const res = await base44.functions.invoke("getWeather", { site_id: site.id });
          setWeather(res.data);
        } catch (e2) {
          setError(e2.response?.data?.error || "Could not load weather");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [site]);

  return (
    <Panel title="Weather — Open-Meteo" icon={CloudSun}>
      {loading && <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Loading weather…</div>}
      {!loading && error && <div className="h-24 flex items-center justify-center text-sm text-muted-foreground text-center px-6">{error}</div>}
      {!loading && !error && weather && (
        <div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-5">
            <div>
              <div className="font-display text-3xl font-medium text-foreground">{Math.round(weather.current.temperature_2m)}°C</div>
              <div className="text-xs text-muted-foreground">{wmoLabel(weather.current.weather_code)}</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Droplets className="w-4 h-4 text-sky-600" /> {weather.current.relative_humidity_2m}% humidity
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="w-4 h-4 text-slate-500" /> {weather.current.wind_speed_10m} km/h wind
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Umbrella className="w-4 h-4 text-violet-600" /> {weather.current.precipitation} mm precipitation
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {weather.daily.time.map((day, i) => (
              <div key={day} className="rounded-xl border border-border bg-muted/40 p-2.5 text-center">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  {new Date(day).toLocaleDateString([], { weekday: "short" })}
                </div>
                <div className="text-sm font-medium text-foreground mt-1">
                  {Math.round(weather.daily.temperature_2m_max[i])}°
                  <span className="text-muted-foreground font-normal"> / {Math.round(weather.daily.temperature_2m_min[i])}°</span>
                </div>
                <div className="text-[11px] text-sky-600 mt-0.5">{weather.daily.precipitation_probability_max?.[i] ?? 0}% rain</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}