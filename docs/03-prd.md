# fordgeBurg Product Requirements Document (PRD)

**Document status:** Source-grounded. Based on implementation in `/home/dev/Desktop/projects/fordge-burg` and verification artifacts in `/home/dev/Desktop/projects/fordge-burg/tests`.

---

## 1. Product Identity & Scope

| Field | Value |
|---|---|
| Product name | fordgeBurg |
| Product type | Static client-rendered prototype for Antarctic maritime decision support |
| Positioning | Human-in-the-loop operational decision support. **Not** autonomous navigation. The Master and certified Ice Pilot retain sole command authority under SOLAS Ch. V and the IMO Polar Code. |
| Runtime | Next.js 16.3.4 (React 19.2.8), Tailwind CSS v4, TypeScript 5 |
| Codebase | Single Next.js application at `/home/dev/Desktop/projects/fordge-burg` |

### 1.1 Scope boundaries

**In scope:**
- Sea-ice forecast visualization and multi-day horizon modeling
- Iceberg trajectory tracking with uncertainty corridors
- Fused spatial hazard grid with severity ratings
- Vessel capability profiling with IMO POLARIS Risk Index Outcome (RIO) evaluation
- Multi-objective route optimization with exactly 4 simultaneous alternatives
- Operational consequence analysis and tactical mitigation recommendations
- Exportable mission decision-support report with print layout

**Out of scope:**
- Real-time satellite data ingestion (deterministic mock data only)
- Live AIS vessel tracking
- GPS/autonomous navigation actuation
- Backend persistence (all state is client-side React context)

---

## 2. Goals & Non-Goals

### 2.1 Goals
1. Provide a deterministic, reproducible polar passage planning workflow across a fixed 11-route UI
2. Present four simultaneous route alternatives with 8 standardized operational metrics per route
3. Enforce strict risk/distance invariants across route alternatives
4. Enforce scientific positioning language: zero autonomous navigation claims, zero fake structural damage percentages
5. Render a self-contained SVG vector Antarctic map with layer toggles and iceberg interaction
6. Affirm human command authority (Master / Ice Pilot) on every operational page

### 2.2 Non-goals
- Connecting to live data feeds
- Implementing backend authentication or multi-user collaboration
- Treating the current AppShell as runnable: its mobile-drawer code also depends on the missing `Sidebar` module
- Replacing the existing mock dataset with real-time environmental data

---

## 3. Personas (Grounded in UI)

### 3.1 The Ice Operations Master
- **Role:** Vessel Master operating in Antarctic waters
- **Workflow in app:** Opens Mission Control dashboard to see KPI telemetry; navigates to Mission Planner to configure vessel and horizon; uses Route Optimizer to compare 4 alternatives; opens Risk page for mitigations; generates a printable Mission Report for the Ice Pilot
- **Key UI touchpoints:** `app/dashboard/page.tsx` (KPI widgets), `app/mission/page.tsx` (configuration inputs), `app/routes/page.tsx` (comparison), `app/risk/page.tsx` (mitigations), `app/reports/page.tsx` (printable document)

### 3.2 The Certified Ice Pilot
- **Role:** Ice navigation specialist providing tactical advisories
- **Workflow:** Inspects hull/ice-class capability matrix on Vessel page; reviews consequence analysis with POLARIS RIO formula; validates mitigation checklists; signs off on the printed report
- **Key UI touchpoints:** `app/vessel/page.tsx` (capability matrix), `app/risk/page.tsx` (consequence grid), `app/reports/page.tsx` (signature blocks)

### 3.3 The Fleet Operations Desk
- **Role:** Shore-based logistics coordinator
- **Workflow:** Reviews the exported mission report; checks fuel burn and reserve margins; validates stand-off distances for icebergs
- **Key UI touchpoints:** `app/reports/page.tsx` (operational summary), `app/settings/page.tsx` (risk tolerance)

---

## 4. Route Inventory

The application exposes **11 routes**, verified by `tests/tier1_feature_coverage.test.mjs` Feature 1.1–1.11 and `tests/helpers/audit_engine.mjs:REQUIRED_ROUTES`.

