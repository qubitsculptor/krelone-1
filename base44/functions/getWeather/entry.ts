import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { site_id } = await req.json();
    if (!site_id) return Response.json({ error: 'site_id required' }, { status: 400 });

    const site = await base44.asServiceRole.entities.Site.get(site_id);
    if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

    // Geocode once from the site's location text, then cache lat/lon on the site
    let latitude = site.latitude;
    let longitude = site.longitude;
    if (latitude == null || longitude == null) {
      if (!site.location) {
        return Response.json({ error: 'Site has no location set. Add a location in site settings.' }, { status: 400 });
      }
      const q = site.location.split(',')[0].trim();
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      const geo = await geoRes.json();
      if (!geo.results || geo.results.length === 0) {
        return Response.json({ error: `Could not find coordinates for "${site.location}"` }, { status: 400 });
      }
      latitude = geo.results[0].latitude;
      longitude = geo.results[0].longitude;
      await base44.asServiceRole.entities.Site.update(site.id, { latitude, longitude });
    }

    // Serve from cache when fresh (30 min) — Open-Meteo rate-limits per IP
    const CACHE_MINUTES = 30;
    const caches = await base44.asServiceRole.entities.WeatherCache.filter({ site_id: site.id });
    const cache = caches[0];
    if (cache && cache.fetched_at && Date.now() - new Date(cache.fetched_at).getTime() < CACHE_MINUTES * 60 * 1000) {
      return Response.json({ ...cache.data, cached: true });
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,cloud_cover',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,shortwave_radiation_sum',
      forecast_days: '7',
      timezone: 'auto',
    });
    // Fetch with retries — the shared egress IP can hit Open-Meteo's per-minute limit
    let res = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (res.ok) break;
      if (res.status !== 429) break;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
    if (!res || !res.ok) {
      // Fall back to stale cache rather than failing outright
      if (cache && cache.data) {
        return Response.json({ ...cache.data, cached: true, stale: true });
      }
      return Response.json({ error: `Open-Meteo request failed (${res ? res.status : 'no response'})` }, { status: 502 });
    }
    const weather = await res.json();

    const result = {
      latitude,
      longitude,
      current: weather.current,
      current_units: weather.current_units,
      daily: weather.daily,
      daily_units: weather.daily_units,
    };

    if (cache) {
      await base44.asServiceRole.entities.WeatherCache.update(cache.id, { data: result, fetched_at: new Date().toISOString() });
    } else {
      await base44.asServiceRole.entities.WeatherCache.create({ site_id: site.id, data: result, fetched_at: new Date().toISOString() });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});