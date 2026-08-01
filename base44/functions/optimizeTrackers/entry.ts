import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Multi-objective tracker policy engine.
// For each crop zone it weighs: stage light needs (DLI target + sensitivity),
// light accumulated so far today, forecast irradiance + heat risk, and the
// operator's crop/energy priority — then issues a tracker strategy.

const SW_TO_PPFD = 2.06;          // W/m² shortwave -> µmol/m²/s PPFD (approx)
const PANEL_TRANSMISSION = 0.6;   // fraction of open-field light reaching crops under panels

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const payload = await req.json().catch(() => ({}));

    const sites = payload.site_id
      ? [await base44.asServiceRole.entities.Site.get(payload.site_id)]
      : await base44.asServiceRole.entities.Site.filter({ status: 'active' });

    const profiles = await base44.asServiceRole.entities.CropProfile.list(null, 200);
    const results = [];

    for (const site of sites) {
      if (!site || site.latitude == null || site.longitude == null) continue;

      // Forecast: hourly irradiance + temp, daily max temp + sunrise/sunset
      const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&hourly=temperature_2m,shortwave_radiation&daily=temperature_2m_max,sunrise,sunset&forecast_days=1&timezone=auto`);
      const weather = await wRes.json();
      if (!wRes.ok || !weather.hourly) continue;
      const offsetMs = (weather.utc_offset_seconds || 0) * 1000;
      const nowLocal = Date.now() + offsetMs; // compare against Open-Meteo local times parsed as UTC
      const sunrise = Date.parse(weather.daily.sunrise[0] + ':00Z');
      const sunset = Date.parse(weather.daily.sunset[0] + ':00Z');
      const maxTemp = weather.daily.temperature_2m_max[0];

      // Projected additional open-field DLI from remaining forecast hours (mol/m²)
      let remainingDli = 0;
      weather.hourly.time.forEach((t, i) => {
        const ts = Date.parse(t + ':00Z');
        if (ts >= nowLocal && ts <= sunset) {
          remainingDli += (weather.hourly.shortwave_radiation[i] || 0) * SW_TO_PPFD * 3600 / 1e6;
        }
      });
      const elapsedDaylightSec = Math.max(0, (Math.min(nowLocal, sunset) - sunrise) / 1000);

      const zones = await base44.asServiceRole.entities.Zone.filter({ site_id: site.id });
      const automations = await base44.asServiceRole.entities.Automation.filter({ site_id: site.id, target: 'tracker' });
      const todayStart = new Date(nowLocal - offsetMs); todayStart.setHours(todayStart.getHours() - 24);
      const parReadings = await base44.asServiceRole.entities.Reading.filter({ site_id: site.id, metric: 'par' }, '-timestamp', 300);

      for (const zone of zones) {
        const reasoning = [];
        let strategy = 'balanced';
        let action = 'Standard tracking with mild crop-safe limits';
        let cropWeight = 0;
        let dliSoFar = 0, dliProjected = 0, dliTarget = 0;
        let heatRisk = 'none';

        const isSolarOnly = zone.type === 'solar' || !zone.crop;
        const profile = zone.crop ? profiles.find((p) => p.crop.toLowerCase() === zone.crop.toLowerCase()) : null;

        if (isSolarOnly || zone.growth_stage === 'harvest') {
          strategy = 'maximize_energy';
          action = 'Track sun for maximum PV output';
          reasoning.push(isSolarOnly ? 'No active crop in this zone — full energy priority.' : `${zone.crop} is at harvest stage — light no longer drives yield, full energy priority.`);
        } else {
          // Stage light target
          const stageTarget = profile?.stage_light_targets?.find((s) => s.stage === zone.growth_stage);
          dliTarget = stageTarget?.dli_target || 12;
          const sensitivity = stageTarget?.light_sensitivity || 'medium';

          // Effective crop weight = operator priority adjusted by stage sensitivity
          cropWeight = zone.crop_priority ?? 50;
          if (sensitivity === 'high') cropWeight = Math.min(100, cropWeight + 20);
          if (sensitivity === 'low') cropWeight = Math.max(0, cropWeight - 20);
          reasoning.push(`${zone.crop} (${zone.growth_stage}): light sensitivity ${sensitivity}, DLI target ${dliTarget} mol/m²/day. Effective crop weight ${Math.round(cropWeight)}%.`);

          // DLI accumulated today under the panels (from PAR sensors, fallback to live zone PAR)
          const zoneReadings = parReadings.filter((r) => r.zone === zone.name && new Date(r.timestamp || r.created_date).getTime() > nowLocal - offsetMs - 86400000 * 0.75);
          const avgPar = zoneReadings.length
            ? zoneReadings.reduce((s, r) => s + r.value, 0) / zoneReadings.length
            : (zone.par || 0);
          dliSoFar = +(avgPar * elapsedDaylightSec / 1e6).toFixed(1);
          dliProjected = +(dliSoFar + remainingDli * PANEL_TRANSMISSION).toFixed(1);
          reasoning.push(`DLI so far ~${dliSoFar} mol/m², projected end-of-day ~${dliProjected} (${zoneReadings.length ? 'from PAR sensors' : 'estimated from live PAR'} + forecast).`);

          // Heat risk vs crop tolerance
          const tempMax = profile?.air_temp_max ?? 32;
          if (maxTemp >= tempMax + 2) heatRisk = 'high';
          else if (maxTemp >= tempMax) heatRisk = 'moderate';
          if (heatRisk !== 'none') reasoning.push(`Forecast max ${maxTemp}°C vs crop tolerance ${tempMax}°C — ${heatRisk} heat stress risk.`);

          // Policy decision
          if (heatRisk === 'high' && cropWeight >= 30) {
            strategy = 'heat_protection';
            action = 'Increase midday shading: offset trackers ~+15° over canopy 11:00–16:00 (panels still harvest peak sun)';
            reasoning.push('Shade is the product today: protects yield, cuts irrigation demand, PV loses little at peak irradiance.');
          } else if (dliProjected < dliTarget * 0.9 && cropWeight >= 50) {
            strategy = 'crop_light_priority';
            action = 'Admit light: flatten/offset trackers off-sun during peak hours until DLI target is met';
            reasoning.push(`Projected DLI ${dliProjected} is below the stage target ${dliTarget} — this stage pays back light in yield.`);
          } else if (dliProjected >= dliTarget * 1.1) {
            strategy = 'maximize_energy';
            action = 'Track sun for maximum PV output';
            reasoning.push(`Crop light budget already met (${dliProjected} ≥ ${dliTarget} mol/m²) — surplus sun goes to energy.`);
          } else {
            reasoning.push('Light budget on track and no stress risk — balanced tracking.');
          }
        }

        // Skip a new command if strategy is unchanged from the latest plan
        const prev = await base44.asServiceRole.entities.TrackerPlan.filter({ site_id: site.id, zone: zone.name }, '-computed_at', 1);
        let commandCreated = false;
        if (prev[0]?.strategy !== strategy) {
          const auto = automations.find((a) => a.enabled && (!a.zone || a.zone === zone.name));
          const mode = auto?.mode || 'recommend';
          if (mode !== 'observe') {
            await base44.asServiceRole.entities.Command.create({
              site_id: site.id,
              target: 'tracker',
              zone: zone.name,
              action: `[${strategy.replace(/_/g, ' ')}] ${action}`,
              status: mode === 'autonomous' ? 'queued' : 'pending_approval',
              issued_by: 'automation',
              automation_id: auto?.id || '',
            });
            commandCreated = true;
          }
        } else {
          reasoning.push('Strategy unchanged since last run — no new tracker command issued.');
        }

        await base44.asServiceRole.entities.TrackerPlan.create({
          site_id: site.id,
          zone: zone.name,
          crop: zone.crop || '',
          growth_stage: zone.growth_stage || '',
          strategy,
          action,
          reasoning,
          crop_weight: Math.round(cropWeight),
          dli_so_far: dliSoFar,
          dli_projected: dliProjected,
          dli_target: dliTarget,
          heat_risk: heatRisk,
          forecast_max_temp: maxTemp,
          command_created: commandCreated,
          computed_at: new Date().toISOString(),
        });

        results.push({ site: site.name, zone: zone.name, strategy, action, command_created: commandCreated });
      }
    }

    return Response.json({ optimized: results.length, plans: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});