| # | Route | File | Name | Primary Function |
|---|-------|------|------|-----------------|
| 1 | `/` | `app/page.tsx` | Product Landing | Perplexity-style query terminal; keyword-routing to workspaces |
| 2 | `/dashboard` | `app/dashboard/page.tsx` | Mission Control | Live operational picture with 4 KPI widgets + map |
| 3 | `/mission` | `app/mission/page.tsx` | Mission Planner | Voyage configuration inputs + simulation trigger |
| 4 | `/environment` | `app/environment/page.tsx` | Environment Intelligence | Sea-ice concentration, drift, metocean telemetry |
| 5 | `/icebergs` | `app/icebergs/page.tsx` | Iceberg Intelligence | 8 tracked iceberg targets; CPA analysis; trajectory HUD |
| 6 | `/hazards` | `app/hazards/page.tsx` | Hazard Intelligence | Fused hazard zone matrix with factor decomposition |
| 7 | `/vessel` | `app/vessel/page.tsx` | Vessel Intelligence | 5 polar vessel profiles; POLARIS RIO engine; capability matrix |
| 8 | `/routes` | `app/routes/page.tsx` | Route Optimizer | 4 simultaneous alternatives; comparison table; decision explanation |
| 9 | `/risk` | `app/risk/page.tsx` | Risk & Mitigation | Consequence analysis; mitigation checklist; tactical protocols |
| 10 | `/reports` | `app/reports/page.tsx` | Mission Report | Printable decision-support document with export/print |
| 11 | `/settings` | `app/settings/page.tsx` | Settings | Unit system, coordinate format, risk tolerance, map layers |

Every route, including `/`, is implemented with `<AppShell>` in its page component. The shell cannot currently render because its required `Sidebar` module is missing.

---

## 5. User Workflows

### 5.1 Primary workflow: Polar passage planning
1. **Land** — User enters the Product Landing (`/`) and submits a natural-language query (e.g., "ice conditions") or clicks a Quick Jump action. The keyword router (`app/page.tsx:37-46`) maps the query to `/dashboard`, `/icebergs`, `/risk`, or `/routes`.
2. **Configure mission** — User navigates to Mission Planner (`/mission`). Inputs (Section 1, `app/mission/page.tsx:103-300`): Mission scenario selection, vessel profile (5 archetypes), departure datetime, forecast horizon (1/3/7 days), optimization objective (balanced/safety/fuel/time). The audit engine enforces that inputs precede the trigger (`tests/helpers/audit_engine.mjs:624-647`).
3. **Execute simulation** — User clicks "Generate Mission Analysis" (`app/mission/page.tsx:316-337`). The `runMissionSimulation` function in `MissionSessionProvider.tsx:346-382` transitions status `idle → running → completed` over ~1.2s with progress markers at 40%, 80%, 100%. The final result snapshot is computed via `generateMissionSimulation()` (`src/simulations/engine.ts:24-151`).
4. **Compare routes** — User navigates to Route Optimizer (`/routes`). Four route cards render side-by-side (`app/routes/page.tsx:143-152`), each exposing 8 metrics. A `DecisionExplanationCard` renders plain-English rationale. A `RouteComparisonTable` provides structured comparison.
5. **Review risk** — User navigates to Risk (`/risk`). The `ConsequenceAnalysisGrid`, `MitigationChecklist`, and `TacticalProtocolsGrid` components render consequence modeling and 7 mandatory/recommended/advisory mitigations.
6. **Export report** — User navigates to Reports (`/reports`) and clicks "Export / Print Report" (`app/reports/page.tsx:59-67`), which triggers `window.print()`. The document includes signature blocks for Master, Ice Pilot, and Fleet Operations.

### 5.2 Secondary workflow: Environment inspection
1. User opens Environment Intelligence (`/environment` or clicks a route result link from Landing).
2. The timeline horizon selector (`app/environment/page.tsx:82-102`) sets the forecast horizon; the `AntarcticMap` re-renders with the ice layer active.
3. A 6-metric telemetry grid (concentration, thickness, drift, SST, wind, waves) updates.
4. A 7-day horizon progression table (`progressionData`) shows evolution across 1D/3D/7D.

### 5.3 Secondary workflow: Iceberg tracking
1. User opens Iceberg Intelligence (`/icebergs`).
2. The map renders iceberg markers with the icebergs layer active.
3. Clicking a marker or table row (`app/icebergs/page.tsx:237-280`) selects an iceberg and opens a detail HUD with DMS coordinates, dimensions, drift vector, uncertainty corridor, and CPA.
4. A collision-avoidance recommendation recommends 5.0 NM standoff.

---

## 6. Functional Requirements

### 6.1 Landing page (R-LAND-01 through R-LAND-04)
- **R-LAND-01:** The landing page must display the wordmark "fordgeBurg" and subtitle "Ask your polar operations workspace anything." (`app/page.tsx:80, 83`)
- **R-LAND-02:** The landing page must provide Quick Jump navigation links to `/dashboard`, `/mission`, `/routes`, and `/risk`. (`app/page.tsx:21-26`)
- **R-LAND-03:** The landing page must implement a keyword-based query router that maps semantic queries to destination workspaces. (`app/page.tsx:37-46`)
- **R-LAND-04:** The landing page must wrap content in `<AppShell>` and constrain width to 640px centered. (`app/page.tsx:69, 70`)

