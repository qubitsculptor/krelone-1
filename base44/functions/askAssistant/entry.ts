import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, site_id, history } = await req.json();
    if (!question || !site_id) {
      return Response.json({ error: 'question and site_id are required' }, { status: 400 });
    }

    // Tenant guard: non-admin operators may only query their assigned site
    if (user.role !== 'admin' && user.site_id !== site_id) {
      return Response.json({ error: 'Forbidden: you can only ask about your own site' }, { status: 403 });
    }

    // Gather live farm context
    const [sites, zones, sensors, alerts, recommendations, commands, automations] = await Promise.all([
      base44.entities.Site.filter({ id: site_id }),
      base44.entities.Zone.filter({ site_id }),
      base44.entities.Sensor.filter({ site_id }),
      base44.entities.Alert.filter({ site_id, status: 'active' }),
      base44.entities.Recommendation.filter({ site_id, status: 'pending' }),
      base44.entities.Command.filter({ site_id }, '-created_date', 15),
      base44.entities.Automation.filter({ site_id }),
    ]);
    const site = sites[0];
    if (!site) return Response.json({ error: 'Site not found' }, { status: 404 });

    // Weather (best effort)
    let weather = 'unavailable';
    if (site.latitude != null && site.longitude != null) {
      try {
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&current=temperature_2m,relative_humidity_2m,precipitation&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`).then((r) => r.json());
        weather = JSON.stringify({ current: w.current, daily: w.daily });
      } catch (_e) { /* skip */ }
    }

    const context = `
SITE: ${site.name} (${site.location || 'unknown location'}), ${site.total_area_hectares || '?'} ha, PV capacity ${site.pv_capacity_kw || '?'} kW, grid: ${site.grid_connection}.

ZONES:
${zones.map((z) => `- ${z.name}: crop=${z.crop || 'none'} (${z.growth_stage}), status=${z.status}, health=${z.health_score ?? '?'}, soil_moisture=${z.soil_moisture ?? '?'}%, soil_temp=${z.soil_temp ?? '?'}°C, PAR=${z.par ?? '?'}, moisture targets ${z.moisture_target_min ?? '?'}-${z.moisture_target_max ?? '?'}%`).join('\n')}

SENSORS (latest values):
${sensors.map((s) => `- ${s.name} [${s.metric}] zone=${s.zone || 'site'}: ${s.value ?? '?'} ${s.unit || ''} (${s.status})`).join('\n')}

ACTIVE ALERTS:
${alerts.length ? alerts.map((a) => `- [${a.severity}] ${a.title}: ${a.description || ''}`).join('\n') : 'None'}

PENDING RECOMMENDATIONS:
${recommendations.length ? recommendations.map((r) => `- [${r.priority}] ${r.problem} → ${r.action}`).join('\n') : 'None'}

RECENT COMMANDS:
${commands.map((c) => `- ${c.action} (${c.status})${c.water_liters ? `, ${c.water_liters}L` : ''}`).join('\n') || 'None'}

AUTOMATIONS:
${automations.map((a) => `- ${a.name} [${a.target}] zone=${a.zone || 'all'}, mode=${a.mode}, ${a.enabled ? 'enabled' : 'disabled'}`).join('\n') || 'None'}

WEATHER (Open-Meteo): ${weather}
`;

    const systemInstruction = `You are Krelone, an expert agronomist and agrivoltaics operations assistant for the site described below. Answer the user's questions using the live farm data provided. Be practical, specific, and concise. Reference actual zones, readings and thresholds. Give actionable advice on irrigation, crop health, disease risk, PV performance and water/energy trade-offs. Use metric units. If data is missing, say so rather than inventing numbers. You serve ONLY this one site: if asked about any other site, farm, tenant or platform-wide data, politely refuse and explain you can only discuss ${site.name}.\n\n${context}`;

    const contents = [
      ...(Array.isArray(history) ? history.slice(-10).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })) : []),
      { role: 'user', parts: [{ text: question }] },
    ];

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const body = JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
    });
    const callGemini = (model) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // Try primary model, retry once, then fall back to a lighter model on overload (503/429)
    let res = await callGemini('gemini-flash-latest');
    if (res.status === 503 || res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await callGemini('gemini-flash-latest');
    }
    if (res.status === 503 || res.status === 429) {
      res = await callGemini('gemini-flash-lite-latest');
    }
    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data.error?.message || 'Gemini API error' }, { status: 502 });
    }
    const answer = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || 'No response generated.';
    return Response.json({ answer });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});