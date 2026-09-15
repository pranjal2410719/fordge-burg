# 02 — Feature Specification

## Scope

This document describes the functionality visible in the current source. It does not treat design documents, test assertions, or UI marketing language as proof that a capability is implemented.

## Route inventory

All 11 route files currently exist under `app/`. Each page is a client component rendered through `AppShell`, but the shell cannot currently render until its missing `Sidebar` dependency is supplied.

| Route | Source file | Observed function |
|---|---|---|
| `/` | `app/page.tsx` | Search-style landing page with keyword routing and quick links |
| `/dashboard` | `app/dashboard/page.tsx` | Mission KPIs, active vessel, route summary, and map |
| `/mission` | `app/mission/page.tsx` | Mission, vessel, horizon, and optimization controls plus simulation trigger |
| `/environment` | `app/environment/page.tsx` | Sea-ice and metocean metrics with horizon selection |
| `/icebergs` | `app/icebergs/page.tsx` | Eight-target catalog, inspection panel, and trajectory map |
| `/hazards` | `app/hazards/page.tsx` | Six-zone hazard matrix and factor inspector |
| `/vessel` | `app/vessel/page.tsx` | Five-vessel selector, specifications, and POLARIS evaluation |
| `/routes` | `app/routes/page.tsx` | Four route cards, rationale, comparison table, and map |
| `/risk` | `app/risk/page.tsx` | Consequence analysis, mitigation checklist, and tactical protocols |
| `/reports` | `app/reports/page.tsx` | Client-rendered report with browser print action |
| `/settings` | `app/settings/page.tsx` | In-memory unit, coordinate, risk, and map preferences |

## Shared state and navigation

`MissionSessionProvider` is mounted by the root layout. It initializes a mission, vessel, 1/3/7-day horizon, optimization preference, selected route, four map-layer flags, active iceberg, settings, and simulation status. Its derived values are exposed through `useMission`.

`AppShell` provides the sticky topbar, desktop sidebar slot, mobile drawer, and authority banner. The topbar currently shows mission status (`idle`, `running`, or `completed`) and a “New mission” link. It does not show live coordinates or a vessel badge. The map has its own vessel label and cursor-coordinate telemetry.

`components/navigation/` is present but empty. `AppShell.tsx` imports `components/layout/Sidebar.tsx`, which is not present. That missing module blocks the current build/runtime path.

## Static domain data

| Dataset | Count and contents |
|---|---|
| Vessels | 5: Le Commandant Charcot (PC2), Polarstern II (PC2), RRS Sir David Attenborough (PC4), SA Agulhas II (PC5), and MV Antarctic Navigator (OpenWater) |
| Missions | 3: Weddell Sea Science Transect, Palmer Station Supply Run, and Ross Sea Marine Survey |
| Icebergs | 8 tracked targets with dimensions, drift vectors, uncertainty, and projected trajectories |
| Hazards | 6 spatial zones: pressure ridge, iceberg/shoal, multi-year ice, fast ice, drift field, and open-lead fairway |
| Routes | 4 alternatives: Shortest, Safest, Fuel-Efficient, and Recommended Balanced |

## Simulation pipeline

`generateMissionSimulation` executes eight labeled sequential blocks in `src/simulations/engine.ts`: sea-ice forecast, iceberg trajectories, hazard map, vessel compatibility, route alternatives, mitigations, consequence synthesis, and POLARIS summary. Route-recommendation selection occurs between route generation and mitigation generation.

1. Generate the sea-ice forecast for 1, 3, or 7 days.
2. Project the 8 iceberg trajectories and uncertainty radii.
3. Adjust the 6 hazard-zone scores and severities.
4. Calculate vessel compatibility and POLARIS RIO context.
5. Generate and rank the 4 route alternatives.
6. Generate 7 tactical mitigation records.
7. Synthesize consequence analysis and the returned POLARIS summary.

The provider’s visible trigger is a timed UI sequence: progress reaches 40%, 80%, and 100% at approximately 300 ms, 700 ms, and 1200 ms. The underlying calculations are local and deterministic; the snapshot timestamp is generated on completion.

## Feature behavior

### Mission Planner

The planner selects one of 3 missions, one of 5 vessels, a 1/3/7-day horizon, and one of `balanced`, `safety`, `fuel`, or `time` optimization preferences. The departure datetime is local page state and is not passed into the simulation. “Generate Mission Analysis” runs the timed status sequence and exposes the current derived values.

