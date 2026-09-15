# 04 — Architecture Decision Record (ADR)

## 0. Document Identity

**Product:** fordgeBurg — Antarctic Maritime Decision Support SaaS
**Repository:** `/home/dev/Desktop/projects/fordge-burg`
**Stack:** Next.js 16.3.4 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5, Node.js native test runner
**Nature:** Static frontend prototype. All intelligence is deterministic local simulation. No backend, database, API, authentication, or persistence.
**Test command:** `node scripts/e2e-audit.mjs` (`npm test`)
**Status:** This record documents the **existing prototype as-is** (decisions preserved vs. defects noted). It records what the code currently does and what should change before it can run.

> Note on Next.js 16: the project bootstraps with `create-next-app` and its `AGENTS.md` banner states this version "has breaking changes" and that `next dev` re-writes a rules block. This prototype uses the standard App Router conventions (`app/layout.tsx`, `app/*/page.tsx`), so per-version API divergence between App Router files is not observed here.

---

## 1. System Context and Boundaries

### 1.1 Context diagram

```
+---------------------------+
| Human Operator            |
| (Polar Ops Manager /      |
|  Ice Pilot / Fleet Desk)   |
+------------+--------------+
             | views / configures
             v
+---------------------------+        reads/does NOT write
| fordgeBurg SPA (browser)  |<------- no network egress
| app/ components/ src/     |
+---------------------------+
        |
        | derived from
        v
+---------------------------+
| Deterministic Simulation  |   (pure functions, no I/O)
| src/simulations/ + data/  |
+---------------------------+
```

There is **no backend**. The browser holds all working state in React memory. Nothing is sent to or received from a server during normal operation.

### 1.2 System boundaries

**In scope (implemented):**
- Next.js App Router frontend with 11 client-rendered routes (`app/*/page.tsx`).
- Deterministic simulation engine (`src/simulations/`) producing forecasts, hazards, routes, mitigations, consequence analysis, and a POLARIS RIO summary.
- Static maritime datasets (`src/data/`): 5 vessels, 3 missions, 8 icebergs, 6 hazard zones, 4 baseline routes.
- Shared TypeScript domain + state + simulation types (`src/types/`).
- Utility/formatting functions and constants (`src/lib/`).
- Global mission state via React Context (`components/session/MissionSessionProvider.tsx`).
- Self-contained inline-SVG polar map (`components/map/AntarcticMap.tsx`).
- Feature components: routes (`components/routes/`), risk (`components/risk/`), reports (`components/reports/`), layout (`components/layout/`).
- E2E test suite in `tests/` plus the audit engine in `scripts/e2e-audit.mjs`.

**Out of scope (explicitly absent):**
- Backend, database, API, authentication, accounts, or roles.
- Real satellite / AIS / metocean / weather feed integration.
- Any real ML/AI model; "AI-powered" branding refers only to the deterministic simulation pipeline.
- No autonomous navigation or vessel control.
- No persistent storage; no `localStorage` / `sessionStorage`; no cookies for state; page reload resets to defaults.
- No Mapbox/Leaflet (pure inline SVG).
- No print-to-PDF server — `reports/page.tsx` uses `window.print()` only.
- No i18n (English only).
- No external analytics, telemetry, or error reporting.
- No server components rendering dynamic data.

### 1.3 Critical operational constraints

Every operational page (dashboard, mission, environment, icebergs, hazards, vessel, routes, risk, reports) renders an affirmation that the system is **advisory decision-support only** and that the **Master / certified Ice Pilot retain sole command authority** under SOLAS Chapter V and the IMO Polar Code. This is a deliberate scientific-positioning decision (preserved, not fixed). It is enforced as an audit rule (AC7) in `tests/helpers/audit_engine.mjs:101-116, 561-618`.

Risk language is constrained to **operational consequence terms** (besetting, route disruption risk, transit delay, fuel penalty, maneuverability index). Fake hull-damage percentages are explicitly prohibited (`PROHIBITED_DAMAGE_PERCENTAGE_PATTERNS`, `tests/helpers/audit_engine.mjs:113-116`).

---

## 2. Tech Stack and Architecture

### 2.1 Dependency surface (`package.json`)

```
dependencies:  clsx, lucide-react, next@16.3.4, react@19.2.8, react-dom@19.2.8
devDeps:      @tailwindcss/postcss@4, tailwindcss@4, typescript@5, eslint@9,
              eslint-config-next@16.3.4, @types/node@20, @types/react@19
```

No UI framework, no mapping library, no state-management library beyond React's built-ins, no charting library. `clsx` is imported in `src/lib/utils.ts:6` but only a trivial `cn()` wrapper exists.

### 2.2 Next.js / React architecture

