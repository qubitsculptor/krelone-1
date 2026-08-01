import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const apiKey = payload.api_key || req.headers.get('x-api-key');
    const readings = payload.readings;

    if (!apiKey || !Array.isArray(readings) || readings.length === 0) {
      return Response.json({ error: 'api_key and a non-empty readings[] array are required' }, { status: 400 });
    }

    // Authenticate the gateway via the per-site API key
    const sites = await base44.asServiceRole.entities.Site.filter({ api_key: apiKey });
    if (sites.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }
    const site = sites[0];

    const sensors = await base44.asServiceRole.entities.Sensor.filter({ site_id: site.id });
    const now = new Date().toISOString();
    const results = [];
    const touchedZones = new Set();
    const readingRecords = [];

    for (const r of readings) {
      const sensor = sensors.find((s) => s.external_id === r.device_id || s.id === r.device_id);
      if (!sensor) {
        results.push({ device_id: r.device_id, status: 'unknown_device' });
        continue;
      }
      const value = Number(r.value);
      if (Number.isNaN(value)) {
        results.push({ device_id: r.device_id, status: 'invalid_value' });
        continue;
      }
      await base44.asServiceRole.entities.Sensor.update(sensor.id, {
        value,
        unit: r.unit || sensor.unit,
        status: 'online',
        last_reading: r.timestamp || now,
      });
      sensor.value = value; // keep in-memory copy fresh for roll-ups
      if (sensor.zone) touchedZones.add(sensor.zone);
      readingRecords.push({
        site_id: site.id,
        sensor_id: sensor.id,
        external_id: sensor.external_id,
        metric: sensor.metric,
        zone: sensor.zone,
        value,
        unit: r.unit || sensor.unit,
        timestamp: r.timestamp || now,
      });
      results.push({ device_id: r.device_id, status: 'ok' });
    }

    // Persist historical readings for time-series charts
    if (readingRecords.length > 0) {
      await base44.asServiceRole.entities.Reading.bulkCreate(readingRecords);
    }

    const metricToZoneField = { soil_moisture: 'soil_moisture', soil_temp: 'soil_temp', par: 'par' };
    const zones = await base44.asServiceRole.entities.Zone.filter({ site_id: site.id });
    const activeAlerts = await base44.asServiceRole.entities.Alert.filter({ site_id: site.id, status: 'active' });
    const profiles = await base44.asServiceRole.entities.CropProfile.list();
    const allAutos = await base44.asServiceRole.entities.Automation.filter({ site_id: site.id, enabled: true });
    const openCommands = await base44.asServiceRole.entities.Command.filter({ site_id: site.id });
    const newAlerts = [];
    const commandsIssued = [];

    // Weather check for rain-aware irrigation — fetched once per request, only when needed
    let rainForecast = null;
    const getRainForecast = async () => {
      if (rainForecast !== null) return rainForecast;
      rainForecast = { expected: false, detail: '' };
      if (site.latitude != null && site.longitude != null) {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&daily=precipitation_sum,precipitation_probability_max&forecast_days=2&timezone=auto`);
          const w = await res.json();
          const prob = Math.max(0, ...(w.daily?.precipitation_probability_max || []).map((v) => v || 0));
          const sum = (w.daily?.precipitation_sum || []).reduce((a, v) => a + (v || 0), 0);
          if (prob >= 60 || sum >= 5) {
            rainForecast = { expected: true, detail: `${prob}% rain probability, ~${Math.round(sum * 10) / 10}mm expected within 48h` };
          }
        } catch (_e) {
          // Weather unavailable — proceed without rain hold
        }
      }
      return rainForecast;
    };

    // Zone-average for a metric; falls back to site-level (zoneless) sensors for ambient metrics
    const zoneAvg = (zoneName, metric, allowSiteFallback) => {
      let zs = sensors.filter((s) => s.zone === zoneName && s.metric === metric && typeof s.value === 'number');
      if (!zs.length && allowSiteFallback) {
        zs = sensors.filter((s) => (!s.zone || s.zone.toLowerCase() === 'site') && s.metric === metric && typeof s.value === 'number');
      }
      if (!zs.length) return null;
      return Math.round((zs.reduce((a, s) => a + s.value, 0) / zs.length) * 10) / 10;
    };

    for (const zoneName of touchedZones) {
      const zone = zones.find((z) => z.name === zoneName);
      if (!zone) continue;

      // Crop profile lookup (case-insensitive, partial match either way)
      const zc = (zone.crop || '').trim().toLowerCase();
      const profile = zc
        ? profiles.find((p) => {
            const pc = (p.crop || '').trim().toLowerCase();
            return pc && (zc === pc || zc.includes(pc) || pc.includes(zc));
          })
        : null;

      const updates = {};
      for (const [metric, field] of Object.entries(metricToZoneField)) {
        const v = zoneAvg(zoneName, metric, false);
        if (v != null) updates[field] = v;
      }

      // Effective thresholds: explicit zone targets override the crop profile
      const th = {
        moisture_min: zone.moisture_target_min ?? profile?.moisture_min,
        moisture_max: zone.moisture_target_max ?? profile?.moisture_max,
        soil_temp_min: zone.temp_target_min ?? profile?.soil_temp_min,
        soil_temp_max: zone.temp_target_max ?? profile?.soil_temp_max,
        air_temp_min: profile?.air_temp_min,
        air_temp_max: profile?.air_temp_max,
        humidity_min: profile?.humidity_min,
        humidity_max: profile?.humidity_max,
        par_max: profile?.par_max,
      };
      const cropTag = profile ? ` (${profile.crop} profile)` : '';

      const moisture = updates.soil_moisture ?? zone.soil_moisture;
      const soilTemp = updates.soil_temp ?? zone.soil_temp;
      const par = updates.par ?? zone.par;
      const airTemp = zoneAvg(zoneName, 'air_temp', true);
      const humidity = zoneAvg(zoneName, 'humidity', true);

      const breaches = [];
      if (moisture != null && th.moisture_min != null && moisture < th.moisture_min) {
        breaches.push({ key: 'moisture_low', title: `Soil moisture low in ${zone.name}`, description: `Reading ${moisture}% is below the minimum of ${th.moisture_min}%${cropTag}.`, severity: 'high', category: 'crop' });
      }
      if (moisture != null && th.moisture_max != null && moisture > th.moisture_max) {
        breaches.push({ key: 'moisture_high', title: `Soil moisture high in ${zone.name}`, description: `Reading ${moisture}% is above the maximum of ${th.moisture_max}%${cropTag}.`, severity: 'medium', category: 'crop' });
      }
      if (soilTemp != null && th.soil_temp_min != null && soilTemp < th.soil_temp_min) {
        breaches.push({ key: 'soil_temp_low', title: `Soil temperature low in ${zone.name}`, description: `Reading ${soilTemp}°C is below the minimum of ${th.soil_temp_min}°C${cropTag}.`, severity: 'medium', category: 'crop' });
      }
      if (soilTemp != null && th.soil_temp_max != null && soilTemp > th.soil_temp_max) {
        breaches.push({ key: 'soil_temp_high', title: `Soil temperature high in ${zone.name}`, description: `Reading ${soilTemp}°C is above the maximum of ${th.soil_temp_max}°C${cropTag}.`, severity: 'high', category: 'crop' });
      }
      if (airTemp != null && th.air_temp_max != null && airTemp > th.air_temp_max) {
        breaches.push({ key: 'air_temp_high', title: `Heat stress risk in ${zone.name}`, description: `Air temperature ${airTemp}°C exceeds the ${th.air_temp_max}°C ceiling${cropTag}. Shading recommended.`, severity: 'high', category: 'crop' });
      }
      if (airTemp != null && th.air_temp_min != null && airTemp < th.air_temp_min) {
        breaches.push({ key: 'air_temp_low', title: `Air temperature low in ${zone.name}`, description: `Air temperature ${airTemp}°C is below the ${th.air_temp_min}°C minimum${cropTag}.`, severity: 'medium', category: 'crop' });
      }
      if (humidity != null && th.humidity_max != null && humidity > th.humidity_max) {
        breaches.push({ key: 'humidity_high', title: `Humidity high in ${zone.name}`, description: `Relative humidity ${humidity}% exceeds the ${th.humidity_max}% ceiling${cropTag}. Increased airflow recommended.`, severity: 'medium', category: 'crop' });
      }
      if (humidity != null && th.humidity_min != null && humidity < th.humidity_min) {
        breaches.push({ key: 'humidity_low', title: `Humidity low in ${zone.name}`, description: `Relative humidity ${humidity}% is below the ${th.humidity_min}% minimum${cropTag}.`, severity: 'low', category: 'crop' });
      }
      if (par != null && th.par_max != null && par > th.par_max) {
        breaches.push({ key: 'par_high', title: `Light stress in ${zone.name}`, description: `PAR ${par} exceeds the ${th.par_max} shading threshold${cropTag}. Tilting trackers for shade recommended.`, severity: 'medium', category: 'crop' });
      }

      // Disease risk rules from the crop profile
      if (profile?.disease_rules && humidity != null) {
        for (const rule of profile.disease_rules) {
          if (rule.humidity_above == null || humidity < rule.humidity_above) continue;
          const tempOk = airTemp == null || (
            (rule.air_temp_min == null || airTemp >= rule.air_temp_min) &&
            (rule.air_temp_max == null || airTemp <= rule.air_temp_max)
          );
          if (!tempOk) continue;
          breaches.push({
            key: 'disease',
            title: `${rule.disease} risk in ${zone.name}`,
            description: `Humidity ${humidity}%${airTemp != null ? ` at ${airTemp}°C` : ''} favors ${rule.disease} on ${profile.crop}. ${rule.advisory || ''}`.trim(),
            severity: rule.severity || 'medium',
            category: 'disease',
          });
        }
      }

      updates.status = breaches.some((b) => b.severity === 'critical' || b.severity === 'high') ? 'critical'
        : breaches.length > 0 ? 'attention' : 'optimal';
      await base44.asServiceRole.entities.Zone.update(zone.id, updates);

      // Dispatch a command through matching enabled automations (approve/autonomous modes)
      const dispatch = async (targets, action, useAutoAction) => {
        const autos = allAutos.filter((a) => a.zone === zone.name && targets.includes(a.target));
        for (const auto of autos) {
          if (auto.mode !== 'autonomous' && auto.mode !== 'approve') continue;
          const open = openCommands.some((c) => c.automation_id === auto.id && ['pending_approval', 'queued', 'sent'].includes(c.status));
          if (open) continue;
          const cmd = await base44.asServiceRole.entities.Command.create({
            site_id: site.id,
            automation_id: auto.id,
            target: auto.target,
            zone: zone.name,
            action: useAutoAction ? (auto.action || action) : action,
            status: auto.mode === 'autonomous' ? 'queued' : 'pending_approval',
            issued_by: 'automation',
          });
          openCommands.push(cmd);
          commandsIssued.push(cmd.action);
          await base44.asServiceRole.entities.Automation.update(auto.id, { last_run: now, runs_today: (auto.runs_today || 0) + 1 });
        }
      };

      const has = (key) => breaches.some((b) => b.key === key);

      // Closed control loop, now weather-aware:
      if (has('moisture_low')) {
        const rain = await getRainForecast();
        if (rain.expected) {
          breaches.push({ key: 'rain_hold', title: `Irrigation held in ${zone.name} — rain expected`, description: `Soil moisture is low but ${rain.detail}. Irrigation was skipped to save water; it will trigger again if moisture stays low after the rain window.`, severity: 'low', category: 'weather' });
        } else {
          await dispatch(['irrigation', 'valve', 'pump'], `Run irrigation in ${zone.name}`, true);
        }
      }
      if (has('moisture_high')) {
        await dispatch(['irrigation', 'valve', 'pump'], `Stop irrigation in ${zone.name} — soil moisture above target`, false);
      }
      if (has('air_temp_high') || has('par_high')) {
        await dispatch(['tracker'], `Tilt trackers to shade ${zone.name}`, false);
      }
      if (has('humidity_high')) {
        await dispatch(['vent', 'fan', 'fogger'], `Increase airflow in ${zone.name} — humidity above target`, false);
      }

      for (const b of breaches) {
        const exists = activeAlerts.some((a) => a.title === b.title);
        if (!exists) {
          const created = await base44.asServiceRole.entities.Alert.create({
            site_id: site.id,
            title: b.title,
            description: b.description,
            severity: b.severity,
            category: b.category || 'crop',
            zone: zone.name,
            status: 'active',
          });
          activeAlerts.push(created);
          newAlerts.push(created);
        }
      }
    }

    // Email admins about newly created critical/high alerts only (avoid inbox noise)
    const urgentAlerts = newAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high');
    if (urgentAlerts.length > 0) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const body = urgentAlerts.map((a) => `[${a.severity.toUpperCase()}] ${a.title}\n${a.description}`).join('\n\n');
      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `${site.name}: ${urgentAlerts.length} new alert${urgentAlerts.length > 1 ? 's' : ''}`,
          body: `New alerts at ${site.name}:\n\n${body}\n\nOpen the Alerts page to acknowledge or resolve.`,
        });
      }
    }

    return Response.json({
      site: site.name,
      received: readings.length,
      stored_readings: readingRecords.length,
      alerts_created: newAlerts.length,
      commands_issued: commandsIssued,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});