### Environment, Icebergs, Hazards, and Vessel

- Environment displays six metocean/sea-ice metrics, four ice zones, and horizon progression.
- Icebergs displays the 8 generated targets, their DMS coordinates, drift vectors, uncertainty, CPA, and selectable inspection HUD.
- Hazards displays the 6 generated zones, severity/risk scores, factor bars, and a selectable zone inspector.
- Vessel displays the selected vessel’s specifications and a capability matrix, plus the compatibility result derived from the current hazard map.

### Routes

`app/routes/page.tsx` consumes:

- `components/routes/RouteCard.tsx` for the four selectable alternatives;
- `components/routes/DecisionExplanationCard.tsx` for the selected-route rationale;
- `components/routes/RouteComparisonTable.tsx` for the side-by-side metrics.

Route generation adjusts risk, maximum risk, ETA, fuel, vessel compatibility, RIO, and rank from vessel class, horizon, and optimization preference. The map renders all four routes and lets the user select a route from either the cards or the SVG lines.

### Risk and reports

The risk page displays consequence metrics, the current POLARIS summary, seven mitigations, and four tactical protocol cards. The mitigation checklist keeps acknowledgment state locally while the page is mounted.

`app/reports/page.tsx` renders the current mission, vessel, route, consequence analysis, and mitigation data in the browser. “Export / Print Report” calls `window.print()`; there is no server-side PDF generation. The document reference, displayed generation timestamp, and status are hardcoded in the page. The report shows the first five of the seven mitigations.

`WaypointScheduleTable.tsx` is located at `components/reports/WaypointScheduleTable.tsx` and is consumed by `app/reports/page.tsx`. It derives DMS coordinates, leg distances, speeds, ice values, and durations from the selected route and vessel.

### Map

`AntarcticMap.tsx` uses an equirectangular linear transform, not a geographic projection library. It supports:

- Ice, Icebergs, Hazards, and Routes layer toggles;
- 1D, 3D, and 7D horizon changes;
- clickable iceberg markers and a floating inspection HUD;
- selectable route polylines and an active-route highlight;
- legend, scale bar, cursor coordinates, and environmental telemetry.

## Inputs and outputs

| Input | Current storage or behavior |
|---|---|
| Mission, vessel, horizon, optimization preference, selected route | React context |
| Map layers and active iceberg | React context |
| Unit system, risk tolerance, auto-center, soundings depth | React context, in memory only |
| Coordinate format | Local state on `/settings`; not propagated |
| Departure datetime | Local state on `/mission`; not passed to simulation |

Derived outputs are `seaIceForecast`, `icebergs`, `hazardMap`, `vesselCompatibility`, four `routes`, the selected route, seven `mitigations`, `consequenceAnalysis`, and `polarisSummary`.

## Settings wiring

| Setting | Current behavior |
|---|---|
| `unitSystem` | Stored, but formatting utilities continue to emit nautical units; metric selection does not change displayed units |
| `riskTolerance` | Stored, but not used by route generation or ranking |
| `mapAutoCenter` | Stored, but not read by `AntarcticMap` |
| `soundingsDepthMeters` | Stored and shown by the slider, but no soundings layer is rendered |
| `coordFormat` | Local Settings-page state only; other coordinate displays remain DMS |
| `mapLayers` | Stored in context and consumed by the map controls |

Reset Defaults restores the context defaults and the local DMS choice.

## Typical workflow

1. Configure a mission, vessel, horizon, and optimization preference on `/mission`.
2. Run the timed analysis trigger.
3. Inspect environment, iceberg, hazard, and vessel views.
4. Compare and select one of four routes on `/routes`.
5. Review consequences and mitigations on `/risk`.
6. Print the client-rendered report on `/reports`.

## Current gaps and factual verification notes

- `components/navigation/` exists but contains no files.
- `components/layout/Sidebar.tsx` is missing although `AppShell.tsx` imports it; this is a build/runtime blocker.
- The AppShell topbar has mission status but no live coordinates or vessel badge.
- Settings are in-memory and several controls are not wired to downstream behavior.
- There is no observed backend, persistence, live satellite/AIS/metocean feed, or ML model.
- The repository contains build, lint, and test scripts, but this specification makes no pass claim. The missing Sidebar import prevents treating the current source as build-ready.
- No design-system compliance claim is made here.