- **App Router** (`app/` layout + per-route `page.tsx`). `app/layout.tsx` is the Root Layout; it injects `globals.css`, configures the `Inter` font (`app/layout.tsx:6-9`), and wraps the body in `MissionSessionProvider` (`app/layout.tsx:28`).
- **Every route page is `"use client"`** — confirmed in all 11 `app/*/page.tsx` files. The root `app/layout.tsx` is a server layout component that mounts the client `MissionSessionProvider`. Operational rendering and state updates are client-side.
- **Tailwind CSS v4** via `@import "tailwindcss"` in `app/globals.css:1`. The `@theme` block (`app/globals.css:3-70`) declares a private color palette.
- **TypeScript** with path alias `@/*` → project root (`tsconfig.json:23-25`); `isolatedModules`, `strict`, `jsx: react-jsx`, `noEmit`.

### 2.3 App Router route shell

All 11 routes wrap their content in `AppShell` (the persistent shell). `app/page.tsx:69` is the only page whose content width is constrained differently: `AppShell.tsx:121` sets `max-w-[640px]` for `pathname === "/"` and `max-w-[1360px]` for every other route.

```
Route inventory (app/):
  /            app/page.tsx                 Landing/search hero, keyword routing
  /dashboard   app/dashboard/page.tsx       Mission Control: KPIs + map + vessel
  /mission     app/mission/page.tsx         Planner: inputs + 1.2s sim loader + outputs
  /environment app/environment/page.tsx     Sea-ice/metocean telemetry + zone table
  /icebergs    app/icebergs/page.tsx        8-target iceberg catalog + inspection HUD
  /hazards     app/hazards/page.tsx        6-zone fused hazard matrix + decomposition
  /vessel      app/vessel/page.tsx          Vessel picker + specs + POLARIS RIO + matrix
  /routes      app/routes/page.tsx         4 route cards + map + comparison table
  /risk        app/risk/page.tsx           Consequence grid + mitigations + protocols
  /reports     app/reports/page.tsx        Printable Mission Decision Support Document
  /settings    app/settings/page.tsx       Units, coordinate format, risk tolerance
```

These 11 routes are the audit contract (`REQUIRED_ROUTES` in `tests/helpers/audit_engine.mjs:24-36`; AC5 asserts they all exist).

---

## 3. Root Session Provider and State Flow

### 3.1 Placement

`app/layout.tsx:28` renders:

```tsx
<MissionSessionProvider>{children}</MissionSessionProvider>
```

`MissionSessionProvider` (`components/session/MissionSessionProvider.tsx:85`) is the **root React Context provider** and the single source of truth for all reactive mission state. `AppShell` consumes it directly (`AppShell.tsx:13,22`); every operational page consumes it via the `useMission()` hook (`components/session/MissionSessionProvider.tsx:438`).

### 3.2 Context surface

The context value (`MissionSessionProvider.tsx:384-431`) exposes three groups:

1. **State:** `mission`, `selectedMissionId`, `vessel`, `selectedVesselId`, `forecastHorizon`, `optimizationPreference`, `selectedRouteId`, `simulationStatus`, `simulationProgress`, `lastSimulationTimestamp`, `mapLayers`, `activeIceberg`, `settings`/`userSettings`, `simulationResult`.
2. **Mutators:** `setVessel`, `setSelectedVesselId`, `setMission`, `setSelectedMissionId`, `setForecastHorizon`, `setOptimizationPreference`, `setSelectedRoute`, `setSelectedRouteId`, `toggleMapLayer`, `setActiveIceberg`, `setSelectedIcebergId`, `updateSettings`, and `runMissionSimulation`. Module aliases are `MissionProvider` and `useSimulationSession`.
3. **Derived simulation values:** `routes`, `selectedRoute`, `seaIceForecast`, `icebergs`, `hazardMap`, `vesselCompatibility`, `mitigations`, `consequenceAnalysis`, `polarisSummary`.

### 3.3 State flow (reactive derivation)

```
User input          ── setX (useCallback) ──> useState
                                            │
                                            ▼
           ┌───────────────────────────────────────────────┐
           │ useMemo derive-chain (all pure sim functions) │
           └───────────────────────────────────────────────┘
forecastHorizon ─▶ generateSeaIceForecast(h)        ─▶ seaIceForecast
               ─▶ generateIcebergTrajectories(h)   ─▶ icebergs
               ─▶ generateHazardMap(h)             ─▶ hazardMap
currentVessel + hazardMap ─▶ calculateVesselCompatibility ─▶ vesselCompatibility
currentMission + currentVessel + preference + horizon ─▶ generateRoutes ─▶ routes
hazardMap + currentVessel + selectedRoute ─▶ generateMitigationRecommendation ─▶ mitigations
currentVessel (+ selectedRoute) ─▶ consequenceAnalysis (inline switch)
vesselCompatibility + selectedRoute ─▶ polarisSummary
```

