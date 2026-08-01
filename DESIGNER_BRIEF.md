# Krelone — Frontend Designer Brief

This brief tells you **what the product is**, **what we need people to accomplish**, and **what content belongs on each screen**.

It does **not** prescribe visual style, layout, chart types, colors, typography, or interaction patterns. Use your judgment. Design the strongest representation of this product you can.

---

## 1. Project objective

Krelone helps operators run **agrivoltaic (AgriPV) farms** — land where solar panels and crops share the same ground.

Panel motors already exist to maximize electricity. Krelone’s job is different:

> **Maximize the total value of the land** — balancing crop yield against energy production, water, heat stress, and disease risk — and decide *why* the panels (and irrigation) should act the way they do.

The product should feel like a **decision and operations platform**, not a generic sensor dashboard. The core story people should feel in the UI:

- What is happening on this site right now?
- Why did Krelone choose crop light vs energy (or shade for heat)?
- What needs my approval or attention next?

---

## 2. What the product is

**Krelone** is a multi-site SaaS for AgriPV operations.

Users:

- **Administrators** — set up sites, invite team members, manage sensors/assets, configure automation, run optimization.
- **Operators** — monitor their assigned site, review recommendations and alerts, approve or reject control commands, manage day-to-day tasks.

Each logged-in operator is scoped to **one site**. Admins can see and switch across sites.

Hardware on site (sensors, cameras, trackers, irrigation) sends data in and receives commands out through a gateway. The UI is where humans understand, trust, and approve those decisions.

---

## 3. Features the UI must make clear

These capabilities should be obvious in the product experience:

1. **Live site truth** — soil, light, weather, crop zone status, PV output, sensor health.
2. **Land-value tradeoff** — crop priority vs energy priority; growth stage; light budget (DLI); heat risk.
3. **Tracker strategy** — Krelone’s current plan per zone (maximize energy / balanced / crop light / heat protection), with plain-language reasons.
4. **Human-approved control** — commands to move trackers or run irrigation can wait for approval before execution.
5. **Automation modes** — observe, recommend, approve-and-execute, or fully autonomous (admin-controlled).
6. **Alerts & tasks** — problems and work that need action.
7. **Recommendations** — suggested actions with confidence and accept / dismiss / execute flows.
8. **Agriculture intelligence** — crop health, scans/camera findings, disease-related risk where available.
9. **Energy performance** — assets (inverters, strings, trackers, meters), output, performance, status.
10. **Analytics history** — trends over time for water, energy, sensors.
11. **AI assistant** — ask questions about *this site’s* live data.
12. **Site & team setup** — provision a site, assign people, configure ingestion/API access (admin).

Do not invent “AI learning” or “self-improving” marketing in the UI. The product **explains decisions**; it does not claim to learn across farms yet.

---

## 4. Global shell (all authenticated pages)

Every authenticated screen sits inside an app shell that needs:

- **Brand:** Krelone
- **Site context:** which site the user is looking at (switcher for admins; fixed for operators)
- **Primary navigation** to the pages listed below
- **User identity / role** awareness (admin vs operator — some actions admin-only)
- **Empty / no-site state** when a user has no site assigned yet
- Access to **theme preference** if you choose to support light/dark (optional; your call)

Auth screens (separate from the shell):

- Login
- Register
- Forgot password
- Reset password

---

## 5. Pages and required content

For each page: **what content must be present**. How you structure, prioritize, and present it is up to you.

### Overview
The command center for the active site.

Content to include:

- Site identity (name / context)
- Snapshot of PV output vs capacity
- Snapshot of crop / zone health
- Snapshot of soil moisture (or equivalent field water status)
- How many automations are running in autonomous (or active) mode
- Current weather relevant to operations
- Active alerts (at least the important ones), with severity
- Pending recommendations
- A sense of recent or today energy performance (must be based on real site data when available — do not design around fake decorative data)
- Clear paths into deeper modules (alerts, recommendations, automation, energy, live farm)

### Live Farm
Operational view of zones and sensors in the field.

Content to include:

- List or map-like overview of zones on the site
- Per zone: crop, growth stage, status, key live readings (e.g. soil moisture, soil temp, PAR/light, tracker angle if present)
- Sensors belonging to zones (or site-level): name, metric, value, unit, online/offline/degraded status, last reading
- Ability for admins to add/configure sensors
- Sensor history for a selected sensor (time series of readings)
- Zone health / attention / critical state where available