### 6.2 Mission Control dashboard (R-DASH-01 through R-DASH-04)
- **R-DASH-01:** The dashboard must render the `AntarcticMap` component with active map layers. (`app/dashboard/page.tsx:222-238`)
- **R-DASH-02:** The dashboard must display 4 KPI widgets: Average Risk Score, Transit Distance (NM), Estimated Duration/ETA (hrs), Bunker Fuel Estimate (MT). (`app/dashboard/page.tsx:101-203`)
- **R-DASH-03:** The dashboard must display an active vessel profile card with Polar Class, LOA/Beam/Draft, ice speed limit, and POLARIS RIO score. (`app/dashboard/page.tsx:258-312`)
- **R-DASH-04:** The dashboard must affirm human command authority with a SOLAS/Polar Code disclaimer. (`app/dashboard/page.tsx:404-415`)

### 6.3 Mission Planner (R-MISS-01 through R-MISS-05)
- **R-MISS-01:** The Mission Planner must provide configuration inputs for mission scenario, vessel profile, departure date, forecast horizon, and optimization objective. (`app/mission/page.tsx:106-298`)
- **R-MISS-02:** The Mission Planner must provide a "Generate Mission Analysis" trigger button that calls `runMissionSimulation()`. (`app/mission/page.tsx:316-336`)
- **R-MISS-03:** When simulation is running, the trigger button must display progress percentage and a rotating `RotateCw` icon. (`app/mission/page.tsx:326-360`)
- **R-MISS-04:** When simulation completes, the planner must display a confirmation banner and render 4 route alternative preview cards with distance, duration, risk, fuel, ice hours, and iceberg counts. (`app/mission/page.tsx:362-525`)
- **R-MISS-05:** The Mission Planner must enforce input/output ordering: configuration controls precede the simulation trigger, which precedes computed outputs. (Enforceable via `auditInputOutputSeparation`, `tests/helpers/audit_engine.mjs:624-647`)

### 6.4 Route Optimizer (R-ROUTE-01 through R-ROUTE-06)
- **R-ROUTE-01:** The Route Optimizer must render exactly 4 simultaneous route alternatives. (`app/routes/page.tsx:143-152`, `tests/tier1_feature_coverage.test.mjs:406-412`)
- **R-ROUTE-02:** Each route card must expose all 8 operational metrics: `distanceNm`, `etaHours`, `fuelTons`, `averageRiskScore`, `maxRiskScore`, `iceExposureHours`, `icebergExposureCount`, `vesselCompatibility`. (`tests/tier1_feature_coverage.test.mjs:414-426`)
- **R-ROUTE-03:** The four route alternatives must cover the canonical types: `shortest`, `safest`, `fuel_efficient`, `balanced`. (`tests/helpers/audit_engine.mjs:178-183`)
- **R-ROUTE-04:** Baseline dataset ordering: Shortest distance < Balanced distance < Safest distance. Baseline values: 412 < 445 < 528 NM. (`tests/tier1_feature_coverage.test.mjs:428-442`, `src/data/routes.ts:14,99,43`)
- **R-ROUTE-05:** Baseline dataset ordering: Safest risk (22) < Balanced risk (31) < Shortest risk (74). (`tests/tier1_feature_coverage.test.mjs:444-462`, `src/data/routes.ts:17,101,46`)
- **R-ROUTE-06:** The page must render a plain-English `DecisionExplanationCard` and a `RouteComparisonTable`. (`app/routes/page.tsx:119-124, 219-224`)

### 6.5 Antarctic Map (R-MAP-01 through R-MAP-05)
- **R-MAP-01:** The map must be a self-contained SVG component at `components/map/AntarcticMap.tsx`. (`tests/tier1_feature_coverage.test.mjs:338-347`)
- **R-MAP-02:** The map must support 4 layer toggles: ice, icebergs, hazards, routes. (`tests/tier1_feature_coverage.test.mjs:349-358`)
- **R-MAP-03:** The map must support interactive click inspection on iceberg markers (via `onSelectIceberg` or `activeIceberg` props). (`tests/tier1_feature_coverage.test.mjs:360-369`)
- **R-MAP-04:** The map must be integrated across Dashboard, Environment, Icebergs, Hazards, and Routes pages. (`tests/tier1_feature_coverage.test.mjs:371-389`)
- **R-MAP-05:** The map must include a timeline forecast horizon selector (1d/3d/7d). (`tests/tier1_feature_coverage.test.mjs:391-400`)

### 6.6 Settings (R-SET-01 through R-SET-03)
- **R-SET-01:** The Settings page must provide unit system selection between "nautical" (NM/kn/MT) and "metric" (km/km/h/t). (`app/settings/page.tsx:106-202`)
- **R-SET-02:** The Settings page must provide coordinate format selection between DMS and decimal degrees. (`app/settings/page.tsx:205-280`)
- **R-SET-03:** The Settings page must provide risk tolerance levels: Conservative (30/100), Standard (50/100), Aggressive (70/100); map layer visibility toggles; and hydrographic soundings depth slider. (`app/settings/page.tsx:282-436`)