All derived values are `useMemo`-cached on their inputs, so the simulation re-runs only when a controlling input changes. The full snapshot (`simulationResult: MissionSimulationResult`) is computed lazily by `runMissionSimulation` (`MissionSessionProvider.tsx:346-382`) and stored only to drive the mission page's progress UI; the operational pages read the live `useMemo` derivables instead.

```
runMissionSimulation(): Promise<void>
  idle ──set──▶ running (t=0ms, progress 0)
            ──300ms──▶ progress 40   "Phase 1/3: Ingesting SAR..."
            ──700ms──▶ progress 80   "Phase 2/3: POLARIS RIO..."
            ──1200ms─▶ progress 100, status completed, generateMissionSimulation() snapshot
```

Timers are tracked in `simulationTimerRef` and cleared on unmount (`MissionSessionProvider.tsx:119,122-126,348-349`).

### 3.4 State constraints (decisions preserved)

- **No persistence.** `userSettings`, `mapLayers`, `simulationStatus`, and all mission state are React `useState` only. `settings/page.tsx:443` explicitly states "configuration options are stored client-side"; nothing writes to `localStorage` or a backend. A reload resets every piece of state to the provider's `DEFAULT_*` initial values.
- **No server sync.** `simulationResult.timestamp` uses `new Date().toISOString()` (engine, `src/simulations/engine.ts:150`), but it is never persisted or sent anywhere — it exists only inside the in-memory snapshot.

---

## 4. Deterministic Simulation / Data Layer

### 4.1 Layering

```
src/
  data/      Static mock datasets (constants). No I/O.
    vessels.ts    VESSELS[] (5 archetypes), DEFAULT_VESSEL
    missions.ts   MISSIONS[] (3), DEFAULT_MISSION, getMissionById()
    icebergs.ts   ICEBERGS[] (8 base records + calculateTrajectory helper)
    hazards.ts    HAZARDS[] (6 zones), getHazardById()
    routes.ts     BASELINE_ROUTES[] (4), DEFAULT_ROUTE, getRouteById()
    index.ts      barrel
  simulations/ Pure functions: (input) -> output, deterministic
    environment.ts  generateSeaIceForecast(horizon) -> SeaIceForecast
    icebergs.ts     generateIcebergTrajectories(horizon) -> Iceberg[]
    hazards.ts      generateHazardMap(horizon) -> HazardMapResult
                    calculateVesselCompatibility(vessel, hazard) -> VesselCompatibilityResult
    routes.ts       generateRoutes(mission, vessel, preference, horizon) -> RouteAlternative[]
                    generateDecisionExplanation(route, shortest) -> string
    mitigation.ts   generateMitigationRecommendation(hazard, vessel, route?) -> RiskMitigation[]
    engine.ts        generateMissionSimulation(mission?, vessel?, pref?, horizon?) -> MissionSimulationResult
    index.ts         barrel
  types/      Shared interfaces (no runtime)
    maritime.ts     domain: Vessel, Mission, Iceberg, HazardZone, RouteAlternative, RiskMitigation, ...
    state.ts        state: MissionState, MissionContextValue, UserSettings, MapLayerVisibility, SimulationStatus
    simulation.ts   I/O: MissionSimulationResult, VesselCompatibilityResult, ConsequenceAnalysis, PolarisSummary, HazardMapResult
    index.ts        barrel
  lib/      Utilities + constants
    constants.ts    ANTARCTIC_SECTOR, SVG_VIEWBOX, DESIGN_TOKENS, DEFAULT_MISSION_CONFIG, POLARIS_THRESHOLDS, POLARIS_RISK_VALUES
    utils.ts        cn, formatCoordinates, formatKnots, formatNauticalMiles, formatPercentage,
                    formatFuelTons, formatHours, getRiskColor, getRiskBadgeClass, getSeverityColor,
                    getSeverityBadgeClass, getRiskTextColor, getSeverityTextColor, getRiskSvgClasses,
                    calculateHaversineDistanceNm, coordToSvg
    index.ts        barrel
```

### 4.2 Master simulation pipeline

`generateMissionSimulation` (`src/simulations/engine.ts:24-151`) runs eight labeled sequential blocks (documented in the file’s numbered comments at `engine.ts:33-134`):

1. Predict Environment — `generateSeaIceForecast(h)`
2. Predict Iceberg Hazards — `generateIcebergTrajectories(h)`
3. Fuse Hazard Map — `generateHazardMap(h)`
4. Understand Vessel (IMO POLARIS) — `calculateVesselCompatibility(vessel, hazardMap)`
5. Optimise Routes — `generateRoutes(mission, vessel, pref, h)`
6. Minimise Operational Risk — `generateMitigationRecommendation(hazardMap, vessel, recommendedRoute)`
7. Synthesize Consequence + POLARIS summary

