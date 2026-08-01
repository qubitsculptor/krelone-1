# Krelone — Project Brief

> Reference document for development. Krelone is an AgriPV land-value optimization platform.
> Motors maximize energy. **Krelone decides why the panels should move** — to maximize the total value of the land.

**Current codebase:** this repository (`krelone/`). Brand name **Krelone** is temporary / working title (no trademark conflict intended). The older sibling app outside this folder is legacy.

---

## 1. Summary

Krelone is an operations and optimization platform for **agrivoltaic (AgriPV) sites** — land where solar panels and crops share the same ground. On these sites, sun-tracking panel motors already exist to maximize electricity. Krelone sits above the hardware and continuously decides how the panels (and irrigation) should behave so the land produces the **most combined value from crops and energy**, not just the most kilowatt-hours.

The tracker executes an angle. Krelone decides the intent behind that angle.

---

## 2. Objective

**Maximize the total value of the land**, balancing competing goals in real time:

```
Value ≈ w_crop    × Crop Yield
      + w_energy  × Energy Revenue
      − w_water   × Water Cost
      − w_heat    × Heat Stress
      − w_disease × Disease Risk
```

The weights shift based on crop, growth stage, weather, season, and economics. Krelone owns that balancing act.

- Not "maximize solar energy."
- Not "another monitoring dashboard."
- Yes: **a multi-objective optimization engine for AgriPV** that trades crop light against energy revenue intelligently.

This engine is the core IP / moat. Sensors, computer vision, weather feeds, dashboards, and APIs are infrastructure that feed it.

---

## 3. What it does

### Shipped today (krelone)

- **Ingests live site data:** soil moisture/temp, PAR, air temp, humidity, PV-related metrics, irrigation status, weather forecast (Open-Meteo).
- **Knows the crop (partial):** `CropProfile` with thresholds, disease rules, and per-stage `stage_light_targets` (DLI target + light sensitivity).
- **Decides tracker strategy:** `optimizeTrackers` produces a `TrackerPlan` per zone — `maximize_energy` | `balanced` | `crop_light_priority` | `heat_protection` — with human-readable `reasoning[]`, DLI so far / projected / target, heat risk, and effective crop weight.
- **Executes via gateway (partial):** plans can create tracker `Command`s (`pending_approval` by default, or `queued` if automation is autonomous). Gateway poll/ack exists. Commands are still free-text, not structured angles.
- **Explains itself:** Energy page shows `TrackerStrategyPanel` / `TrackerPlanCard` with strategy, DLI bar, and reasoning.
- **Site tenancy (thin):** operators are scoped to a site via `User.site_id` + `Site.member_emails` + entity RLS. API keys are admin-only. Assistant is locked to the user's site.
- **Irrigation / alerts:** reactive control still lives in `ingestTelemetry` (moisture, rain hold, threshold shade).

### Target product (not all shipped)

- Structured decision objects (`tracker_intent`, target angle / shade fraction, irrigation intent, confidence).
- One-time preference presets (Maximize Crop / Balanced / Maximize Energy) instead of raw weight sliders.
- Planting date → automatic growth stage; CV stage as a sensor input.
- Electricity prices, crop market value, wind stow.
- Full org multi-tenancy, audit log, data retention.
- Outcome logging and (later) cross-farm learning — **future only; do not market as live.**

---

## 4. How it does it

### Operator setup
**Today:** provision site, zones (crop + growth stage + `crop_priority` 0–100), sensors, energy assets, tracker automations; assign operators to a site in Team settings.

**Target:** crop, variety, planting date, location, panel geometry, tracker type, irrigation zones, and **one business preference** — Maximize Crop / Balanced / Maximize Energy. No weight sliders; the platform maps preference to internal weights.

### Knowledge base
**Today:** `CropProfile.stage_light_targets[]` (`stage`, `dli_target`, `light_sensitivity`, `notes`) plus temp/humidity/moisture thresholds and disease rules.

**Target:** fuller agronomic tables (VPD, EC/pH, water demand per stage) and automatic stage from planting date / CV.

### Optimization engine (Optimizer v0 — shipped)

`krelone/base44/functions/optimizeTrackers/entry.ts`, scheduled by `TrackerOptimizer` workflow.

Per active site / zone it:

