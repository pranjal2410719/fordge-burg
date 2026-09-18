# Project: Fordge-Burg Frontend — Round 2 Feature Delivery

## Architecture
- **Framework**: Next.js 15.1.6 App Router, React 19.0.0, TypeScript 5.
- **Styling**: Tailwind CSS v4 configured via `@theme` design tokens in `app/globals.css`. Custom polar nautical design language with Navy, Accent Blue, and Risk tri-color palettes.
- **Visualizations**: Native SVG rendering (no external charting dependencies for React 19 safety, instant hydration, and custom cartographic fidelity).
- **State Management**: React Context (`MissionProvider` in `components/session/MissionContext.tsx`) with `sessionStorage` persistence for active route selection, scenario parameters, and simulation execution state.
- **Component Layout**: Global responsive `AppShell` with sticky `Sidebar`, Topbar breadcrumbs & mission status, and dedicated feature views (`/dashboard`, `/mission`, `/routes`, `/risk`, `/reports`, `/hazards`, `/settings`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Enriched Pathway Telemetry Model | Define comprehensive telemetry (waypoints, POLARIS RIO scores, ice exposure breakdown, path coordinates, AI rationale) for all 4 corridors (`shortest`, `safest`, `fuel_efficient`, `balanced`) in `lib/data.ts` | M1 | Survey 1, Survey 3 |
| 2 | Route Overview Page Dynamic Breakdown | On `/routes`, add active pathway telemetry & waypoints breakdown (waypoint table, POLARIS RIO certification card, ice exposure regime progress bars), update comparison matrix with RIO & Peak Ice, and dynamic decision explanation | M1 | Survey 1, R1 |
| 3 | In-App Route Overview Synchronization | Synchronize active pathway telemetry on `/dashboard` (RIO badge, ice exposure, waypoints, dynamic AI rationale), `/mission` (`SimulationTelemetryHud`), and `/reports` (dynamic waypoints table) | M1 | Survey 1, R1 |
| 4 | Active Pathway State Persistence | Persist `selectedRouteId` in `MissionContext.tsx` with SSR-safe `sessionStorage` backing to preserve active pathway across navigation tabs and browser reloads | M1 | Survey 1, R1 |
| 5 | Unified Primary Action Buttons (3 Triggers) | Implement 3 synchronized action buttons with unified label "Generate Plan & Run Simulation" across (1) top navigation bar, (2) parameter stepper summary, and (3) sticky bottom action bar (`md:left-64`) | M2 | Survey 2, R2 |
| 6 | Vanishing Configuration Transition Flow | Multi-stage view state machine (`viewMode: "configure" | "outcome"`) where configuration cards and sticky bottom bar completely vanish upon execution trigger, transitioning smoothly to dedicated outcome view | M2 | Survey 2, R2 |
| 7 | Outcome View & Back / Modify Parameters Control | Dedicated outcome view rendering 8-block hydrodynamic simulation pipeline, real-time map preview, telemetry HUD, and route reveal cards, with intuitive "Back / Modify Parameters" control preserving all inputs | M2 | Survey 2, R2 |
| 8 | Dynamic Pathway Consequence Engine | Calculate consequence metrics (Besetment, Delay, Fuel Penalty, Route Disruption) dynamically in real-time based on active corridor geometry, chokepoint ice concentrations, and vessel ice class | M3 | Survey 3, R3 |
| 9 | Dynamic Mitigation Elevation Rules | Adapt tactical mitigation statuses dynamically (elevate daylight transit `m3` to mandatory on `shortest`, relax on `safest`; elevate escort `m5` to mandatory for OpenWater hulls; elevate fuel check `m6` on `fuel_efficient`) | M3 | Survey 3, R3 |
| 10 | Consequence Modals & Export Alignment | Synchronize `ConsequenceModal` factor breakdowns and `TelemetryExportBar` (CSV & JSON) with the corridor-specific dynamic consequences and adaptive mitigations | M3 | Survey 3, R3 |
| 11 | Comprehensive E2E & Unit Test Coverage | Add/update test suites covering R1 dynamic route overview, R2 unified triggers & vanishing flow, and R3 dynamic risk/mitigation alignment under `tests/` | M4 | Survey 1, 2, 3 |
| 12 | System Verification Cleanliness | Guarantee 0 TypeScript errors (`npx tsc --noEmit`), 100% test suite pass rate (`npm test`), and clean production build (`npm run build`) | M4 | Survey 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Dynamic Route Overview Across Pathways (R1) | Enriched pathway models in `lib/data.ts`, `MissionContext.tsx` persistence, `/routes` page breakdown, `/dashboard`, `/mission`, and `/reports` telemetry synchronization | none | DONE |
| M2 | Mission Planner Unified Triggers & Vanishing Transition (R2) | 3 unified action buttons in top bar, stepper summary, sticky bottom bar; vanishing configuration transition flow; outcome view with "Back / Modify Parameters" in `app/mission/page.tsx` & `ParameterStepper.tsx` | M1 | IN_PROGRESS |
| M3 | Dynamic Risk & Mitigation Real-Time Alignment (R3) | Corridor-specific consequence calculations and dynamic mitigation adaptation rules in `lib/riskDetailData.ts`, `app/risk/page.tsx`, modals, and telemetry exports | M1 | PLANNED |
| M4 | Comprehensive Test Suite & System Verification | Test suites for R1, R2, R3 in `tests/`, typecheck verification, full test execution, production build | M1, M2, M3 | PLANNED |

## Interface Contracts

### Enriched Pathway Telemetry (`lib/data.ts`)
```typescript
export interface RouteWaypoint {
  id: string;
  name: string;
  lat: string;
  lon: string;
  distNm: number;
  cumulativeNm: number;
  iceConcTenths: number;
  speedLimitKn: number;
  riskScore: number;
  hazardNote: string;
}

export interface PolarisRioProfile {
  score: number;
  scoreFormatted: string;
  status: "PASS" | "MARGINAL";
  regulatoryClause: string;
  description: string;
}

export interface IceExposureBreakdown {
  openWaterPct: number;
  lightIcePct: number;
  mediumPackPct: number;
  heavyRidgePct: number;
  peakIceConcTenths: number;
  peakLocation: string;
  multiYearIceNm: number;
}

export interface RouteAlternative {
  id: RouteId;
  name: string;
  tradeOff: string;
  distanceNm: number;
  etaHours: number;
  fuelTons: number;
  averageRiskScore: number;
  maxRiskScore: number;
  compatibility: string;
  rio: PolarisRioProfile;
  iceExposure: IceExposureBreakdown;
  waypoints: RouteWaypoint[];
  pathCoordinates: { x: number; y: number }[];
  aiRationale: {
    algorithm: string;
    heuristics: string;
    tradeOff: string;
  };
}
```

### Dynamic Risk & Consequences (`lib/riskDetailData.ts`)
```typescript
export interface DynamicConsequenceResult {
  key: "besetment" | "delay" | "fuel" | "disruption";
  label: string;
  score: number;
  value: string;
  level: "LOW" | "MODERATE" | "HIGH";
  factorHighlights: string[];
}

export function getCorridorConsequences(routeId: RouteId, iceClass: string): Record<string, DynamicConsequenceResult>;
export function getDynamicMitigations(routeId: RouteId, vessel: Vessel): Mitigation[];
```

### Mission Planner View Modes (`app/mission/page.tsx`)
```typescript
export type MissionViewMode = "configure" | "outcome";
```

## Code Layout
- `lib/data.ts` — Enriched baseline routes, waypoints, RIO, ice exposure, and mitigations (M1, M3)
- `components/session/MissionContext.tsx` — Session state, `selectedRouteId` storage persistence, `runSimulation` (M1, M2)
- `app/routes/page.tsx` — Dedicated routes comparison matrix, selected pathway telemetry & waypoints breakdown (M1)
- `app/dashboard/page.tsx` — Dashboard route overview panel, RIO badge, ice exposure, dynamic AI rationale (M1)
- `app/reports/page.tsx` — Reports waypoint schedule dynamic binding (M1)
- `components/mission/SimulationTelemetryHud.tsx` — Telemetry HUD synchronized with active pathway (M1)
- `components/mission/ParameterStepper.tsx` — Stepper summary with unified action trigger (M2)
- `app/mission/page.tsx` — Multi-stage view state machine, 3 unified triggers, vanishing transition, outcome header (M2)
- `lib/riskDetailData.ts`, `app/risk/page.tsx` — Dynamic consequences engine, adaptive mitigations, consequence modals (M3)
- `lib/riskExport.ts` — CSV & JSON telemetry export alignment (M3)
- `tests/*` — Unit, integration, and E2E verification suites (M4)