The provider maintains the same derivation continuously through `useMemo`, while `generateMissionSimulation` produces an on-demand timestamped snapshot. The mission page’s phase messaging accompanies a 1.2s `setTimeout` progress sequence; the underlying simulation calls are synchronous local functions.

### 4.3 Determinism contract

- Input space is tiny and fixed: `forecastHorizon ∈ {1,3,7}`, `preference ∈ {balanced,safety,fuel,time}`, plus one of 5 vessels × 3 missions × 4 routes.
- Random number generation: **none observed** in `src/simulations/`; the only time-based value found there is the snapshot `timestamp` in `engine.ts:150`.
- The same `(mission, vessel, preference, horizon)` triple always yields identical `routes`, `hazardMap`, `vesselCompatibility`, and `mitigations`.
- `ForecastHorizon` is coerced to `{1,3,7}` at the boundary in every sim entry point (`horizon === 3 || horizon === 7 ? horizon : 1`), so out-of-set values silently collapse to `1` (`environment.ts:10`, `icebergs.ts:10`, `hazards.ts:10`, `routes.ts:82`, `engine.ts:30`). This is a **preserved decision** (defensive normalization) but also a **latent defect** (silent input coercion; see §9).

### 4.4 POLARIS engine

`calculateVesselCompatibility` (`src/simulations/hazards.ts:69-186`) implements the IMO POLARIS Risk Index Outcome (RIO):

```
RIO_zone = (C_ice × RV_ice) + (C_openWater × RV_openWater)   // 10 tenths total
```

- Ice class risk values come from `POLARIS_RISK_VALUES` (`src/lib/constants.ts:62-137`), a `Record<IceClass, {...}>` keyed by `PC1..PC7` and `OpenWater`.
- Status thresholds: `NORMAL_MIN=0`, `ELEVATED_MIN=-10`, `RESTRICTED_MAX=-10` (`constants.ts:51-55`).
- Output: `rioScore`, `operationalStatus ∈ {Normal Operation, Elevated Risk, Restricted Operation}`, `routeCompatibility`, `escortRequired`, `speedLimitKnots`, `complianceNotes`, `maxSafeIceThicknessMeters`.

The `polarisSummary` in the provider (`MissionSessionProvider.tsx:252-265`) and in `engine.ts:122-134` mirror the same derivation from `vesselCompatibility`.

---

## 5. Map Component and Projection

### 5.1 The single SVG map

`components/map/AntarcticMap.tsx` is a **self-contained, dependency-free SVG map** (1506 lines). No WebGL, no Mapbox/Leaflet, no canvas. The map canvas is `<svg viewBox="0 0 1000 650">` (`AntarcticMap.tsx:369`).

### 5.2 Projection

Equirectangular operational projection bounded to the Antarctic sector
`62.0°S–66.5°S, 54.0°W–64.0°W` (`ANTARCTIC_SECTOR`, `src/lib/constants.ts:8-15`). The projection function lives in two places (see §9 — duplicated concern). The canonical one is in `src/lib/utils.ts:211`:

```
x = ((lon - minLon) / lonSpan) * viewBoxWidth
y = ((maxLat - lat) / latSpan) * viewBoxHeight
```

The map-local copy (`AntarcticMap.tsx:47-54`) is functionally equivalent but adds rounding (`Math.round(x*10)/10`) and omits the 0..width clamp. The map also exposes `projectCoord` / `unprojectCoord` (`AntarcticMap.tsx:56-68`) and `formatDMS` (`AntarcticMap.tsx:73-81`) for cursor telemetry (`handleMouseMove`, `AntarcticMap.tsx:192-200`).

### 5.3 Map layer stack (render order in DOM = z-order)

```
<svg viewBox="0 0 1000 650">
  <defs>  hatch patterns, drift-arrow markers               (AntarcticMap.tsx:376-438)
  <g id="base_map">                                      (AntarcticMap.tsx:447)
    rect ocean surface
    bathymetry/current flow hint paths
    graticule-minor, graticule-major (lat arcs + lon meridians, labels)
    #coastline   — Antarctica, islands, ice shelf hatch fill
    #toponyms
    #station_markers — Origin (Maxwell Bay) + Destination (Outpost Alpha)
  <g id="ice_pack">      LAYER 1 — sea-ice zones + pack-ice margin arc   (gated on layers.ice)
  <g id="hazards">       LAYER 3 — hazard polygons + badges, hatch fill    (gated on layers.hazards)
  <g id="icebergs">      LAYER 2 — bergs, uncertainty ellipses, drift vectors, trajectory lines  (gated on layers.icebergs)
  <g id="candidate_routes"> LAYER 4a — unselected route polylines
  <g id="active_route">    LAYER 4b — active route with glow halo + waypoints
  floating iceberg HUD popover                            (gated on activeIceberg)
  collapsible tactical legend                             (gated on showLegend)
  bottom-left scale bar + cursor telemetry + metocean      (gated on showTelemetry)
```

