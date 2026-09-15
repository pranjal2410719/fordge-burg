# 05 — Technical Requirements / Recreation Specification

Status: COMPLETE — grounded strictly in current source under /home/dev/Desktop/projects/fordge-burg and, only where useful, existing docs under /home/dev/Desktop/projects/fb. design.md, PROJECT.md, ORIGINAL_REQUEST.md, TEST_READY.md, TEST_INFRA.md, and stale .agents files were NOT read or used.
Target: /home/dev/Desktop/projects/fordge-burg (git repo, Linux).
Scope: faithful recreation of the existing static frontend prototype. Everything below is derived from live source files, package.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs, the E2E test suite, and the audit engine helper. Nothing here is invented: every table row, equation, constant, threshold, horizon multiplier, route-ranking weight, POLARIS RIO computation, iceberg projection, hazard severity, mitigation logic, consequence analysis, formatting utility, state field, default, mutator, derived value, page interaction, state transition, SVG map behavior, projection, layer, interaction, settings/report behavior, test command, build/runtime blocker, implementation order, and source traceability row is traceable to a file path and line range.

Where the current codebase deviates from its own tests, the deviation is called out explicitly as a defect. Do not "fix" defects while recreating — this document records observed behavior.


---

## 1. Product Identity and Stack Contract

### 1.1 package.json (verbatim)