1. Pulls weather (hourly irradiance + daily max temp, sunrise/sunset).
2. Estimates remaining open-field DLI and under-panel light (`PANEL_TRANSMISSION`).
3. Solar-only or harvest stage → `maximize_energy`.
4. Else: stage DLI target + sensitivity adjust `zone.crop_priority` → effective crop weight.
5. Estimates DLI so far from PAR readings; projects end-of-day DLI.
6. Scores heat risk vs crop `air_temp_max`.
7. Policy: heat_protection | crop_light_priority | maximize_energy | balanced.
8. If strategy changed → create tracker Command; always persist `TrackerPlan` with `reasoning[]`.

### Principles
1. Operators should pick a **preference**, not raw weights (slider is transitional — replace with presets).
2. Trackers execute; Krelone decides.
3. Every decision is explainable (`TrackerPlan.reasoning`).
4. **No hardcoded** `if crop == tomato: angle = 35`. Decisions come from knowledge + live state + priority.
5. Learning is **future** — first ship a correct, explainable engine. Do not market learning as current.

### Known tension
`ingestTelemetry` still issues reactive "tilt for shade" commands on high PAR/temp, independently of `optimizeTrackers`. These two control paths should be unified so one engine owns tracker intent.

---

## 5. How it works in the real world

**Example 1 — Tomato, flowering, mild day.** Stage light sensitivity is high → effective crop weight rises. If projected DLI is below target, strategy = `crop_light_priority` (admit more light).

**Example 2 — Heatwave forecast.** Forecast max vs crop tolerance → `heat_protection`; increase midday shading; reasoning explains yield + water savings.

**Example 3 — After harvest / solar-only zone.** Strategy = `maximize_energy`; track sun normally.

**Example 4 — DLI already met.** Surplus sun → `maximize_energy` even with an active crop.

**Example 5 — Electricity price spike (5–7 PM).** *Target behavior, not shipped yet.* Energy revenue temporarily outweighs shade; system favors tracking during that window.

In the shipped loop: Krelone computes a `TrackerPlan`, creates a command when strategy changes (approve by default), the gateway executes, and Energy UI shows strategy + reasoning.

---

## 6. Multi-tenant model (today)

Tenant unit = **Site** (not Organization yet).

| Piece | Behavior |
|--------|----------|
| `Site.member_emails` | Who can read the site (RLS) |
| `User.site_id` | Operator's assigned site; entity RLS scopes child data |
| Roles | Platform `admin` \| `user` only |
| TeamPanel | Invite + assign one site per operator |
| `Site.api_key` | Admin-only read/write (RLS) |
| Assistant | Refuses questions about other sites |

**Not yet:** org hierarchy, multi-site operators, viewer/operator/approver roles, audit log, hashed/rotating API keys as a product feature, reading retention.

---

## 7. The moat

**Today (build and market now):** an **explainable multi-objective optimization engine** for AgriPV. It balances crop light against energy using an agronomic knowledge base, live site data, weather, and operator crop/energy priority — and explains every decision via `TrackerPlan`. Most systems optimize solar tracking **or** manage crops; a knowledge-driven engine that decides the *compromise*, transparently, is already rare. That is the defensible core we lead with.

**Future (do not market as current):** the same engine becomes **adaptive** — learning strategies per crop, location, season, and AgriPV configuration from logged outcomes. Roadmap only. Say "designed to learn over time," never "it learns," until real data proves it.

---

## 8. Build status (reference)

| Phase | Status | Notes |
|-------|--------|--------|
| **0 — Honesty** | Incomplete | Remove fake Overview energy curve / placeholder revenue; show live truth only |
| **1 — Closed loop + Optimizer v0** | Mostly shipped | `optimizeTrackers` + `TrackerPlan` + Energy UI + approve commands. Still need: structured command payloads, preference presets, unify ingest vs optimizer |
| **2 — SaaS foundations** | Partial | Site RLS + membership done. Still need: orgs, richer roles, audit, retention, API-key productization |
| **3 — Optimizer v1** | Not started | Real cumulative DLI, electricity prices, CV stage input, decision-log polish, wind stow, tests |
| **4 — Learning** | Future | Outcome logging first; learning only after proven data. Do not market |

### Highest-leverage next (for real-site demos)

1. Kill fake metrics (Phase 0).
2. Preference presets → internal weights (replace crop_priority slider as the primary UX).
3. Structured tracker commands (mode / angle / shade fraction) + gateway contract.
4. Single owner of tracker intent (optimizer wins; ingest stops competing shade commands).
5. Then deepen tenancy / audit as you onboard more customer sites.

---

> Positioning: *Motors maximize energy. Krelone maximizes land value — deciding when the crop should win, when energy should win, and when the weather overrides both.*