> Map notes: the sector is hard-coded to the Weddell Sea / Antarctic Peninsula sector; origin/destination are internal constants (`DEFAULT_ORIGIN`/`DEFAULT_DESTINATION`, `AntarcticMap.tsx:83-95`) unless `vessel`/`routes` props override them. The layer toggles are four booleans (`MapLayerVisibility`: `ice`, `icebergs`, `hazards`, `routes`) driven either by props or internal state.

### 5.4 Dual-mode design

`AntarcticMap` supports a **controlled mode** (props from the provider) and an **uncontrolled fallback** (`propHorizon ?? internalHorizon`, etc., `AntarcticMap.tsx:130-138`). In uncontrolled mode it calls the simulation functions itself (e.g. `generateRoutes(undefined, vessel, 'balanced', activeHorizon)` at `AntarcticMap.tsx:179` — note the `mission` argument is `undefined`, so `generateRoutes` falls back to `BASELINE_ROUTES` without a mission context).

---

## 6. Route / Risk / Report Components

### 6.1 Route components (`components/routes/` + `components/reports/`)

| File | Role | Key exports | Consumer |
|---|---|---|---|
| `components/routes/RouteCard.tsx` | Per-route stat card (name, trade-off, distance/ETA/fuel/risk metrics, compatibility badge, select button) | `RouteCard({ route, isSelected, onSelect })` | `app/routes/page.tsx:6` |
| `components/routes/RouteComparisonTable.tsx` | Side-by-side matrix across all 4 alternatives | `RouteComparisonTable({ routes, selectedRouteId, onSelectRoute })` | `app/routes/page.tsx:8` |
| `components/routes/DecisionExplanationCard.tsx` | Plain-English rationale with delta indicators vs. shortest route | `DecisionExplanationCard({ selectedRoute, shortestRoute, decisionExplanation })` | `app/routes/page.tsx:7` |
| `components/reports/WaypointScheduleTable.tsx` | Waypoint-by-waypoint passage-plan table (DMS coords, leg distances, planned speeds, ice tenths, durations) | `WaypointScheduleTable({ route, vessel })` | `app/reports/page.tsx:210` |

`WaypointScheduleTable` (`components/reports/WaypointScheduleTable.tsx:4-5`) imports `formatCoordinates` + `calculateHaversineDistanceNm` from `@/src/lib/utils` and derives per-leg speeds/distances from the selected route's waypoints plus a hard-coded `waypointNames` array (8 names, `WaypointScheduleTable.tsx:14-23`). It is implemented once and consumed by the printable mission report.

### 6.2 Risk components (`components/risk/`)

| File | Role | Key exports |
|---|---|---|
| `ConsequenceAnalysisGrid.tsx` | 5-metric consequence strip + narrative + POLARIS RIO box | `ConsequenceAnalysisGrid({ consequence, polaris, vessel, route })` |
| `MitigationChecklist.tsx` | Interactive ack checklist; local `acknowledgedMap` state; "Acknowledge All" | `MitigationChecklist({ mitigations })` |
| `TacticalProtocolsGrid.tsx` | 4 static protocol cards (speed, standoff, daylight, watchkeeping) — hard-coded data, no props | `TacticalProtocolsGrid()` |

### 6.3 Reports component

`components/reports/WaypointScheduleTable.tsx` — the passage-plan table rendered by `app/reports/page.tsx:210`.

### 6.4 Component consumption map

```
app/routes/page.tsx      ─▶ RouteCard, RouteComparisonTable, DecisionExplanationCard, AntarcticMap
app/risk/page.tsx        ─▶ ConsequenceAnalysisGrid, MitigationChecklist, TacticalProtocolsGrid
app/reports/page.tsx     ─▶ WaypointScheduleTable (+ window.print trigger at reports/page.tsx:33-37)
app/dashboard/page.tsx   ─▶ AntarcticMap
app/environment/page.tsx ─▶ AntarcticMap
app/icebergs/page.tsx    ─▶ AntarcticMap
app/hazards/page.tsx     ─▶ AntarcticMap
```

---

## 7. Configuration and Type Boundaries

### 7.1 Type layering

```
src/types/maritime.ts   ← domain primitives (Vessel, Mission, Iceberg, HazardZone, RouteAlternative, RiskMitigation, SeaIceForecast, enums)
src/types/simulation.ts ← I/O schemas (MissionSimulationResult, VesselCompatibilityResult, ConsequenceAnalysis, PolarisSummary, HazardMapResult, ForecastHorizon, OptimizationPreference)
src/types/state.ts      ← UI state (MissionState, MissionContextValue, UserSettings, MapLayerVisibility, SimulationStatus)
src/types/index.ts      ← barrel (re-exports all three)
```