### 6.7 Reports (R-PRINT-01 through R-PRINT-02)
- **R-PRINT-01:** The Reports page must render an exportable maritime decision support document with a "Export / Print Report" button. (`app/reports/page.tsx:43-67`)
- **R-PRINT-02:** The report document must include a Waypoint Schedule Table, Vessel Profile, Route Decision Rationale, Consequence Analysis, Mitigation List, and signature blocks for Master, Ice Pilot, and Fleet Operations. (`app/reports/page.tsx:110-335`)

---

## 7. Simulation Behavior (Deterministic)

### 7.1 Pipeline architecture
The master simulation engine (`src/simulations/engine.ts:24-151`, `generateMissionSimulation`) executes eight labeled sequential blocks:

1. **Predict Environment** — `generateSeaIceForecast(horizon)` → sea-ice concentration, thickness, drift, metocean (`src/simulations/environment.ts:8-244`)
2. **Predict Iceberg Hazards & Drift** — `generateIcebergTrajectories(horizon)` → iceberg positions, trajectories, CPA (`src/simulations/icebergs.ts:9-68`)
3. **Fuse Multi-Source Hazard Map** — `generateHazardMap(horizon)` → 6 hazard zones with risk scores and severity (`src/simulations/hazards.ts:17-67`)
4. **Understand Vessel (IMO POLARIS)** — `calculateVesselCompatibility(vessel, hazardMap)` → RIO score, operational status, speed limit, compliance notes (`src/simulations/hazards.ts:69-186`)
5. **Optimize Routes** — `generateRoutes(mission, vessel, preference, horizon)` → 4 alternatives with 8 metrics each (`src/simulations/routes.ts:76-299`)
6. **Minimize Operational Risk** — `generateMitigationRecommendation(hazardMap, vessel, route)` → 7 tactical mitigations (`src/simulations/mitigation.ts:13-126`)
7. **Synthesize Consequence Analysis** — ice-class-keyed operational consequence values (`src/simulations/engine.ts:61-120`)
8. **POLARIS Executive Summary** — route-aware authorization summary (`src/simulations/engine.ts:122-134`)

### 7.2 Forecast horizons
The simulation supports three deterministic horizons. All simulation functions validate the horizon parameter:

| Horizon | Hours | Sea-ice concentration (tenths) | Uncertainty multiplier |
|---------|-------|-------------------------------|----------------------|
| 1 day   | 24    | 4.2 mean                      | 1.0× |
| 3 days  | 72    | 6.4 mean                      | 2.2× |
| 7 days  | 168   | 7.9 mean                      | 4.8× |

(`src/simulations/environment.ts:8-244`, `src/simulations/icebergs.ts:11-20`, `src/simulations/hazards.ts:21-25`)

### 7.3 Data inputs

**Vessels (5 archetypes):** `src/data/vessels.ts`. Default: `vessel-attenborough-pc4` (PC4, 128m, 24m beam, 7.8m draft, 13 kn open water, 6.5 kn ice limit, 28 MT/day). (`MissionSessionProvider.tsx:96`)

| Vessel ID | Name | Ice Class | Polar Cat. | Speed (open/ice) | Fuel |
|-----------|------|-----------|------------|-------------------|------|
| vessel-charcot-pc2 | Le Commandant Charcot | PC2 | A | 15.0/9.0 kn | 35 MT/day |
| vessel-polarstern2-pc2 | Polarstern II | PC2 | A | 14.5/8.5 kn | 38 MT/day |
| vessel-attenborough-pc4 | RRS Sir David Attenborough | PC4 | A | 13.0/6.5 kn | 28 MT/day |
| vessel-agulhas2-pc5 | SA Agulhas II | PC5 | B | 14.0/5.0 kn | 24 MT/day |
| vessel-navigator-openwater | MV Antarctic Navigator | OpenWater | C | 12.5/2.0 kn | 16 MT/day |

**Missions (3 scenarios):** `src/data/missions.ts`. Default: `mission-weddell-transect` (Maxwell Bay → Weddell Outpost Alpha, 445 NM). (`MissionSessionProvider.tsx:92`)

**Hazards (6 zones):** `src/data/hazards.ts`. Includes Antarctic Sound Pressure Ridge (risk 78), Joinville Bank Grounding Shallows (58), Weddell Multi-Year Ice (82), Larsen Fast Ice (95/restricted), Erebus Drift Field (52), Bransfield Fairway (20).