### Energy
Solar side of the land-value story — performance **and** tracker strategy.

Content to include:

- Live output, capacity utilization, performance summary, revenue or energy value if available
- **Tracker strategy / plans (product-critical):**
  - Latest plan per zone
  - Strategy name (maximize energy, balanced, crop light priority, heat protection)
  - The action Krelone wants the trackers to take
  - Reasoning / factors behind the decision (readable list)
  - DLI so far, projected, and target (where available)
  - Heat risk and forecast temperature (where available)
  - Crop vs energy weight used for that decision
  - Whether a command was created from the plan
  - Admin ability to trigger “optimize now”
  - Admin ability to adjust crop/energy priority for a zone (or future preference presets)
- Energy assets: inverters, strings, trackers, meters — name, type, capacity, current output, performance ratio, health, status, soiling if available

### Agriculture
Crop-focused operations.

Content to include:

- Zones with crop, growth stage, status, soil and light readings
- Crop scan / camera findings when available (what was detected, confidence, zone, time)
- Crop profile context where useful (targets, disease-related guidance)
- Links or cues into recommendations and alerts that are crop-related

### Recommendations
Actions Krelone (or rules) suggest operators take.

Content to include:

- Pending recommendations: title, description, confidence, related zone/category if any
- Ability to accept, dismiss, or execute (where execute creates a real command)
- History or past recommendations if available
- Empty state when nothing is pending

### Automation
Control plane for how the site acts.

Content to include:

- Automation rules: name, target (irrigation, valve, pump, tracker, vent, fan, etc.), zone, trigger description, action, enabled/disabled
- Mode per automation: observe / recommend / approve / autonomous
- Admin controls to change mode and enable/disable
- **Command queue:** pending approval, queued, sent, completed, failed, rejected
- For each command: target, zone, action text, status, who issued it, result message, water delivered if irrigation
- Approve / reject for commands waiting on humans

### Alerts
Problems that need attention.

Content to include:

- Active alerts with severity, category, title, description, zone, time
- Ability to acknowledge / resolve (as product supports)
- Filter or group by severity / status if helpful
- Empty state when the site is clean

### Tasks
Human work items for the site team.

Content to include:

- Tasks with title, status, priority, assignee if any, due date if any, related zone/alert
- Create / update / complete flows as product supports
- Clear separation of open vs done

### Analytics
Historical understanding, not just live snapshot.

Content to include:

- Trends over selectable time ranges for key metrics (sensor readings, water, energy)
- Ability to compare or inspect zones / metrics the product exposes
- Honest empty/loading states when history is thin

### Assistant
Conversational help grounded in **this site only**.

Content to include:

- Chat thread (user messages + assistant replies)
- Suggested starter questions
- Clear that answers are about the active site’s live data
- Input to ask a new question

### Settings
Site configuration and admin tools.

Content to include (as role allows):

- Site details (name, location, capacity, status, coordinates if used)
- Team: invite users, assign role (admin/user), assign site membership
- Ingestion / gateway: how devices authenticate (API key for admins), how telemetry and commands work at a high level
- Alert notification preferences if persisted by product
- Entry point to site provisioning for admins

### Site provisioning (admin)
Wizard or flow to create a new site.

Content to include across steps:

- Site identity and location
- Zones (crop, type, growth stage, targets as needed)
- Energy assets
- Confirmation / success and path into the live site

---

## 6. Content principles (not visual rules)

These are product constraints, not design prescriptions:

- **Truth over decoration.** Prefer empty, loading, or “no data yet” over inventing numbers.
- **Explain decisions.** Whenever Krelone chooses a tracker strategy, the *why* must be as findable as the *what*.
- **Approval is first-class.** Pending commands and recommendations should not feel buried.
- **Site boundary.** Operators should never feel they are looking at another farm’s data.
- **Crop and energy are co-equal.** The UI should not look like a pure solar product or a pure farm IoT product — both sides of the land matter.

---

## 7. Out of scope for this brief

- Color palette, fonts, chart libraries, icon sets
- Exact layout grids, card vs table decisions, motion specs
- Marketing website / landing page (unless separately requested)
- Claiming “AI that learns across farms” in copy or UI

---

## 8. Success for your work

A strong design for Krelone lets a farm operator (or investor in a demo) answer in under a minute:

1. Is this site healthy right now?
2. Is Krelone prioritizing crop or energy today — and why?
3. What do I need to approve or fix next?

If those three answers are clear, the design is doing its job.