`state.ts:26` re-exports `ForecastHorizon` and `OptimizationPreference` from `simulation.ts`, so both `@/src/types/state` and `@/src/types/simulation` expose them. `simulation.ts:18-19` declares `ForecastHorizon` and `OptimizationPreference` as the source of truth; `state.ts:16-24` imports them.

**Type divergence to note:** `OptimizationPriority` is declared in `maritime.ts:43` (`'safety' | 'fuel' | 'time' | 'balanced'`) for `Mission.priority`, while `OptimizationPreference` lives in `simulation.ts:19` (`'balanced' | 'safety' | 'fuel' | 'time'`) for the live preference. They are structurally identical in order only; they are distinct named types.

### 7.2 Configuration constants

`src/lib/constants.ts` holds the configuration boundary: `ANTARCTIC_SECTOR` (projection bounds), `SVG_VIEWBOX` (1000×650), `DESIGN_TOKENS`, `DEFAULT_MISSION_CONFIG`, `POLARIS_THRESHOLDS`, and `POLARIS_RISK_VALUES`.

### 7.3 Barrel exports (every layer)

`src/data/index.ts`, `src/simulations/index.ts`, `src/types/index.ts`, `src/lib/index.ts`, `components/map/index.ts` (`components/map/index.ts:6-8` re-exports `AntarcticMap`, `coordToSvg`, `projectCoord`, `unprojectCoord`, `formatDMS`). Consumers import via the `@/*`-aliased barrel paths (`@/components/map`, `@/src/types`, `@/src/lib`, `@/src/data`, `@/src/simulations`).

---

## 8. Test Architecture

### 8.1 Runner

`scripts/e2e-audit.mjs` is the single `npm test` entry point. It runs two phases:

1. **Automated code verification** — 9 inline static source audits (AC1–AC9) using helpers in `tests/helpers/audit_engine.mjs`.
2. **`node --test` over 6 test files**: tier 1–5 plus `automated_code_verification.test.mjs`.

The repository contains two additional on-disk suites, `m2_shell_navigation_state.test.mjs` and `m5_routes_risk_reports_settings.test.mjs`, which the runner does not execute. Thus `npm test` reports 117 checks/tests, while a direct run over all eight `.test.mjs` files reports 136 tests.

Tests are **opaque-box / source-inspection** style: they read files and assert on substrings/presence, plus some tier tests import the simulation functions and assert on deterministic outputs.

### 8.2 Test tiers (`tests/`)

| File | Kind | Coverage |
|---|---|---|
| `tests/helpers/audit_engine.mjs` | Audit helper | CANONICAL_TOKENS(9), REQUIRED_ROUTES(11), REQUIRED_SIDEBAR_GROUPS(6 groups / 12 links), REQUIRED_MARITIME_UNITS(6), PROHIBITED_AUTONOMOUS_TERMS(5), PROHIBITED_DAMAGE_PERCENTAGE_PATTERNS(2), REFERENCE_VESSELS(3), REFERENCE_ROUTE_TYPES(4); audit funcs: `auditDesignTokens`, `auditHardcodedColors`, `auditForbiddenClasses`, `auditHeroImagesAndGradients`, `auditRouteFiles`, `auditSidebarNavigation`, `auditScientificPositioning`, `auditInputOutputSeparation`, `auditMaritimeUnits` |
| `automated_code_verification.test.mjs` | AC1–AC9 | 9 assertions |
| `tier1_feature_coverage.test.mjs` | Tier 1 feature coverage | 43 tests |
| `tier2_boundary_corner.test.mjs` | Tier 2 boundary/corner | 29 tests |
| `tier3_cross_feature.test.mjs` | Tier 3 cross-feature | 15 tests |
| `tier4_application_scenarios.test.mjs` | Tier 4 app scenarios | 5 scenarios |
| `tier5_adversarial_coverage.test.mjs` | Tier 5 adversarial | 7 tests (5 pass, 2 fail: root-layout fonts, micro data density) |
| `m2_shell_navigation_state.test.mjs` | Milestone M2 | shell / sidebar / nav state |
| `m5_routes_risk_reports_settings.test.mjs` | Milestone M5 | routes / risk / reports / settings |

The AC6 sidebar audit checks four candidate file paths in order (`audit_engine.mjs:500-505`): `components/navigation/SidebarNav.tsx`, `components/layout/SidebarNav.tsx`, `components/layout/Sidebar.tsx`, `components/SidebarNav.tsx`.

---

## 9. Known Defects, Duplicated Concerns, and Decisions to Preserve vs. Fix

### 9.1 Build blocker — missing Sidebar

`components/layout/AppShell.tsx:12` imports `Sidebar` from `./Sidebar`, but `components/layout/Sidebar.tsx` does **not exist**. `AppShell` renders it at two points (`AppShell.tsx:38` and `AppShell.tsx:58`). The `components/navigation/` directory exists but is empty.