**Icebergs (8 targets):** `src/data/icebergs.ts`. Includes A-68A Giant Fragment (18.5km × 8.2km tabular), A-74 Tabular Berg, B-30 Wedge, C-28 Pinnacled, D-15 Tabular, E-09 Dome, GW-07 Growler field, GW-08 Bergy Bit.

### 7.4 Route generation invariants
`src/simulations/routes.ts:124-298` enforces these invariants after computing dynamic metrics:

| Invariant | Rule | Enforcement location |
|-----------|------|---------------------|
| Safest lowest risk | `safest.averageRiskScore < shortest.averageRiskScore` | `routes.ts:203-222` |
| Shortest lowest distance | All non-shortest routes have `distanceNm > shortest.distanceNm` | `routes.ts:225-232` |
| Fuel-efficient lowest fuel | All non-fuel routes have `fuelTons > fuel_efficient.fuelTons` | `routes.ts:235-242` |

### 7.5 POLARIS RIO calculation
`src/simulations/hazards.ts:69-186`. RIO = Σ(ice_concentration_tenths × RV_ice) + Σ(open_water_tenths × RV_open), aggregated across hazard zones with importance weighting. RIO thresholds from `src/lib/constants.ts:51-55`:

| Status | RIO ≥ | Action |
|--------|-------|--------|
| Normal Operation | 0 | Authorized; speed limit = vessel ice speed limit |
| Elevated Risk | -10 | Mandatory speed throttling (×0.75); daylight transit advised |
| Restricted Operation | < -10 | Icebreaker escort required; speed ≤ 2.5 kn or vessel limit |

### 7.6 Simulation state lifecycle
`MissionSessionProvider.tsx:346-382` executes a deterministic ~1.2s progress simulation:

| Time | Progress | Status |
|------|----------|--------|
| 0ms | 0% | running |
| 300ms | 40% | running (Phase 1 complete) |
| 700ms | 80% | running (Phase 2 complete) |
| 1200ms | 100% | completed (Phase 3 complete; snapshot stored) |

The reactive context (`MissionSessionProvider.tsx:139-265`) pre-computes all derived values (seaIceForecast, icebergs, hazardMap, vesselCompatibility, routes, mitigations, consequenceAnalysis, polarisSummary) via `useMemo` on every dependency change — these are always available even before triggering the simulation animation.

---

## 8. State & Settings Schema

### 8.1 Global mission state (`src/types/state.ts:44-57`)
```
interface MissionState:
  mission: Mission
  vessel: Vessel
  availableVessels: Vessel[]
  availableMissions: Mission[]
  forecastHorizon: 1 | 3 | 7
  optimizationPreference: 'balanced' | 'safety' | 'fuel' | 'time'
  selectedRouteId: 'shortest' | 'safest' | 'fuel_efficient' | 'balanced'
  simulationStatus: 'idle' | 'running' | 'completed'
  mapLayers: { ice: bool; icebergs: bool; hazards: bool; routes: bool }
  activeIceberg: Iceberg | null
  settings: UserSettings
  simulationResult: MissionSimulationResult | null
```

### 8.2 User settings (`src/types/state.ts:37-42`)
```
interface UserSettings:
  unitSystem: 'nautical' | 'metric'
  riskTolerance: 'conservative' | 'standard' | 'aggressive'
  mapAutoCenter: boolean
  soundingsDepthMeters: number  (range: 20–100, step: 5, default: 50)
```

### 8.3 Context API (`components/session/MissionSessionProvider.tsx:85-448`)
The `MissionSessionProvider` exposes state, derived values, and mutators through `MissionContext`. The observed mutators include `setVessel`, `setSelectedVesselId`, `setMission`, `setSelectedMissionId`, `setForecastHorizon`, `setOptimizationPreference`, `setSelectedRoute`, `setSelectedRouteId`, `toggleMapLayer`, `setActiveIceberg`, `setSelectedIcebergId`, `updateSettings`, and `runMissionSimulation`. Derived values include mission/vessel resolution, sea-ice forecast, iceberg trajectories, hazard map, vessel compatibility, routes, selected route, mitigations, consequence analysis, and POLARIS summary. Aliased exports: `MissionProvider`, `useSimulationSession`.

---

## 9. Map & Report Behavior

### 9.1 AntarcticMap component
- **Location:** `components/map/AntarcticMap.tsx`
- **Type:** Self-contained React component rendering an SVG with `viewBox=1000×650`
- **Projection:** Equirectangular linear mapping covering -62.0°S to -66.5°S, -54.0°W to -64.0°W (`src/lib/constants.ts:8-15`, `src/lib/utils.ts:211-230`)
- **Coordinate transform:** `coordToSvg(lat, lon)` maps geographic coordinates to SVG pixel space (`utils.ts:211-230`)
- **Layers:** ice, icebergs, hazards, routes — toggled via `activeLayers` prop
- **Interactivity:** `onSelectRoute`, `onSelectIceberg`, `onChangeHorizon`, `onToggleLayer` callbacks
- **Integration:** Consumed by Dashboard, Environment, Icebergs, Hazards, and Routes pages (`tests/tier1_feature_coverage.test.mjs:371-389`)

