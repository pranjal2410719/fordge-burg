# 07 — Source Map

## Identity

- Display brand: `fordgeBurg`
- npm package: `fordge-burg`, version `0.1.0`, private
- Source: `/home/dev/Desktop/projects/fordge-burg`
- Stack: Next.js 16.3.4 App Router, React 19.2.8, TypeScript 5, Tailwind CSS v4
- Nature: static client prototype with deterministic local simulation

## Routes

All 11 route files exist under `app/`:

- `app/page.tsx` — landing page with keyword routing and quick links
- `app/dashboard/page.tsx` — mission KPIs, vessel summary, and map
- `app/mission/page.tsx` — mission/vessel/horizon/preference controls and simulation trigger
- `app/environment/page.tsx` — sea-ice and metocean views
- `app/icebergs/page.tsx` — eight-target catalog and inspection panel
- `app/hazards/page.tsx` — six-zone hazard matrix and inspector
- `app/vessel/page.tsx` — five-vessel selector and POLARIS evaluation
- `app/routes/page.tsx` — four route cards, rationale, comparison table, and map
- `app/risk/page.tsx` — consequence analysis, mitigations, and protocols
- `app/reports/page.tsx` — client-rendered printable report
- `app/settings/page.tsx` — in-memory preferences

Every page component uses `AppShell`.

## Layout shell

- `app/layout.tsx` — server root layout; mounts client `MissionSessionProvider`
- `components/layout/AppShell.tsx` — persistent shell, topbar, mobile drawer, authority banner
- `components/layout/Sidebar.tsx` — absent; imported by `AppShell.tsx:12`
- `components/navigation/` — exists but contains no files
- `components/layout/PlaceholderPage.tsx` — exists but unused

## Components

### Map

- `components/map/AntarcticMap.tsx` — self-contained equirectangular SVG map, 1000×650 viewBox
- `components/map/index.ts` — barrel exporting map component and coordinate helpers
- Consumed by dashboard, environment, icebergs, hazards, and routes pages

### Routes

- `components/routes/RouteCard.tsx` — selectable route alternative
- `components/routes/RouteComparisonTable.tsx` — side-by-side route metrics
- `components/routes/DecisionExplanationCard.tsx` — selected-route rationale
- Consumed by the routes page

### Risk

- `components/risk/ConsequenceAnalysisGrid.tsx`
- `components/risk/MitigationChecklist.tsx`
- `components/risk/TacticalProtocolsGrid.tsx`
- Consumed by the risk page

### Reports

- `components/reports/WaypointScheduleTable.tsx`
- Consumed by the reports page

### Session

- `components/session/MissionSessionProvider.tsx`
- Exports `MissionSessionProvider`, `MissionProvider`, `useMission`, and `useSimulationSession`
- Mounted by the root layout and consumed by all operational pages and `AppShell`

## Types

- `src/types/maritime.ts` — vessels, missions, icebergs, hazards, routes, mitigations
- `src/types/simulation.ts` — forecast horizon, preference, compatibility, consequence, POLARIS, hazard map, simulation result
- `src/types/state.ts` — mission state, context value, settings, map layers, simulation status
- `src/types/index.ts` — barrel export

## Data

| File | Count |
|---|---|
| `src/data/vessels.ts` | 5 |
| `src/data/missions.ts` | 3 |
| `src/data/icebergs.ts` | 8 |
| `src/data/hazards.ts` | 6 |
| `src/data/routes.ts` | 4 |

`src/data/index.ts` is the barrel export.

## Simulations

- `src/simulations/environment.ts` — `generateSeaIceForecast`
- `src/simulations/icebergs.ts` — `generateIcebergTrajectories`
- `src/simulations/hazards.ts` — `generateHazardMap`, `calculateVesselCompatibility`
- `src/simulations/routes.ts` — `generateRoutes`, `generateDecisionExplanation`
- `src/simulations/mitigation.ts` — `generateMitigationRecommendation`, always seven records
- `src/simulations/engine.ts` — `generateMissionSimulation`, eight labeled sequential blocks
- `src/simulations/index.ts` — barrel export

## Libraries

- `src/lib/constants.ts` — sector bounds, SVG viewBox, token references, defaults, POLARIS thresholds and risk values
- `src/lib/utils.ts` — coordinate formatting, maritime formatting, Haversine distance, alternate `coordToSvg`
- `src/lib/index.ts` — barrel export

There are two `coordToSvg` implementations: clamped in `src/lib/utils.ts` and rounded in `components/map/AntarcticMap.tsx`.

## Config and assets

- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`
- `app/globals.css`
- `app/favicon.ico`
- `public/` static assets
- `scripts/e2e-audit.mjs`
- `tests/helpers/audit_engine.mjs`
- Eight on-disk `.test.mjs` suites

## Missing, dead, and duplicated paths

- Missing: `components/layout/Sidebar.tsx`
- Empty: `components/navigation/`
- Unused: `components/layout/PlaceholderPage.tsx`
- Duplicated projection concern: `coordToSvg` in utils and map component
- Overlapping formatting concern: `formatCoordinates` in utils and `formatDMS` in map component

## Architecture pattern

```text
app/layout.tsx
└── MissionSessionProvider
    └── route pages
        └── AppShell
            └── missing Sidebar
                ├── topbar and mobile drawer
                └── page content
```

```text
static datasets
└── deterministic simulations
    └── mission context derivation
        ├── pages
        ├── map
        └── report
```