```
app/layout.tsx
  └─ MissionSessionProvider  (defined, OK)
     └─ route pages
        └─ AppShell        (defined, OK)
           └─ import Sidebar from "./Sidebar"   ← MISSING → build/runtime failure
```

**Consequence:** `npm run dev` / `npm run build` will fail at compile time; the app cannot render. This is tracked as AC6 (sidebar audit) and is the single hard blocker. The audit engine requires the sidebar to expose 6 groups — MISSION, INTELLIGENCE, VESSEL, NAVIGATION, REPORTING, SYSTEM — with 12 links (`REQUIRED_SIDEBAR_GROUPS`, `audit_engine.mjs:42-83`). **Decision:** preserve the 6-group contract; fix by implementing the Sidebar component at one of the four candidate paths audited by AC6.

### 9.2 Duplicated `coordToSvg`

Two exported, reachable implementations of the same projection:

| Location | Signature | Behavior | Caller |
|---|---|---|---|
| `src/lib/utils.ts:211` | `coordToSvg(lat, lon, viewBoxWidth?=1000, viewBoxHeight?=650)` | equirectangular; **clamps** x/y to `[0,w]`/`[0,h]` via `Math.max/min` | `@/src/lib` consumers; `WaypointScheduleTable` imports other utils here but not this function in shipped pages |
| `components/map/AntarcticMap.tsx:47` | `coordToSvg(lat, lon)` | equirectangular; **rounds** to 1 decimal (`Math.round(x*10)/10`); **no clamp** | used 18× inside `AntarcticMap` itself; re-exported from `components/map/index.ts:6` |

**Consequence:** two source-of-truth copies of the projection math. Only the map-local copy is actually exercised by the UI. **Decision:** preserve both as-is for this ARD; fix by consolidating onto the clamped `src/lib/utils.ts` version and re-exporting the single source — but only after confirming callers that depend on the rounding behavior. The rounded variant produces visually stable SVG points (no sub-pixel jitter) which the clamped variant does not guarantee.

### 9.3 Duplicated `formatDMS` / `formatCoordinates`

`formatDMS` exists only in `components/map/AntarcticMap.tsx:73` (exported and re-exported via `components/map/index.ts:8`). `formatCoordinates` (DMS+DD) exists only in `src/lib/utils.ts:21`. They overlap in DMS formatting but have different APIs and rounding. Not a functional defect, but a maintenance footgun. `icebergs/page.tsx:5` imports `formatDMS` from the map barrel; `WaypointScheduleTable.tsx:4` imports `formatCoordinates` from `@/src/lib`.

### 9.4 `generateRoutes` called with `mission = undefined`

`AntarcticMap.tsx:179` calls `generateRoutes(undefined, vessel, 'balanced', activeHorizon)` when no routes are supplied as props. `generateRoutes` (`src/simulations/routes.ts:76`) types `mission?` as optional and the `mission` is never read inside the function body (routes come from `BASELINE_ROUTES`), so this is harmless but dead-parametrization: the mission context is silently ignored in the map's uncontrolled fallback.

### 9.5 Globals.css tokens diverge from canonical design tokens (AC1, AC2)

`app/globals.css:5-16` defines a private palette (`--color-paper-white`, `--color-cloud-gray`, `--color-mist-border`, `--color-fog-border`, `--color-ink-black`, `--color-midnight-panel`, `--color-deep-night`, `--color-slate-body`, `--color-steel-caption`, `--color-ash-disabled`, `--color-hugging-yellow`, `--color-link-blue`). The 9 canonical tokens enforced by AC1 (`--color-primary-navy`, `--color-accent-blue`, `--color-canvas`, `--color-surface`, `--color-text-muted`, `--color-border`, `--color-risk-high`, `--color-risk-med`, `--color-risk-low`) are **absent** from `globals.css`.

**Consequence:** AC1 and AC2 fail under the existing test contract. **Decision:** preserve the observed implementation in this documentation; changing either the implementation or the test contract would be a separate source change.

### 9.6 Hardcoded hex in `app/page.tsx` (AC2)

`app/page.tsx:221-223` use `bg-[#f0eeea]` on skeleton placeholders; `app/page.tsx:90,185,204` use `shadow-[rgba(0,0,0,0.08)_0px_1px_2px_0px]`. 18 total AC2 violations (3 tsx + 15 css-declaration).

### 9.7 Forbidden Tailwind classes (AC3)

167 violations: `rounded-full` on non-micro-dot elements (buttons, badges, select chips, pills) across all 11 route pages and `components/`, plus `shadow-[rgba(0,0,0,0.08)...]` arbitrary shadows in `app/page.tsx:90,185,204`. The audit permits `rounded-full` only for micro status dots (`w-1.5 h-1.5`, `w-2 h-2`, or the `.status-dot` class — `audit_engine.mjs:393-397`).