### 9.2 Report component
- **Location:** `app/reports/page.tsx`
- **Export:** `window.print()` via "Export / Print Report" button (`app/reports/page.tsx:33-37, 59-67`)
- **Print styling:** `@media print` utilities (`max-w-full`, `hidden` action bar)
- **Structure:** Document Header → Vessel Profile → Route Decision Rationale → Waypoint Schedule → Consequence Analysis → Mitigation List → Signature blocks (Master, Ice Pilot, Fleet Ops)

---

## 10. Non-Functional Requirements

| Requirement | Detail | Source |
|---|---|---|
| NFR-1 Maritime units | UI surfaces operational units including NM, kn, MT, tenths, meters, and °C | `tests/helpers/audit_engine.mjs:88-95` |
| NFR-2 Scientific positioning | No autonomous-navigation claims or fake structural-damage percentages; operational consequence language and human-authority disclaimers are required by the existing test contract | `tests/helpers/audit_engine.mjs:97-128` |
| NFR-3 Deterministic | Simulation outputs are deterministic functions of mission, vessel, preference, and horizon | `src/simulations/*.ts` |
| NFR-4 Responsive shell | Desktop sidebar slot and mobile drawer behavior are implemented around the missing `Sidebar` dependency | `components/layout/AppShell.tsx:38-61` |

Visual styling rules are intentionally omitted: this documentation covers functionality, not the excluded design specification.

---

## 11. Absent Capabilities

The following capabilities present in the broader vision are **not implemented**:

- **Sidebar navigation component:** `AppShell.tsx:12` imports `Sidebar` from `./Sidebar`, but no such file exists. See Defect D-1.
- **Backend persistence:** All state lives in client-side React context (`MissionSessionProvider`). No API layer, no database.
- **Live data ingestion:** All simulation inputs (`src/data/*.ts`) are static mock datasets. The engine is deterministic but operates on fixed fixtures.
- **Real-time position tracking:** No GPS/AIS integration; vessel position on the map is rendered from static baseline data.
- **Multi-user sessions:** No authentication or user management layer.

---

## 12. Known Defects & Blockers

### D-1: Missing Sidebar component (BLOCKER)
- **Location:** `components/layout/AppShell.tsx:12`
- **Symptom:** `AppShell` imports `Sidebar` from `./Sidebar` and renders it at lines 38 and 58. The directory `components/layout/` contains only `AppShell.tsx` and `PlaceholderPage.tsx`. `components/navigation/` exists but is empty. No `Sidebar.tsx` or `SidebarNav.tsx` implementation exists.
- **Impact:** The entire application fails to compile. Every page that uses `<AppShell>` breaks. This is the primary blocker.
- **Required by tests:** `tests/tier1_feature_coverage.test.mjs:166-237` (Features 2.1–2.6) and `tests/helpers/audit_engine.mjs:496-552` (`auditSidebarNavigation`) expect a sidebar navigation component with all 6 groups: MISSION, INTELLIGENCE, VESSEL, NAVIGATION, REPORTING, SYSTEM — linking to all 10 interior routes.
- **Required sidebar navigation groups** (`audit_engine.mjs:42-83`):
  - `MISSION`: `/dashboard`, `/mission`
  - `INTELLIGENCE`: `/environment`, `/icebergs`, `/hazards`
  - `VESSEL`: `/vessel`
  - `NAVIGATION`: `/routes`, `/risk`
  - `REPORTING`: `/reports`
  - `SYSTEM`: `/settings`

### D-2: globals.css does not declare the 9 canonical design tokens (DEFECT)
- **Location:** `app/globals.css` vs `tests/helpers/audit_engine.mjs:8-18`
- **Symptom:** `globals.css` defines an unrelated token set in its `@theme` block (`--color-paper-white`, `--color-cloud-gray`, `--color-ink-black`, `--color-link-blue`, etc.). None of the 9 canonical tokens expected by the audit engine (`--color-primary-navy`, `--color-accent-blue`, `--color-canvas`, `--color-surface`, `--color-text-muted`, `--color-border`, `--color-risk-high`, `--color-risk-med`, `--color-risk-low`) are declared.
- **Impact:** Components reference canonical token-derived classes while `globals.css` declares a different token vocabulary. The existing audit reports this as a token mismatch; Test Feature 6.1 fails.
- **Note:** `src/lib/constants.ts:22-33` defines `DESIGN_TOKENS` that reference the canonical CSS variable names (`var(--color-primary-navy)`, etc.), confirming intent but the declaration is missing from `globals.css`.

