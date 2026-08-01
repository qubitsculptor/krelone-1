import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const apiKey = payload.api_key || req.headers.get('x-api-key');
    if (!apiKey) {
      return Response.json({ error: 'api_key required' }, { status: 400 });
    }

    // Authenticate the gateway via the per-site API key
    const sites = await base44.asServiceRole.entities.Site.filter({ api_key: apiKey });
    if (sites.length === 0) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }
    const site = sites[0];

    // Gateway reports execution results: { action: 'ack', results: [{ command_id, status: 'completed'|'failed', message }] }
    if (payload.action === 'ack') {
      const results = Array.isArray(payload.results) ? payload.results : [];
      let acknowledged = 0;
      for (const r of results) {
        const matches = await base44.asServiceRole.entities.Command.filter({ id: r.command_id, site_id: site.id });
        if (matches.length === 0) continue;
        const update = {
          status: r.status === 'failed' ? 'failed' : 'completed',
          result_message: r.message || '',
          executed_at: new Date().toISOString(),
        };
        if (typeof r.water_liters === 'number') update.water_liters = r.water_liters;
        await base44.asServiceRole.entities.Command.update(matches[0].id, update);
        acknowledged++;
      }
      return Response.json({ site: site.name, acknowledged });
    }

    // Default: poll for queued commands — returns them and marks them as sent
    const queued = await base44.asServiceRole.entities.Command.filter({ site_id: site.id, status: 'queued' });
    for (const c of queued) {
      await base44.asServiceRole.entities.Command.update(c.id, { status: 'sent' });
    }
    return Response.json({
      site: site.name,
      commands: queued.map((c) => ({
        id: c.id,
        target: c.target,
        zone: c.zone,
        action: c.action,
        issued_at: c.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});