### 9.8 Dead code: `PlaceholderPage`

`components/layout/PlaceholderPage.tsx` imports `AppShell` and renders a "wrench" WIP placeholder. It is imported by **no** route or component and is flagged as dead in `07-source-map.md:41`. **Decision:** preserve (unused) — remove when cleaning up dead code.

### 9.9 Silent input coercion in simulation entry points

`environment.ts:10`, `icebergs.ts:10`, `hazards.ts:10`, `routes.ts:82`, `engine.ts:30` all coerce the horizon with `horizon === 3 || horizon === 7 ? horizon : 1`. Any out-of-set value (e.g. `2`, `5`, `NaN`) silently becomes `1`. **Decision:** preserve (defensive normalization); flag for tighter validation in a future refactor.

### 9.10 Decision-explanations / risk text are synthetic

`generateDecisionExplanation` (`src/simulations/routes.ts:19-74`) and the per-zone prose in `mitigation.ts` / the `operationalNarrative` (`engine.ts:109-120`) are hand-authored English, not derived from a real physics engine. `mission/page.tsx:352` admits "Phase 1/3: Ingesting SAR sea-ice observations..." while the actual computation is a synchronous `useMemo`. **Decision:** preserve as prototype messaging; fix only by re-labeling to honest "computing" semantics if the simulation is ever made genuinely async.

### 9.11 Decision summary table

| Concern | Preserved (intentional) | Defect (should fix) |
|---|---|---|
| Client-only, no persistence | yes | — |
| Decision-support / Master authority | yes | — |
| Deterministic sim, no RNG | yes | — |
| Pure-SVG map, no 3rd-party maps | yes | — |
| Silent horizon coercion to {1,3,7} | yes | partially — consider validation |
| Standardized maritime units (NM, kn, MT, tenths, m, °C) | yes | — |
| 6-group sidebar contract | yes | implementation missing (9.1) |
| `coordToSvg` duplication | — | consolidate onto one source in a separate source change (9.2) |
| `PlaceholderPage` dead code | — | remove in a separate source change (9.8) |
| globals.css non-canonical tokens | — | test-contract mismatch; implementation or test change required separately (9.5) |
| Hardcoded hex / forbidden classes in page.tsx | — | test-contract mismatch; implementation or test change required separately (9.6, 9.7) |

---

## 10. Deployment and Runtime Assumptions

- **Dev:** `npm run dev` → `next dev`. Requires the missing `Sidebar.tsx` to compile (§9.1), so dev is currently blocked.
- **Build:** `npm run build` → `next build` (static export not explicitly configured; `next.config.ts:1-6` is empty).
- **Runtime:** static, client-rendered SPA. No `getServerSideProps` / `getStaticProps` / route handlers. All data is bundled at build time from `src/data/`.
- **Deploy target:** none is configured in the observed source; `next.config.ts:1-6` is effectively empty. Because the app is fully client-side and stateless, it is structurally suitable for static hosting once the Sidebar blocker is resolved.
- **No env vars:** no `.env*` usage found; `next.config.ts` has no runtime config.
- **Node test runtime:** `node --test` over `tests/*.test.mjs` (ESM). `package.json` has no `next lint` script override; `lint` is `eslint` only.

---

## 11. Key file reference index

| Concept | Primary source files |
|---|---|
| Root layout + provider wiring | `app/layout.tsx:1-32` |
| Root shell | `components/layout/AppShell.tsx:1-126` |
| Global state | `components/session/MissionSessionProvider.tsx:85-448` |
| Type barrel | `src/types/index.ts:1-8` |
| Data barrel | `src/data/index.ts:1-10` |
| Simulation barrel | `src/simulations/index.ts:1-11` |
| Master engine | `src/simulations/engine.ts:24-151` |
| POLARIS RIO | `src/simulations/hazards.ts:69-186`; constants `src/lib/constants.ts:51-137` |
| SVG map + projection | `components/map/AntarcticMap.tsx:1-1506` (`coordToSvg:47`, `projectCoord:56`, `unprojectCoord:61`, `formatDMS:73`) |
| Utils `coordToSvg` (alt.) | `src/lib/utils.ts:211-229` |
| Route sim | `src/simulations/routes.ts:76-299`, `generateDecisionExplanation:19` |
| Test/audit contract | `tests/helpers/audit_engine.mjs:24-83` (routes), `:42-83` (sidebar), `:101-116` (prohibited terms), `:113-116` (damage %) |
| 11-route inventory | `app/{page,dashboard,mission,environment,icebergs,hazards,vessel,routes,risk,reports,settings}/page.tsx` |

---

*End of architecture decision record. This document describes the prototype as it currently exists in source; it does not prescribe new feature requirements.*