### D-3: Homepage uses hardcoded hex colors and arbitrary shadows (DEFECT)
- **Location:** `app/page.tsx`
- **Symptom:** Lines 90, 185, 204 use `shadow-[rgba(0,0,0,0.08)_0px_1px_2px_0px]` (arbitrary shadow — violates NFR-3). Lines 221-223 use `bg-[#f0eeea]` (hardcoded hex — violates NFR-2). Line 210 references `bg-deep-teal` (undefined class). Line 178 references `var(--color-stone)` (undefined CSS variable).
- **Impact:** Tests Feature 6.2 (heavy shadows), 6.5 (gradients/arbitrary), and hardcoded-colors audit will flag violations.

### D-4: Typography — JetBrains Mono not loaded (DEFECT)
- **Location:** `app/layout.tsx:2-3`
- **Symptom:** `layout.tsx` imports only `Inter` from `next/font/google`. The canonical token `--font-mono` / JetBrains Mono is not imported.
- **Impact:** Test Feature 6.6 (`tier1_feature_coverage.test.mjs:562-564`) will fail: the regex `/JetBrains|Mono/i` does not match and `/--font-mono/i` does not match.
- **Expected fix:** Add `import { JetBrains_Mono } from "next/font/google"` and apply `variable: "--font-mono"`.

### D-5: Home page uses undefined tailwind class names (DEFECT)
- **Location:** `app/page.tsx`
- **Symptom:** Classes like `text-charcoal`, `bg-aged-paper`, `bg-subtle-fill`, `text-stone`, `bg-deep-teal` reference CSS variables/tokens not declared in `globals.css`.
- **Impact:** Styling is broken on the landing page independent of the canonical token issue.

### D-6: Tailwind `@theme` uses non-standard token names (DEFECT)
- **Location:** `app/globals.css:3-70`
- **Symptom:** The theme defines tokens like `--color-ink-black`, `--surface-page-canvas` that are not used by components, while components use `--color-primary-navy`, `--color-accent-blue`, `--surface`, `--color-canvas` which are not defined. Token naming is inconsistent.
- **Impact:** No visual styling is applied; audit tests fail.

---

## 13. Acceptance Criteria (Verifiable)

The following criteria are verifiable from `tests/tier1_feature_coverage.test.mjs` and `tests/helpers/audit_engine.mjs`.

### 13.1 Route inventory (Features 1.1–1.11)
| Test | Criterion |
|------|-----------|
| 1.1 | `app/page.tsx` exists and references fordgeBurg/Antarctic Decision Support; provides CTA link to `/dashboard` or `/mission` |
| 1.2 | `app/dashboard/page.tsx` exists; integrates `AntarcticMap`; displays Risk/ETA/Vessel/Route KPIs |
| 1.3 | `app/mission/page.tsx` exists; includes vessel selection; includes horizon (1/3/7); has Generate/Analysis/Simulate trigger |
| 1.4 | `app/environment/page.tsx` exists; presents sea-ice concentration; presents drift/thickness/weather/metocean |
| 1.5 | `app/icebergs/page.tsx` exists; tracks iceberg drift/trajectory/uncertainty |
| 1.6 | `app/hazards/page.tsx` exists; displays hazard risk/severity matrix |
| 1.7 | `app/vessel/page.tsx` exists; presents PC1/PC5/Polar Class specs and capability curves |
| 1.8 | `app/routes/page.tsx` exists; includes Shortest, Safest, Fuel, Balanced alternatives |
| 1.9 | `app/risk/page.tsx` exists; presents mitigation/consequence/besetting analysis |
| 1.10 | `app/reports/page.tsx` exists; presents Report/Summary/Export/Print document |
| 1.11 | `app/settings/page.tsx` exists; provides unit configuration (Nautical/Metric) |

### 13.2 Navigation hierarchy (Features 2.1–2.6)
| Test | Criterion |
|------|-----------|
| 2.1 | Sidebar exists with MISSION group linking to `/dashboard` and `/mission` |
| 2.2 | Sidebar has INTELLIGENCE group linking to `/environment`, `/icebergs`, `/hazards` |
| 2.3 | Sidebar has VESSEL group linking to `/vessel` |
| 2.4 | Sidebar has NAVIGATION group linking to `/routes`, `/risk` |
| 2.5 | Sidebar has REPORTING group linking to `/reports`; SYSTEM group linking to `/settings` |
| 2.6 | Sidebar uses `usePathname` for active route detection; applies `bg-accent-blue`/`text-accent-blue`/`primary-navy` to active route |