```json
{
  "name": "fordge-burg",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "node scripts/e2e-audit.mjs"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.43.0",
    "next": "16.3.4",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

Runtime: Node.js (Linux). Test runner: node:test native, zero external test deps. `npm test` == `node scripts/e2e-audit.mjs` (exit 0/1). `next` is pinned to 16.3.4 — not the Next.js known to most training data. Per AGENTS.md, read node_modules/next/dist/docs/ before writing any Next code.

### 1.2 tsconfig.json (verbatim)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

Path alias `@/*` maps to repo root. strict: true. noEmit: true (Next handles emit).

### 1.3 next.config.ts (verbatim)

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { /* config options here */ };
export default nextConfig;
```

Empty config. No images.domains, no env, no rewrites. App Router only.

### 1.4 eslint.config.mjs (verbatim)

Flat config: eslint/config defineConfig + globalIgnores, applying eslint-config-next/core-web-vitals and eslint-config-next/typescript. Ignores .next/**, out/**, build/**, next-env.d.ts.

### 1.5 postcss.config.mjs (verbatim)

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

Tailwind CSS v4 via @tailwindcss/postcss.

### 1.6 Dependency contract summary

| Package | Version | Used for |
|---|---|---|
| next | 16.3.4 | App Router, next/font, next/navigation |
| react / react-dom | 19.2.8 | UI runtime, Context, hooks |
| lucide-react | ^1.43.0 | Icons (Menu, X, Shield, Fuel, Clock, Compass, etc.) |
| clsx | ^2.1.1 | cn() className merger in src/lib/utils.ts:13 |
| @tailwindcss/postcss | ^4 | Tailwind v4 build pipeline |
| tailwindcss | ^4 | Utility classes |
| typescript | ^5 | Type checking |
| eslint + eslint-config-next | ^9 / 16.3.4 | Linting |

No testing framework, no HTTP client, no map library, no state store, no date library. The entire app is self-contained.


---

## 2. Empty-Folder Blueprint

Create the directory skeleton first, then place files. Do not run npm install until the skeleton exists.

```
fordge-burg/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── dashboard/page.tsx
│   ├── mission/page.tsx
│   ├── environment/page.tsx
│   ├── icebergs/page.tsx
│   ├── hazards/page.tsx
│   ├── vessel/page.tsx
│   ├── routes/page.tsx
│   ├── risk/page.tsx
│   ├── reports/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── PlaceholderPage.tsx
│   │   └── Sidebar.tsx            # MISSING — required, see §9
│   ├── navigation/
│   │   └── SidebarNav.tsx         # MISSING — required, see §9
│   ├── map/
│   │   ├── AntarcticMap.tsx
│   │   └── index.ts
│   ├── session/
│   │   └── MissionSessionProvider.tsx
│   ├── routes/
│   │   ├── RouteCard.tsx
│   │   ├── RouteComparisonTable.tsx
│   │   └── DecisionExplanationCard.tsx
│   ├── risk/
│   │   ├── MitigationChecklist.tsx
│   │   ├── TacticalProtocolsGrid.tsx
│   │   └── ConsequenceAnalysisGrid.tsx
│   └── reports/
│       └── WaypointScheduleTable.tsx
├── src/
│   ├── data/
│   │   ├── index.ts
│   │   ├── vessels.ts
│   │   ├── missions.ts
│   │   ├── icebergs.ts
│   │   ├── hazards.ts
│   │   └── routes.ts
│   ├── simulations/
│   │   ├── index.ts
│   │   ├── engine.ts
│   │   ├── environment.ts
│   │   ├── icebergs.ts
│   │   ├── hazards.ts
│   │   ├── routes.ts
│   │   └── mitigation.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── maritime.ts
│   │   ├── simulation.ts
│   │   └── state.ts
│   └── lib/
│       ├── index.ts
│       ├── constants.ts
│       └── utils.ts
├── public/                      # next.svg, vercel.svg, globe.svg, file.svg, window.svg, favicon.ico
├── scripts/
│   └── e2e-audit.mjs
├── tests/
│   ├── helpers/
│   │   └── audit_engine.mjs
│   ├── automated_code_verification.test.mjs
│   ├── tier1_feature_coverage.test.mjs
│   ├── tier2_boundary_corner.test.mjs
│   ├── tier3_cross_feature.test.mjs
│   ├── tier4_application_scenarios.test.mjs
│   ├── tier5_adversarial_coverage.test.mjs
│   ├── m2_shell_navigation_state.test.mjs
│   └── m5_routes_risk_reports_settings.test.mjs
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
└── eslint.config.mjs
```

Mandatory empty directories to create before any source file: app/, components/{layout,navigation,map,session,routes,risk,reports}/, src/{data,simulations,types,lib}/, public/, scripts/, tests/helpers/.

### 2.1 Exact file tree with line counts (observed)

```
.
├── app/
│   ├── layout.tsx                         # 32 lines
│   ├── globals.css                        # 98 lines
│   ├── page.tsx                           # 255 lines
│   ├── dashboard/page.tsx                 # 419 lines
│   ├── mission/page.tsx                   # 543 lines
│   ├── environment/page.tsx               # 346 lines
│   ├── icebergs/page.tsx                  # 300 lines
│   ├── hazards/page.tsx                   # 381 lines
│   ├── vessel/page.tsx                    # 424 lines
│   ├── routes/page.tsx                    # 241 lines
│   ├── risk/page.tsx                      # 98 lines
│   ├── reports/page.tsx                   # 341 lines
│   └── settings/page.tsx                  # 449 lines
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                   # 126 lines
│   │   ├── PlaceholderPage.tsx            # 22 lines
│   │   └── Sidebar.tsx                    # MISSING — required
│   ├── navigation/
│   │   └── SidebarNav.tsx                 # MISSING — required
│   ├── map/
│   │   ├── AntarcticMap.tsx               # 1506 lines
│   │   └── index.ts                       # 8 lines
│   ├── session/
│   │   └── MissionSessionProvider.tsx     # 448 lines
│   ├── routes/
│   │   ├── RouteCard.tsx                  # 231 lines
│   │   ├── RouteComparisonTable.tsx       # 181 lines
│   │   └── DecisionExplanationCard.tsx    # 141 lines
│   ├── risk/
│   │   ├── MitigationChecklist.tsx        # 191 lines
│   │   ├── TacticalProtocolsGrid.tsx      # 144 lines
│   │   └── ConsequenceAnalysisGrid.tsx    # 221 lines
│   └── reports/
│       └── WaypointScheduleTable.tsx      # 156 lines
└── src/
    ├── data/
    │   ├── index.ts                        # 10 lines
    │   ├── vessels.ts                      # 101 lines
    │   ├── missions.ts                     # 79 lines
    │   ├── icebergs.ts                     # 179 lines
    │   ├── hazards.ts                      # 142 lines
    │   └── routes.ts                       # 128 lines
    ├── simulations/
    │   ├── index.ts                        # 11 lines
    │   ├── engine.ts                       # 152 lines
    │   ├── environment.ts                  # 244 lines
    │   ├── icebergs.ts                     # 68 lines
    │   ├── hazards.ts                      # 186 lines
    │   ├── routes.ts                       # 299 lines
    │   └── mitigation.ts                   # 126 lines
    ├── types/
    │   ├── index.ts                        # 8 lines
    │   ├── maritime.ts                     # 210 lines
    │   ├── simulation.ts                   # 97 lines
    │   └── state.ts                        # 80 lines
    └── lib/
        ├── index.ts                        # 7 lines
        ├── constants.ts                    # 137 lines
        └── utils.ts                        # 230 lines
