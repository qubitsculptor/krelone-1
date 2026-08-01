import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const STALE_MINUTES = 30;
    const cutoff = Date.now() - STALE_MINUTES * 60 * 1000;

    const sensors = await base44.asServiceRole.entities.Sensor.list(null, 500);
    const stale = sensors.filter((s) =>
      s.status !== 'offline' && s.last_reading && new Date(s.last_reading).getTime() < cutoff
    );

    if (stale.length === 0) {
      return Response.json({ checked: sensors.length, marked_offline: 0, alerts_created: 0 });
    }

    // Existing active communication alerts, per site (to avoid duplicates)
    const siteIds = [...new Set(stale.map((s) => s.site_id).filter(Boolean))];
    const alertsBySite = {};
    for (const siteId of siteIds) {
      alertsBySite[siteId] = await base44.asServiceRole.entities.Alert.filter({
        site_id: siteId, status: 'active', category: 'communication',
      });
    }

    const newAlerts = [];
    for (const s of stale) {
      await base44.asServiceRole.entities.Sensor.update(s.id, { status: 'offline' });
      const title = `Sensor offline: ${s.name}`;
      const exists = (alertsBySite[s.site_id] || []).some((a) => a.title === title);
      if (!exists && s.site_id) {
        const created = await base44.asServiceRole.entities.Alert.create({
          site_id: s.site_id,
          title,
          description: `No data received from ${s.name} (${s.external_id || 'no device id'}) for over ${STALE_MINUTES} minutes. Last reading: ${s.last_reading}.`,
          severity: 'high',
          category: 'communication',
          zone: s.zone,
          status: 'active',
        });
        newAlerts.push(created);
      }
    }

    // Email admins about sensors that just went offline
    if (newAlerts.length > 0) {
      const sites = await base44.asServiceRole.entities.Site.list();
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const body = newAlerts.map((a) => {
        const site = sites.find((x) => x.id === a.site_id);
        return `[${site ? site.name : 'Unknown site'}] ${a.title}\n${a.description}`;
      }).join('\n\n');
      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `${newAlerts.length} sensor${newAlerts.length > 1 ? 's' : ''} went offline`,
          body,
        });
      }
    }

    return Response.json({ checked: sensors.length, marked_offline: stale.length, alerts_created: newAlerts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});