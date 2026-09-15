# 01 — Project Overview

## Identity

| Item | Source-observed value |
|---|---|
| Display brand | `fordgeBurg` |
| npm package | `fordge-burg`, version `0.1.0`, private |
| Source repository | `/home/dev/Desktop/projects/fordge-burg` |
| Stack | Next.js 16.3.4 App Router, React 19.2.8, TypeScript 5, Tailwind CSS v4, Node.js test runner |

The application metadata uses the phrase “Antarctic Maritime Decision Support SaaS.” The checked implementation is a client-rendered prototype: it has no observed backend, database, API, authentication, persistence, or external data connection.

## Purpose and boundaries

`fordgeBurg` demonstrates a deterministic, local decision-support workflow across eight labeled engine blocks:

1. Predict the environment.
2. Project iceberg drift.
3. Fuse spatial hazards.
4. Evaluate vessel compatibility.
5. Compare route alternatives.
6. Generate operational mitigations.
7. Synthesize consequence analysis.
8. Summarize POLARIS authorization context.

The simulations use static datasets and synchronous functions in `src/data/` and `src/simulations/`. The UI labels the output as advisory and states that the Master and Ice Pilot retain navigation authority. It does not control a vessel or provide autonomous navigation.

## Source structure

| Area | Current source |
|---|---|
| Routes | 11 client route files under `app/`: `/`, `/dashboard`, `/mission`, `/environment`, `/icebergs`, `/hazards`, `/vessel`, `/routes`, `/risk`, `/reports`, and `/settings` |
| Shared state | `components/session/MissionSessionProvider.tsx` |
| Map | `components/map/AntarcticMap.tsx` |
| Route UI | `components/routes/RouteCard.tsx`, `DecisionExplanationCard.tsx`, and `RouteComparisonTable.tsx` |
| Report UI | `components/reports/WaypointScheduleTable.tsx` |
| Risk UI | `components/risk/ConsequenceAnalysisGrid.tsx`, `MitigationChecklist.tsx`, and `TacticalProtocolsGrid.tsx` |
| Simulation | `src/simulations/environment.ts`, `icebergs.ts`, `hazards.ts`, `routes.ts`, `mitigation.ts`, and `engine.ts` |
| Static data | 5 vessels, 3 missions, 8 icebergs, 6 hazard zones, and 4 baseline routes |
| Navigation | `components/navigation/` exists but is empty; `components/layout/Sidebar.tsx` is absent |

## Shell and map behavior

`AppShell.tsx` imports `Sidebar` from `./Sidebar` for both the desktop layout and mobile drawer. Because `components/layout/Sidebar.tsx` is missing, the current source has a module-resolution build/runtime blocker.

The topbar displays the current mission status and a “New mission” link. It does not display live coordinates or a vessel badge. The map itself has a vessel label and a cursor-coordinate readout; those are map telemetry, not AppShell topbar telemetry.

`AntarcticMap.tsx` is a self-contained SVG map. Its coordinate functions map longitude and latitude linearly onto a `1000 × 650` viewBox over 62.0°S–66.5°S and 54.0°W–64.0°W. This is an equirectangular mapping. The map provides Ice, Icebergs, Hazards, and Routes layer controls, a 1/3/7-day horizon control, clickable iceberg markers with a HUD, and selectable route lines.

## State and simulation behavior

`MissionSessionProvider` holds the selected mission, vessel, forecast horizon, optimization preference, selected route, map layers, active iceberg, settings, and simulation status in React state. Derived forecasts, trajectories, hazards, compatibility, routes, mitigations, consequence analysis, and POLARIS summaries are recomputed from those inputs. State resets on reload because it is not persisted.

The mission trigger updates progress at 300 ms, 700 ms, and 1200 ms, then stores a timestamped snapshot. The calculations are deterministic; the timestamp is generated when the trigger completes.

Settings are also in React memory. `unitSystem`, `riskTolerance`, `mapAutoCenter`, and `soundingsDepthMeters` are stored in context, while coordinate format is local to the Settings page. Several of these values are not consumed by the corresponding formatting or map code; see `02-feature-specification.md`.

## Verification status

`package.json` defines `build`, `lint`, and `test` scripts; `npm test` runs `node scripts/e2e-audit.mjs`. This overview makes no build-pass, test-pass, or design-system-compliance claim. The missing `components/layout/Sidebar.tsx` import is a current source-observed blocker.