### 13.3 Simulation engine (Features 3.1–3.5)
| Test | Criterion |
|------|-----------|
| 3.1 | `src/data/vessels.ts` exists; reference vessels have PC-class, length >50m, speed >10kn, ice speed limit >0 |
| 3.2 | Environment simulation module exports `generateSeaIceForecast` accepting `horizon`/`horizonDays` |
| 3.3 | Iceberg simulation module exports `generateIcebergTrajectories` modeling drift/uncertainty/trajectory |
| 3.4 | Hazard simulation exports `generateHazardMap` and `calculateVesselCompatibility` |
| 3.5 | Route module exports `generateRoutes`; mitigation module exports `generateMitigationRecommendation` |

### 13.4 Map (Features 4.1–4.5)
| Test | Criterion |
|------|-----------|
| 4.1 | `components/map/AntarcticMap.tsx` exists and renders `<svg>` or `<canvas>` |
| 4.2 | Map supports Ice, Icebergs, Hazards, Routes layer toggles |
| 4.3 | Map supports iceberg click inspection (`onClick`/`onSelect`/`activeIceberg`) |
| 4.4 | Map integrated in Dashboard, Environment, Icebergs, Hazards, Routes pages |
| 4.5 | Map includes timeline horizon control (horizon/timeline/1d/3d/7d) |

### 13.5 Route invariants (Features 5.1–5.6)
| Test | Criterion |
|------|-----------|
| 5.1 | Exactly 4 route types: shortest, safest, fuel_efficient, balanced |
| 5.2 | Each route exposes 8 metrics: distanceNm, etaHours, fuelTons, averageRiskScore, maxRiskScore, iceExposureHours, icebergExposureCount, vesselCompatibility |
| 5.3 | Shortest distance (412) < Balanced (445) < Safest (528) NM |
| 5.4 | Safest risk (22) < Balanced (31) < Shortest (74) |
| 5.5 | Routes page renders plain-English decision explanation |
| 5.6 | Routes page renders side-by-side comparison table |

### 13.6 Existing executable checks
The test suite also contains styling/token checks, but those are outside this functionality-only PRD. Functionality recreation should prioritize route inventory, navigation structure, simulation behavior, map behavior, scientific positioning, demo flow, build readiness, and the executable test suite.

### 13.7 Scientific positioning (Features 7.1–7.4)
| Test | Criterion |
|------|-----------|
| 7.1 | Zero autonomous navigation claims across all pages |
| 7.2 | Zero fake structural damage percentages (hull damage %, breach probability %) |
| 7.3 | Risk and reports pages use operational consequence terms (besetting, disruption, delay, fuel penalty, standoff) |
| 7.4 | Application affirms "decision support" and Master/Ice Pilot/SOLAS/Polar Code authority |

---

## 14. Source Traceability

| Component | Path |
|-----------|------|
| Route pages | `app/page.tsx`, `app/dashboard/page.tsx`, `app/mission/page.tsx`, `app/environment/page.tsx`, `app/icebergs/page.tsx`, `app/hazards/page.tsx`, `app/vessel/page.tsx`, `app/routes/page.tsx`, `app/risk/page.tsx`, `app/reports/page.tsx`, `app/settings/page.tsx` |
| Layout shell | `components/layout/AppShell.tsx` (imports missing `./Sidebar`), `components/layout/PlaceholderPage.tsx` |
| Session state | `components/session/MissionSessionProvider.tsx` |
| Map | `components/map/AntarcticMap.tsx` |
| Route components | `components/routes/RouteCard.tsx`, `components/routes/DecisionExplanationCard.tsx`, `components/routes/RouteComparisonTable.tsx` |
| Risk components | `components/risk/ConsequenceAnalysisGrid.tsx`, `components/risk/MitigationChecklist.tsx`, `components/risk/TacticalProtocolsGrid.tsx` |
| Report components | `components/reports/WaypointScheduleTable.tsx` |
| Simulation engine | `src/simulations/engine.ts` (pipeline), `src/simulations/index.ts` (barrel) |
| Simulation modules | `src/simulations/environment.ts`, `src/simulations/icebergs.ts`, `src/simulations/hazards.ts`, `src/simulations/routes.ts`, `src/simulations/mitigation.ts` |
| Data fixtures | `src/data/missions.ts`, `src/data/vessels.ts`, `src/data/hazards.ts`, `src/data/icebergs.ts`, `src/data/routes.ts` |
| Types | `src/types/maritime.ts`, `src/types/simulation.ts`, `src/types/state.ts`, `src/types/index.ts` |
| Constants | `src/lib/constants.ts` (POLARIS risk values, thresholds, design token references, sector bounds) |
| Utilities | `src/lib/utils.ts` (coordinate/DMS formatting, Haversine, risk color mapping), `src/lib/index.ts` |
| Tests | `tests/tier1_feature_coverage.test.mjs`, `tests/helpers/audit_engine.mjs` |
| Config | `package.json`, `next.config.ts`, `app/globals.css`, `app/layout.tsx` |