```


---

## 3. Module Boundary Rules

1. Simulation & Data Engine (src/) — pure, deterministic, client-side. Zero UI coupling. Encapsulates POLARIS RIO, sea-ice growth, iceberg drift, vessel compatibility, multi-objective route optimization.
2. State Management & Shell (components/layout/, components/navigation/, components/session/, src/types/state.ts) — MissionContext/useMission() provider wrapping app/layout.tsx. Synchronizes mission parameters across all 11 pages.
3. Simulated Antarctic Map (components/map/AntarcticMap.tsx) — self-contained SVG. Swappable for Mapbox/Leaflet later without page redesign.
4. Product Pages (app/) — 11 routes, high data density, input/output separation, JetBrains Mono for numbers/coordinates, Inter for labels.
5. E2E Testing Track (tests/, scripts/) — opaque-box verification.

### 3.1 Key architecture patterns

1. All pages are "use client" — every app/*/page.tsx uses client-side rendering.
2. AppShell wraps all pages — every route page wraps its content in <AppShell>{children}</AppShell>.
3. MissionSessionProvider at root — app/layout.tsx wraps entire app in MissionSessionProvider.
4. Simulation is deterministic — same inputs always produce same outputs; no randomness.
5. Type-safe through shared types — all data flows through src/types/ interfaces.
6. Barrel exports at every layer — src/data/index.ts, src/simulations/index.ts, src/types/index.ts, src/lib/index.ts, components/map/index.ts.
7. Path alias — @/* maps to project root for clean imports (e.g., @/components/layout/AppShell).

### 3.2 Build dependency graph

```
app/layout.tsx
└── MissionSessionProvider (from @/components/session/MissionSessionProvider)

components/layout/AppShell.tsx (REQUIRED BY ALL PAGES)
├── Sidebar (from ./Sidebar) ← MISSING — BUILD BLOCKER
└── useMission() (from ../session/MissionSessionProvider)

