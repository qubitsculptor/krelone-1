import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { api_key, camera_id, zone, image_base64, image_url, mime_type } = payload;

    if (!api_key) return Response.json({ error: 'api_key is required' }, { status: 401 });
    const sites = await base44.asServiceRole.entities.Site.filter({ api_key });
    const site = sites[0];
    if (!site) return Response.json({ error: 'Invalid API key' }, { status: 401 });
    if (!image_base64 && !image_url) {
      return Response.json({ error: 'image_base64 or image_url is required' }, { status: 400 });
    }

    // Rate limit: one analyzed frame per camera/zone every 6 hours (allow_force=true bypasses)
    if (!payload.force) {
      const recentQuery = { site_id: site.id };
      if (camera_id) recentQuery.camera_id = camera_id;
      else if (zone) recentQuery.zone = zone;
      const recent = await base44.asServiceRole.entities.CropScan.filter(recentQuery, '-captured_at', 1);
      const last = recent[0];
      if (last?.captured_at) {
        const hoursSince = (Date.now() - new Date(last.captured_at).getTime()) / 3600000;
        if (hoursSince < 6) {
          return Response.json({
            skipped: true,
            reason: `Last scan for this ${camera_id ? 'camera' : 'zone'} was ${hoursSince.toFixed(1)}h ago — frames are analyzed at most every 6 hours. Pass "force": true to override.`,
            next_scan_in_hours: +(6 - hoursSince).toFixed(1),
          }, { status: 429 });
        }
      }
    }

    // Get image bytes + base64
    let b64 = image_base64;
    let mime = mime_type || 'image/jpeg';
    let bytes;
    if (b64) {
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } else {
      const imgRes = await fetch(image_url);
      if (!imgRes.ok) return Response.json({ error: 'Could not fetch image_url' }, { status: 400 });
      mime = imgRes.headers.get('content-type')?.split(';')[0] || mime;
      bytes = new Uint8Array(await imgRes.arrayBuffer());
      b64 = bytesToBase64(bytes);
    }

    // Store the frame
    const ext = mime.includes('png') ? 'png' : 'jpg';
    const file = new File([bytes], `scan_${Date.now()}.${ext}`, { type: mime });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Zone context for better diagnosis
    let cropContext = '';
    if (zone) {
      const zones = await base44.asServiceRole.entities.Zone.filter({ site_id: site.id, name: zone });
      const z = zones[0];
      if (z) cropContext = `This camera monitors ${z.name}: crop=${z.crop || 'unknown'}, growth stage=${z.growth_stage}, current soil moisture=${z.soil_moisture ?? '?'}%, zone status=${z.status}.`;
    }

    // Trend context: recent scan history for this zone/camera
    let historyContext = '';
    const histQuery = { site_id: site.id };
    if (zone) histQuery.zone = zone;
    else if (camera_id) histQuery.camera_id = camera_id;
    const pastScans = await base44.asServiceRole.entities.CropScan.filter(histQuery, '-captured_at', 8);
    if (pastScans.length > 0) {
      const histLines = pastScans.reverse().map((s) => {
        const issues = (s.findings || []).map((x) => `${x.issue} (${x.severity}, ${x.confidence}%)`).join('; ');
        return `- ${(s.captured_at || '').slice(0, 16)}: ${s.healthy ? 'healthy' : (issues || s.summary)}${s.trend ? ` | trend: ${s.trend}` : ''}`;
      }).join('\n');
      historyContext = `

Scan history for this zone (oldest first):
${histLines}

Compare the current frame against this history. In the "trend" field, state whether previous issues are progressing, stable, or resolved, and quantify visible change where possible (e.g. "leaf yellowing spread from ~5% to ~14% of canopy over 3 days"). If an issue was minor before but is clearly progressing across scans, that progression itself justifies reporting it.`;
    }

    // Gemini vision analysis with structured output
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const prompt = `You are an expert agronomist analyzing an automated field-camera frame from an agrivoltaic farm (crops growing under solar panels). ${cropContext}
Inspect the image ONLY for clearly visible, significant problems: crop diseases (blight, mildew, leaf spot, rust...), pest damage or visible pests, obvious water stress (wilting, curling), clear nutrient deficiencies (chlorosis, discoloration), physical damage, and equipment failures (broken drip lines, damaged panels).

STRICT RULES — your output feeds an automated alerting system, and false alarms destroy farmer trust:
- Report a finding ONLY when you can point to concrete visual evidence in this frame. Never speculate about what "might" be developing or list theoretical risks.
- Ignore normal variation: minor cosmetic blemishes, natural senescence of a few lower leaves, dust, lighting/shadow artifacts, slight color differences between plants.
- If you are less than 60% confident an issue is real, do NOT report it at all.
- A healthy or near-healthy crop must return healthy=true with an empty findings list — this is the expected result for most frames.
- Severity, conservatively: critical = immediate crop loss risk, high = act within 24h, medium = monitor closely, low = minor.${historyContext}`;

    const geminiBody = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mime, data: b64 } },
        ],
      }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'OBJECT',
          properties: {
            healthy: { type: 'BOOLEAN' },
            summary: { type: 'STRING' },
            trend: { type: 'STRING' },
            findings: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  issue: { type: 'STRING' },
                  type: { type: 'STRING', enum: ['disease', 'pest', 'water_stress', 'nutrient_deficiency', 'physical_damage', 'equipment', 'other'] },
                  severity: { type: 'STRING', enum: ['critical', 'high', 'medium', 'low'] },
                  confidence: { type: 'NUMBER' },
                  description: { type: 'STRING' },
                  recommended_action: { type: 'STRING' },
                },
                required: ['issue', 'type', 'severity', 'confidence', 'description'],
              },
            },
          },
          required: ['healthy', 'summary', 'findings'],
        },
      },
    });
    const callGemini = (model) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: geminiBody,
    });
    let geminiRes = await callGemini('gemini-flash-latest');
    if (geminiRes.status === 503 || geminiRes.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      geminiRes = await callGemini('gemini-flash-latest');
    }
    if (geminiRes.status === 503 || geminiRes.status === 429) {
      geminiRes = await callGemini('gemini-flash-lite-latest');
    }
    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      return Response.json({ error: geminiData.error?.message || 'Vision analysis failed' }, { status: 502 });
    }
    const analysis = JSON.parse(geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    const findings = (Array.isArray(analysis.findings) ? analysis.findings : []).map((f) => ({
      ...f,
      confidence: f.confidence <= 1 ? Math.round(f.confidence * 100) : Math.round(f.confidence),
    }));

    // Auto-alert only on confident, serious findings (critical ≥60%, high ≥75% confidence)
    const serious = findings.filter((f) =>
      (f.severity === 'critical' && f.confidence >= 60) ||
      (f.severity === 'high' && f.confidence >= 75)
    );
    let alertCreated = false;
    if (serious.length > 0) {
      // Dedupe: skip findings that already have an active camera alert for this zone
      const activeAlerts = await base44.asServiceRole.entities.Alert.filter({ site_id: site.id, status: 'active' }, '-created_date', 50);
      const newFindings = serious.filter((f) =>
        !activeAlerts.some((a) => a.title.startsWith('Camera AI:') && a.title.toLowerCase().includes(f.issue.toLowerCase()) && (a.zone || '') === (zone || ''))
      );
      for (const f of newFindings) {
        await base44.asServiceRole.entities.Alert.create({
          site_id: site.id,
          title: `Camera AI: ${f.issue}${zone ? ` in ${zone}` : ''}`,
          description: `${f.description} Recommended: ${f.recommended_action || 'inspect immediately'}. (Detected by ${camera_id || 'field camera'}, confidence ${Math.round(f.confidence)}%)`,
          severity: f.severity,
          category: f.type === 'disease' ? 'disease' : f.type === 'equipment' ? 'equipment' : 'crop',
          zone: zone || '',
          status: 'active',
        });
      }
      alertCreated = newFindings.length > 0;

      // Email admins only about NEW issues (no repeat emails for already-active alerts)
      if (newFindings.length > 0) {
        const users = await base44.asServiceRole.entities.User.list();
        const admins = users.filter((u) => u.role === 'admin');
        const lines = newFindings.map((f) => `• [${f.severity.toUpperCase()}] ${f.issue} — ${f.description}\n  Action: ${f.recommended_action || 'inspect immediately'} (confidence ${Math.round(f.confidence)}%)`).join('\n\n');
        const trendLine = analysis.trend ? `\n\nTrend: ${analysis.trend}` : '';
        for (const admin of admins) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            from_name: 'Krelone Vision AI',
            subject: `🚨 Camera alert — ${newFindings[0].issue}${zone ? ` (${zone})` : ''} at ${site.name}`,
            body: `Krelone's vision AI detected issues in a live camera frame${zone ? ` from ${zone}` : ''} at ${site.name}:\n\n${lines}${trendLine}\n\nImage: ${file_url}\n\nOpen the Agriculture page to review the scan.`,
          });
        }
      }
    }

    const scan = await base44.asServiceRole.entities.CropScan.create({
      site_id: site.id,
      camera_id: camera_id || '',
      zone: zone || '',
      image_url: file_url,
      healthy: !!analysis.healthy,
      summary: analysis.summary || '',
      trend: analysis.trend || '',
      findings,
      alert_created: alertCreated,
      captured_at: new Date().toISOString(),
    });

    return Response.json({ scan_id: scan.id, healthy: analysis.healthy, summary: analysis.summary, trend: analysis.trend || '', findings, alert_created: alertCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});