# Project: Fordge-Burg Frontend UI/UX Polish & Feature Enhancements

## Architecture
- **Framework**: Next.js 15.1.6 App Router, React 19.0.0, TypeScript 5.
- **Styling**: Tailwind CSS v4 configured via `@theme` design tokens in `app/globals.css`. Custom polar nautical design language with Navy, Accent Blue, and Risk tri-color palettes.
- **Visualizations**: Native SVG rendering (no external charting dependencies for React 19 safety, instant hydration, and custom cartographic fidelity).
- **State Management**: React Context (`MissionProvider` in `components/session/MissionContext.tsx`) + `localStorage` persistence for application settings.
- **Component Layout**: Global responsive `AppShell` with sticky `Sidebar`, Topbar breadcrumbs & mission status, and dedicated feature views.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Baseline Type Fix & Test Harness | Fix TS2367 in `app/dashboard/page.tsx:93` and configure test harness with `npm test` script | M1 | Survey 1, 2, 3 |
| 2 | R1: 8-Engine-Block Simulation Pipeline | Interactive 8-stage visual calculation pipeline animation during simulation runs | M2 | R1, Survey 2 |
| 3 | R1: Live Computation Telemetry HUD | Real-time streaming calculation log & telemetry HUD during simulation execution | M2 | R1, Survey 2 |
| 4 | R1: Simulation Preview Map & Path Trace | Embedded polar map visual with animated route tracing & hazard avoidance preview | M2 | R1, Survey 2 |
| 5 | R1: Dynamic Parameter Stepper & Reveal | Interactive top stepper with validation badges and staggered animated route alternative reveal cards | M2 | R1, Survey 2 |
| 6 | R2: Native SVG Risk Data Visualizations | Waypoint Risk Exposure Area/Bar chart, Multi-Factor Consequence Radar Diagram, and Route Alternatives Risk Comparison | M3 | R2, Survey 3 |
| 7 | R2: Advanced Filtering & Sorting | Status filter pills, Acknowledgment state filters, text search, and priority sorting for mitigations | M3 | R2, Survey 3 |
| 8 | R2: Telemetry Data Export | One-click CSV, JSON, and Print export handlers for route risks and mitigations | M3 | R2, Survey 3 |
| 9 | R2: Consequence & Mitigation Modals | Accessible modal dialogs for consequence factor decomposition and mitigation SOP / Polar Code regulations | M3 | R2, Survey 3 |
| 10 | R3: Simulation Configuration Options | Monte Carlo run iterations, simulation speed time step, dynamic ice drift model toggle, uncertainty margin, and auto-resimulate | M4 | R3, Survey 3 |
| 11 | R3: Alert & Notification Preferences | Iceberg CPA standoff slider, besetment probability alert threshold, hazard zone entry warning, severe wind warning, and audio chimes | M4 | R3, Survey 3 |
| 12 | R3: Persistent Storage & Reset | Sync settings to `localStorage` with SSR fallback and working "Reset Defaults" action | M4 | R3, Survey 3 |
| 13 | R4: Hero KPI Metric Strip | 4-card KPI metric strip (Monitored Zones, Critical Hotspots, Average Sector Risk, Vessel Hull Vulnerability) | M5 | R4, Survey 2 |
| 14 | R4: Interactive Spatial Hazard Map | Embedded Antarctic spatial hazard map showing polygon boundaries, centroids, and route intersection corridors | M5 | R4, Survey 2 |
| 15 | R4: Severity Filtering, Search & Sorting | Severity filter chips with dynamic counts, keyword search bar, and multi-field sorting | M5 | R4, Survey 2 |
| 16 | R4: Polar Code Vessel Impact Indicators | Connect to `useMission()` to render vessel ice class vulnerability and operational restrictions per zone | M5 | R4, Survey 2 |
| 17 | E2E & Full Verification | Comprehensive unit & integration test suites passing, build verification, Challenger stress testing, and clean Auditor verification | M6 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Baseline Fix & Test Infrastructure | Fix typecheck bug in `app/dashboard/page.tsx:93` and add automated test runner for utility & data validation | none | DONE |
| M2 | R1: Mission Planner Enhancements | 8-block simulation animation, telemetry HUD, simulation map preview, and staggered results reveal | M1 | PLANNED |
| M3 | R2: Risk Tab Functionality | Native SVG charts, advanced filtering/sorting, CSV/JSON/Print export, and detailed breakdown modals | M1 | PLANNED |
| M4 | R3: Settings Page Redesign | Simulation configuration options, alert preferences, and persistent storage synchronization | M1 | PLANNED |
| M5 | R4: Hazard Page Redesign | Hero KPI strip, interactive spatial Antarctic hazard map, severity filters/search, and vessel impact indicators | M1 | PLANNED |
| M6 | Integration & Verification Hardening | Full test suite execution, Next.js production build, Challenger verification, and Forensic Audit | M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### `MissionContext.tsx`
```typescript
export type SimulationStatus = "idle" | "running" | "completed";

export interface SimulationConfig {
  fidelity: "fast" | "balanced" | "high";
  monteCarloRuns: number;
  timeStepSpeed: "1x" | "5x" | "10x";
  dynamicIceDrift: boolean;
  uncertaintyMarginPct: number;
  autoResimulate: boolean;
}

export interface AlertPreferences {
  icebergMinCpaNm: number;
  besetmentAlertThreshold: number;
  hazardZoneWarning: boolean;
  severeMetoceanAlert: boolean;
  audioChimes: boolean;
}
```

### Risk & Modal Types (`lib/data.ts`)
```typescript
export interface ConsequenceDetail {
  key: string;
  label: string;
  score: number;
  value: string;
  level: "LOW" | "MODERATE" | "HIGH";
  factors: { name: string; score: number; impact: string }[];
  historicalComparison: string;
  preventionActions: string[];
  polarCodeClause: string;
}

export interface WaypointRiskPoint {
  id: string;
  name: string;
  lat: string;
  lon: string;
  distNm: number;
  iceConc: number;
  riskScore: number;
  besetmentRisk: number;
}
```

## Code Layout
- `app/mission/page.tsx` — Mission Planner UI, simulation pipeline, telemetry HUD, preview map (Owned by M2 Worker)
- `app/risk/page.tsx`, `components/risk/*` — Risk Tab UI, charts, filtering, modals, exports (Owned by M3 Worker)
- `app/settings/page.tsx`, `lib/settings.ts` — Settings page redesign, simulation configs, alert preferences (Owned by M4 Worker)
- `app/hazards/page.tsx` — Hazard page redesign, KPI strip, spatial map, search/filter (Owned by M5 Worker)
- `app/dashboard/page.tsx` — Line 93 typecheck fix (Owned by M1 Worker)
- `tests/*` — Unit and integration test suites (Owned by M1 & M6 Workers)