All 11 route pages
├── AppShell
├── MissionSessionProvider (most pages)
├── AntarcticMap (dashboard, environment, icebergs, hazards, routes)
├── RouteCard, RouteComparisonTable, DecisionExplanationCard (routes page)
├── ConsequenceAnalysisGrid, TacticalProtocolsGrid, MitigationChecklist (risk page)
└── WaypointScheduleTable (reports page)
```


---

## 4. TypeScript Domain Interfaces (src/types/)

### 4.1 src/types/maritime.ts (210 lines) — core domain

**IceClass** (union, 9 members): PC1 | PC2 | PC3 | PC4 | PC5 | PC6 | PC7 | OpenWater.

**PolarCodeCategory**: 'Category A' | 'Category B' | 'Category C'.

**Vessel** (interface):
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| callSign | string | |
| iceClass | IceClass | |
| lengthMeters | number | LOA |
| beamMeters | number | |
| draftMeters | number | |
| openWaterSpeedKnots | number | |
| iceSpeedLimitKnots | number | |
| fuelConsumptionTonsPerDay | number | |
| displacementTons? | number | optional |
| powerKw? | number | optional |
| polarCodeCategory? | PolarCodeCategory | optional |
| iceBeltThicknessMm? | number | optional |
| bowType? | string | optional |

**MissionLocation**: name: string, lat: number, lon: number, description?: string.

**OptimizationPriority**: 'safety' | 'fuel' | 'time' | 'balanced'.

**Mission**: id, name, origin, destination, earliestDeparture: string, priority: OptimizationPriority, description?, distanceNm?.

**SeaIceZone**: id, name, concentration, concentrationTenths, concentrationPercent, stage, thicknessMeters, polygon: [number,number][], driftSpeedKnots?, driftDirectionDeg?.

**SeaIceForecast**: horizonDays: 1|3|7, meanConcentrationTenths, maxThicknessMeters, driftSpeedKnots, driftDirectionDeg, fastIceBoundaryLat, surfaceTempC, windSpeedKnots, windDirectionDeg, waveHeightMeters, zones: Array<{id, name, concentration, stage, polygon, thicknessMeters?, driftSpeedKnots?, driftDirectionDeg?}>.

**IcebergClassification**: 'tabular' | 'pinnacled' | 'wedge' | 'dome' | 'bergy_bit' | 'growler'.

**IcebergTrajectoryPoint**: timeHours, lat, lon, uncertaintyRadiusKm?.

**Iceberg**: id, name, lat, lon, lengthMeters, heightMeters, widthMeters?, draftMeters?, classification?, driftVelocityKnots, driftHeadingDeg, uncertaintyRadiusKm, predictedTrajectory: Array<{timeHours, lat, lon}>, cpaNm?, status?, source?.

**HazardSeverity**: 'low' | 'medium' | 'high' | 'restricted'.

**HazardType**: 'multi_year_ice' | 'pressure_ridge' | 'iceberg_cluster' | 'fast_ice'.

**HazardZoneFactors**: seaIceFactor, icebergDensityFactor, bathymetryFactor, metoceanFactor (all number).

**HazardZone**: id, name, severity, riskScore (0-100), hazardType, description, coordinates: [number,number][], factors?.

**RouteId**: 'shortest' | 'safest' | 'fuel_efficient' | 'balanced'.

**VesselRouteCompatibility**: 'high' | 'moderate' | 'marginal' | 'incompatible'.

**RouteWaypoint**: lat, lon, name?, segmentDistanceNm?, etaHours?, iceConcentrationTenths?.

**RouteAlternative**: id: RouteId, name, priority, tradeOff, distanceNm, etaHours, fuelTons, averageRiskScore, maxRiskScore, iceExposureHours, icebergExposureCount, vesselCompatibility, decisionExplanation, waypoints: [number,number][], iceExposurePercent?, rioScore?, rank?.

**MitigationCategory**: 'speed' | 'standoff' | 'watchkeeping' | 'timing' | 'escort' | 'contingency'.

**MitigationStatus**: 'mandatory' | 'recommended' | 'advisory'.

**RiskMitigation**: id, category, title, description, actionableProtocol, status, riskReductionScore, applicableHazards: string[], applicableVesselClasses?, acknowledged?.

### 4.2 src/types/simulation.ts (97 lines)

- ForecastHorizon = 1 | 3 | 7
- OptimizationPreference = 'balanced' | 'safety' | 'fuel' | 'time'
- MissionSimulationInput { mission, vessel, preference?, horizon? }
- PolarisOperationalStatus = 'Normal Operation' | 'Elevated Risk' | 'Restricted Operation'
- VesselCompatibilityResult { vesselId, vesselName, iceClass, rioScore, operationalStatus, severity, routeCompatibility, escortRequired, speedLimitKnots, complianceNotes: string[], maxSafeIceThicknessMeters }
- BesetmentRiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical'
- ConsequenceAnalysis { besetmentRisk, besetmentProbabilityPercent, delayRiskHours, fuelPenaltyPercent, maneuverabilityIndex, solasReserveMarginPercent, operationalNarrative }
- PolarisSummary { meanRio, minRio, authorized, limitationText, conditions: string[] }
- HazardMapResult { zones, averageRisk, highRiskCount, criticalChokepoints: string[], horizonDays }
- RouteOptimizationResult { routes, recommendedRouteId, preference, comparisonBaselineId: 'shortest' }
- MissionSimulationResult { mission, vessel, horizon, preference, forecast, icebergs, hazardMap, routes, recommendedRoute, vesselCompatibility, mitigations, consequenceAnalysis, polarisSummary, timestamp: string }

### 4.3 src/types/state.ts (80 lines)

- SimulationStatus = 'idle' | 'running' | 'completed'
- MapLayerVisibility { ice, icebergs, hazards, routes } (all boolean)
- UserSettings { unitSystem: 'nautical'|'metric', riskTolerance: 'conservative'|'standard'|'aggressive', mapAutoCenter, soundingsDepthMeters }
- MissionState { mission, vessel, availableVessels, availableMissions, forecastHorizon, optimizationPreference, selectedRouteId, simulationStatus, mapLayers, activeIceberg, settings, simulationResult }
- MissionContextValue extends MissionState adds mutators setVessel, setMission, setForecastHorizon, setOptimizationPreference, setSelectedRoute, toggleMapLayer, setActiveIceberg, updateSettings, runMissionSimulation and derived routes, selectedRoute, seaIceForecast, icebergs, hazardMap, vesselCompatibility, mitigations, consequenceAnalysis, polarisSummary.

### 4.4 Extended context (components/session/MissionSessionProvider.tsx)

The runtime context extends BaseMissionContextValue with:
- selectedMissionId: string
- selectedVesselId: string
- simulationProgress: number
- lastSimulationTimestamp: string | null
- userSettings: UserSettings (alias of settings)
- currentMission: Mission (alias of mission)
- currentVessel: Vessel (alias of vessel)
- setSelectedVesselId, setSelectedMissionId, setSelectedRouteId, setSelectedIcebergId


---

## 5. Library Constants (src/lib/constants.ts, 137 lines)

### 5.1 ANTARCTIC_SECTOR

```ts
export const ANTARCTIC_SECTOR = {
  minLat: -66.5,
  maxLat: -62.0,
  minLon: -64.0,
  maxLon: -54.0,
  latSpan: 4.5,
  lonSpan: 10.0,
} as const;
```

### 5.2 SVG_VIEWBOX

```ts
export const SVG_VIEWBOX = {
  width: 1000,
  height: 650,
} as const;
```

### 5.3 DESIGN_TOKENS (observed — uses CSS variable references, NOT raw hex)

```ts
export const DESIGN_TOKENS = {
  primaryNavy: 'var(--color-primary-navy)',
  accentBlue: 'var(--color-accent-blue)',
  canvas: 'var(--color-canvas)',
  surface: 'var(--color-surface)',
  textMuted: 'var(--color-text-muted)',
  border: 'var(--color-border)',
  riskHigh: 'var(--color-risk-high)',
  riskMed: 'var(--color-risk-med)',
  riskLow: 'var(--color-risk-low)',
  riskRestricted: 'var(--color-risk-high)',
} as const;
```

DEFECT: tests/helpers/audit_engine.mjs:8-18 (CANONICAL_TOKENS) expects raw hex values for these tokens. The observed source uses var(--color-*) references. This is a source-to-test mismatch; record observed behavior, do not "fix".

### 5.4 DEFAULT_MISSION_CONFIG

```ts
export const DEFAULT_MISSION_CONFIG = {
  missionId: 'mission-weddell-transect',
  vesselId: 'vessel-attenborough-pc4',
  horizon: 1 as const,
  preference: 'balanced' as const,
  routeId: 'balanced' as const,
  unitSystem: 'nautical' as const,
  riskTolerance: 'standard' as const,
  mapLayers: {
    ice: true,
    icebergs: true,
    hazards: true,
    routes: true,
  },
} as const;
```

### 5.5 POLARIS_THRESHOLDS

```ts
export const POLARIS_THRESHOLDS = {
  NORMAL_MIN: 0,
  ELEVATED_MIN: -10,
  RESTRICTED_MAX: -10,
} as const;
```

### 5.6 POLARIS_RISK_VALUES (Record<IceClass, RiskValues>)

IMO POLARIS Risk Values (RV) by Vessel Ice Class. RIO = Sum(Ice_Concentration_Tenths * RV). Negative RIO indicates excessive structural risk for ice regime.

| IceClass | multiYearIce | secondYearIce | thickFirstYear | mediumFirstYear | thinFirstYear | openWater |
|---|---|---|---|---|---|---|
| PC1 | 2 | 3 | 3 | 3 | 3 | 3 |
| PC2 | 1 | 2 | 3 | 3 | 3 | 3 |
| PC3 | 0 | 1 | 2 | 3 | 3 | 3 |
| PC4 | -1 | 0 | 1 | 2 | 3 | 3 |
| PC5 | -3 | -2 | 0 | 1 | 2 | 3 |
| PC6 | -4 | -3 | -1 | 0 | 2 | 3 |
| PC7 | -5 | -4 | -2 | -1 | 1 | 3 |
| OpenWater | -8 | -7 | -5 | -4 | -2 | 3 |

Source: src/lib/constants.ts:62-137.


---

## 6. Library Utilities (src/lib/utils.ts, 230 lines)

### 6.1 cn(...inputs: ClassValue[]): string
Standard Tailwind ClassName Merging Utility. Delegates to clsx.

### 6.2 formatCoordinates(lat, lon, format: 'DMS' | 'DD' = 'DMS'): string
- DD: `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}` where dir is N/S or E/W.
- DMS: converts each coordinate to Degrees Minutes Seconds with 2-digit zero-padded minutes and seconds, direction suffix. Handles sec===60 and min===60 carry.

### 6.3 formatKnots(speed, decimals = 1): string => `${speed.toFixed(decimals)} kn`

### 6.4 formatNauticalMiles(distance, decimals = 0): string => `${distance.toFixed(decimals)} NM`

### 6.5 formatPercentage(value, decimals = 1): string => `${value.toFixed(decimals)}%`

### 6.6 formatFuelTons(tons, decimals = 1): string => `${tons.toFixed(decimals)} MT`

### 6.7 formatHours(hours, decimals = 1): string => `${hours.toFixed(decimals)} hrs`

### 6.8 getRiskColor(riskScore): string
Map 0-100 risk score to CSS variable color token:
- <35 => DESIGN_TOKENS.riskLow
- <65 => DESIGN_TOKENS.riskMed
- <85 => DESIGN_TOKENS.riskHigh
- else => DESIGN_TOKENS.riskRestricted

### 6.9 getRiskBadgeClass(riskScore): string
- <35 => 'bg-risk-low/10 text-risk-low border-risk-low/30'
- <65 => 'bg-risk-med/10 text-risk-med border-risk-med/30'
- <85 => 'bg-risk-high/10 text-risk-high border-risk-high/30'
- else => 'bg-risk-high/20 text-risk-high border-risk-high font-semibold'

### 6.10 getSeverityColor(severity: HazardSeverity): string
low => riskLow, medium => riskMed, high => riskHigh, restricted => riskRestricted.

### 6.11 getSeverityBadgeClass(severity): string
low => 'bg-risk-low/10 text-risk-low border-risk-low/30', medium => 'bg-risk-med/10 text-risk-med border-risk-med/30', high => 'bg-risk-high/10 text-risk-high border-risk-high/30', restricted => 'bg-risk-high/20 text-risk-high border-risk-high font-semibold'.

### 6.12 getRiskTextColor(riskScore): string
- <35 => 'text-risk-low', <65 => 'text-risk-med', else => 'text-risk-high'.

### 6.13 getSeverityTextColor(severity): string
low/medium => respective, high/restricted => 'text-risk-high'.

### 6.14 getRiskSvgClasses(riskScore): { fill, stroke }
- <35 => { fill: 'fill-risk-low', stroke: 'stroke-risk-low' }
- <65 => { fill: 'fill-risk-med', stroke: 'stroke-risk-med' }
- else => { fill: 'fill-risk-high', stroke: 'stroke-risk-high' }

### 6.15 calculateHaversineDistanceNm(lat1, lon1, lat2, lon2): number
Great-circle distance in Nautical Miles. R_NM = 3440.065. Standard haversine formula.

### 6.16 coordToSvg(lat, lon, viewBoxWidth = 1000, viewBoxHeight = 650): { x, y }
Equirectangular projection over ANTARCTIC_SECTOR:
- x = ((lon - minLon) / lonSpan) * viewBoxWidth
- y = ((maxLat - lat) / latSpan) * viewBoxHeight
- clamped to [0, viewBoxWidth] and [0, viewBoxHeight]

DEFECT: components/map/AntarcticMap.tsx:47-54 has a second, slightly different coordToSvg implementation that rounds to 1 decimal (Math.round(x*10)/10). Two implementations of the same conceptual function exist.

---

## 7. Datasets and Counts

All datasets live in src/data/. Counts are exact (verified by reading the source files).

| File | Lines | Export | Count | IDs |
|---|---|---|---|---|
| vessels.ts | 101 | VESSELS, DEFAULT_VESSEL, getVesselById | 5 | vessel-charcot-pc2, vessel-polarstern2-pc2, vessel-attenborough-pc4, vessel-agulhas2-pc5, vessel-navigator-openwater |
| missions.ts | 79 | MISSIONS, DEFAULT_MISSION, getMissionById | 3 | mission-weddell-transect, mission-palmer-supply, mission-ross-survey |
| icebergs.ts | 179 | ICEBERGS, getIcebergById | 8 | IB-A68A-01, IB-A74-02, IB-B30-03, IB-C28-04, IB-D15-05, IB-E09-06, IB-GW-07, IB-GW-08 |
| hazards.ts | 142 | HAZARDS, getHazardById | 6 | HAZ-SOUND-01, HAZ-JOINVILLE-02, HAZ-WEDDELL-03, HAZ-FASTICE-04, HAZ-EREBUS-05, HAZ-BRANSFIELD-06 |
| routes.ts | 128 | BASELINE_ROUTES, DEFAULT_ROUTE, getRouteById | 4 | shortest, safest, fuel_efficient, balanced |


### 7.1 Vessel dataset (src/data/vessels.ts, 101 lines)

| id | name | callSign | iceClass | LOA | beam | draft | openWaterKn | iceSpeedLimitKn | fuelMT/day | displacement | powerKw | polarCat | iceBeltMm | bowType |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| vessel-charcot-pc2 | Le Commandant Charcot | FLHL | PC2 | 150.0 | 28.0 | 10.0 | 15.0 | 9.0 | 35.0 | 31757 | 34000 | Category A | 55 | Reinforced PC2 Icebreaking Stem with Cleaver Azipods |
| vessel-polarstern2-pc2 | Polarstern II | DBLK | PC2 | 148.0 | 27.5 | 10.5 | 14.5 | 8.5 | 38.0 | 26000 | 32000 | Category A | 52 | Heavy Double-Acting Icebreaking Hull with Milling Reamers |
| vessel-attenborough-pc4 | RRS Sir David Attenborough | ZDLP8 | PC4 | 128.0 | 24.0 | 7.8 | 13.0 | 6.5 | 28.0 | 15600 | 16000 | Category A | 42 | Continuous Level Icebreaker (1.2m at 3.0 kts) |
| vessel-agulhas2-pc5 | SA Agulhas II | ZR2853 | PC5 | 134.2 | 21.7 | 7.65 | 14.0 | 5.0 | 24.0 | 12897 | 12000 | Category B | 32 | Medium First-Year Icebreaking Stem (1.0m ice) |
| vessel-navigator-openwater | MV Antarctic Navigator | V7AZ9 | OpenWater | 105.0 | 16.5 | 5.4 | 12.5 | 2.0 | 16.0 | 6200 | 4800 | Category C | 16 | Conventional Bulbous Bow (Open Water Only) |

DEFAULT_VESSEL = VESSELS[2] (RRS Sir David Attenborough, PC4).
getVesselById(id) returns found ?? DEFAULT_VESSEL.

### 7.2 Mission dataset (src/data/missions.ts, 79 lines)

| id | name | origin | destination | earliestDeparture | priority | distanceNm |
|---|---|---|---|---|---|---|
| mission-weddell-transect | Weddell Sea Science Transect | Maxwell Bay / Frei Base (-62.20, -58.95) | Weddell Sea Outpost Alpha (-65.50, -56.00) | 2026-11-15T06:00:00Z | balanced | 445 |
| mission-palmer-supply | Palmer Station Supply Run | Maxwell Bay / Frei Base (-62.20, -58.95) | Palmer Station, Anvers Island (-64.77, -64.05) | 2026-11-20T08:00:00Z | safety | 320 |
| mission-ross-survey | Ross Sea Marine Survey | Cape Adare Staging Area (-63.00, -62.50) | Larsen Ice Shelf Margin (-66.10, -60.80) | 2026-12-01T04:00:00Z | fuel | 390 |

DEFAULT_MISSION = MISSIONS[0]. getMissionById(id) returns found ?? DEFAULT_MISSION.

### 7.3 Baseline route metrics (src/data/routes.ts, 128 lines, before simulation adjustment)

| Route | Distance (NM) | ETA (hrs) | Fuel (MT) | Avg Risk | Max Risk | Ice % | Icebergs | Compatibility | RIO | Rank |
|---|---|---|---|---|---|---|---|---|---|---|
| shortest | 412 | 38.5 | 48.2 | 74 | 88 | 58 | 9 | marginal | -4.2 | 3 |
| safest | 528 | 44.0 | 51.5 | 22 | 36 | 8 | 1 | high | 14.5 | 2 |
| fuel_efficient | 458 | 41.6 | 39.8 | 45 | 54 | 24 | 4 | high | 6.8 | 4 |
| balanced | 445 | 37.1 | 42.9 | 31 | 42 | 19 | 2 | high | 11.2 | 1 |

---

## 8. Simulation Behavior Contract

### 8.1 Horizon handling

Every simulation entry point normalizes its horizon with:

```ts
const h: ForecastHorizon = horizon === 3 || horizon === 7 ? horizon : 1;
```

Observed in `environment.ts:10`, `icebergs.ts:10`, `hazards.ts:18`, `routes.ts:82`, and `engine.ts:30`. Unsupported horizon values therefore collapse to the 1-day behavior.

Forecast horizons:

| Horizon | Elapsed model hours | Iceberg uncertainty multiplier | Hazard escalation multiplier | Route risk multiplier |
|---|---|---|---|---|
| 1 | 24 | 1.0 | 1.0 | 1.0 |
| 3 | 72 | 2.2 | 1.1 | 1.08 |
| 7 | 168 | 4.8 | 1.22 | 1.18 |

### 8.2 Sea-ice forecast

`generateSeaIceForecast(horizon)` returns one of three hardcoded deterministic forecast objects. Each contains aggregate metocean values and four spatial zones. Baseline 1-day means include 4.2 tenths concentration and 1.1 m maximum thickness; longer horizons use higher hardcoded concentration, thickness, drift, wind, and wave values.

### 8.3 Iceberg projection

For each iceberg:

```text
distanceNm = driftVelocityKnots × elapsedHours
deltaLat = distanceNm × cos(heading) / 60
deltaLon = distanceNm × sin(heading) / (60 × |cos(midLat)|)
uncertaintyRadiusKm = baseUncertaintyKm × horizonUncertaintyMultiplier
CPA = max(0.5, baseCPA - (horizonDays - 1) × 0.4)
```

A forward 72-hour trajectory is also generated at 12-hour intervals from the projected position.

### 8.4 Hazard fusion and POLARIS compatibility

Hazard scores are scaled by horizon, clamped to 100, and reclassified:

```text
adjustedScore >= 85 → restricted
adjustedScore >= 65 → high
adjustedScore >= 35 → medium
otherwise → low
```

Average risk is the rounded mean. High-risk count includes `high` and `restricted`. Critical chokepoints are zones with risk score 75 or higher.

POLARIS compatibility:

```text
concentrationTenths = clamp(riskScore / 10, 1, 10)
openWaterTenths = 10 - concentrationTenths
zoneRIO = concentrationTenths × ice-class RV + openWaterTenths × open-water RV
importanceWeight = 1 + riskScore / 50
RIO = weighted mean of zone RIO values
```

Status mapping uses `POLARIS_THRESHOLDS.NORMAL_MIN = 0` and `ELEVATED_MIN = -10`:

- `RIO >= 0`: Normal Operation, high compatibility, no escort, vessel ice-speed limit
- `RIO >= -10`: Elevated Risk, moderate compatibility, no escort, throttled speed
- `RIO < -10`: Restricted Operation, marginal or incompatible, escort required, maximum 2.5 kn

Maximum safe ice thickness is an ice-class lookup, not a continuous function of RIO.

### 8.5 Route generation and ranking

Route generation:

1. Starts from the four baseline alternatives.
2. Applies vessel risk and ice-speed multipliers.
3. Applies horizon escalation.
4. Recomputes average/maximum risk, ETA, fuel, compatibility, route RIO, and explanations.
5. Enforces:
   - safest average risk below shortest average risk when violated;
   - shortest distance as the minimum, repairing other distances to `shortest + 20`;
   - fuel-efficient fuel as the minimum, repairing other fuel values to `fuel + 2.5`.
6. Assigns preference-weighted ranks using normalized risk, fuel, time, and distance.
7. Returns routes in canonical order with populated ranks.

Route RIO is vessel-class-specific. PC3, PC6, PC7, and several other classes fall through to the implementation’s final `else` branch.

### 8.6 Mitigations and consequence synthesis

Mitigation generation always returns the same seven records. Only selected statuses and the OpenWater escort protocol vary with route risk and vessel class.

Consequence values are ice-class-keyed constants in both the provider and engine. The SOLAS reserve margin is fixed at 28.4. The POLARIS summary derives authorization text from vessel compatibility and selected-route RIO.

---

## 9. Context, Pages, Map, Settings, and Reports

### 9.1 Mission context

`MissionSessionProvider` initializes:

- selected mission and vessel IDs
- forecast horizon `1`
- optimization preference `balanced`
- selected route `balanced`
- simulation status `idle` and progress `0`
- all map layers enabled
- no active iceberg
- nautical/standard/centered/50 m settings

It exposes the 13 observed mutators and the derived simulation values listed in section 4.4. `runMissionSimulation` advances progress at 300, 700, and 1200 ms, stores an ISO timestamp, and saves a full `generateMissionSimulation` snapshot.

### 9.2 Pages and components

All 11 route pages use `AppShell`. Observed component placement:

- `components/routes/DecisionExplanationCard.tsx` is consumed by the routes page.
- `components/reports/WaypointScheduleTable.tsx` is consumed by the reports page.
- Risk components are consumed by the risk page.
- `AntarcticMap` is consumed by dashboard, environment, icebergs, hazards, and routes pages.

The map uses equirectangular linear projection over 62.0°S–66.5°S and 54.0°W–64.0°W onto a 1000×650 SVG viewBox. It supports Ice, Icebergs, Hazards, and Routes layers, horizon selection, iceberg selection, route selection, cursor telemetry, legend, and scale/telemetry displays.

Settings are stored only in React memory. Unit-system, risk-tolerance, auto-center, soundings-depth, and coordinate-format controls do not all propagate to formatting, simulation, or map behavior.

Reports are client-rendered. Export uses `window.print()`. Document reference, timestamp, and status are hardcoded; only the first five of seven mitigations are displayed.

### 9.3 Shell blocker

`AppShell.tsx:12` imports missing `components/layout/Sidebar.tsx` and renders it for desktop and mobile layouts. `components/navigation/` exists but is empty. This blocks module resolution for every page using `AppShell`.

---

## 10. Verification Contract

- `npm test` runs `node scripts/e2e-audit.mjs`.
- The runner executes 9 inline AC checks plus tier 1–5 and automated code verification.
- It does not execute `m2_shell_navigation_state.test.mjs` or `m5_routes_risk_reports_settings.test.mjs`.
- Observed `npm test`: **117 checks/tests, 98 passed, 19 failed**.
- Direct all-on-disk inventory: **136 tests, 116 passed, 20 failed**.
- Exact direct-inventory failures:
  - AC1, AC2, AC3, AC6
  - M2.5, M2.6, M2.7, M2.8
  - M5.18
  - Tier 1 Features 2.1–2.6, 6.1, 6.4, 6.6
  - Tier 5.1b and 5.4

---

## 11. Implementation Order

1. Recreate package, TypeScript, Next.js, ESLint, and PostCSS contracts.
2. Recreate domain, simulation, state, constants, and utility modules.
3. Recreate static datasets with exact IDs and counts.
4. Recreate deterministic simulation functions and engine block order.
5. Recreate the mission context, defaults, mutators, and derived values.
6. Recreate the SVG map, projection, layers, and interactions.
7. Recreate all 11 pages and shared components in their observed locations.
8. Recreate the shell, including the missing Sidebar dependency as an explicit blocker.
9. Recreate settings/report behavior, including unwired controls and hardcoded report fields.
10. Recreate the test runner and all on-disk suites.
11. Verify the reconciled npm-test and direct-inventory totals.

---

## 12. Source Traceability

| Area | Primary source |
|---|---|
| Package and scripts | `package.json` |
| Root layout and provider | `app/layout.tsx`, `components/session/MissionSessionProvider.tsx` |
| Shell and blocker | `components/layout/AppShell.tsx`, absent `components/layout/Sidebar.tsx`, empty `components/navigation/` |
| Routes | All 11 `app/*/page.tsx` files |
| Route components | `components/routes/*` |
| Risk components | `components/risk/*` |
| Report table | `components/reports/WaypointScheduleTable.tsx` |
| Map | `components/map/AntarcticMap.tsx`, `components/map/index.ts` |
| Domain/data | `src/data/*`, `src/types/*` |
| Simulation | `src/simulations/*` |
| Constants/utilities | `src/lib/constants.ts`, `src/lib/utils.ts` |
| Tests | `tests/*.test.mjs`, `tests/helpers/audit_engine.mjs`, `scripts/e2e-audit.mjs` |

Status: COMPLETE — source-grounded technical recreation specification.