# fordgeBurg Recreation Guide

Status: COMPLETE — functionality-only recreation blueprint. Excluded as authorities: `design.md`, `PROJECT.md`, `ORIGINAL_REQUEST.md`, `TEST_READY.md`, `TEST_INFRA.md`, and stale `.agents` material.

Target source: `/home/dev/Desktop/projects/fordge-burg`.

## 0. What to recreate

Recreate a static, client-rendered Next.js prototype with:

- 11 App Router pages
- One global React mission context
- Deterministic local simulation over static datasets
- Self-contained SVG Antarctic map
- Browser-print mission report
- Existing test runner and on-disk suites
- Current defects, especially the missing Sidebar module

Do not add a backend, database, API, authentication, persistence, live data feeds, map-tile service, or vessel-control capability. Those are absent from the observed source.

## 1. Stack and config contract

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

TypeScript uses `@/*` mapped to the repository root, strict mode, `jsx: react-jsx`, and `noEmit`. Next.js config is effectively empty. ESLint uses the flat Next.js config. PostCSS uses Tailwind CSS v4.

## 2. File tree to create

```text
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
│   │   └── PlaceholderPage.tsx
│   ├── navigation/
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
│   │   ├── ConsequenceAnalysisGrid.tsx
│   │   ├── MitigationChecklist.tsx
│   │   └── TacticalProtocolsGrid.tsx
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
├── public/
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
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
└── eslint.config.mjs
```

Important structural facts:

- `components/navigation/` exists but contains no files.
- `components/layout/Sidebar.tsx` is absent although imported by `AppShell.tsx:12`.
- `components/layout/PlaceholderPage.tsx` exists but is not consumed by any route.
- `components/routes/DecisionExplanationCard.tsx` belongs to routes, not risk.
- `components/reports/WaypointScheduleTable.tsx` is consumed by reports, not routes.

## 3. Datasets

| Dataset | Count | IDs |
|---|---|---|
| Vessels | 5 | `vessel-charcot-pc2`, `vessel-polarstern2-pc2`, `vessel-attenborough-pc4`, `vessel-agulhas2-pc5`, `vessel-navigator-openwater` |
| Missions | 3 | `mission-weddell-transect`, `mission-palmer-supply`, `mission-ross-survey` |
| Icebergs | 8 | `IB-A68A-01`, `IB-A74-02`, `IB-B30-03`, `IB-C28-04`, `IB-D15-05`, `IB-E09-06`, `IB-GW-07`, `IB-GW-08` |
| Hazards | 6 | `HAZ-SOUND-01`, `HAZ-JOINVILLE-02`, `HAZ-WEDDELL-03`, `HAZ-FASTICE-04`, `HAZ-EREBUS-05`, `HAZ-BRANSFIELD-06` |
| Routes | 4 | `shortest`, `safest`, `fuel_efficient`, `balanced` |

Defaults:

- Mission: `mission-weddell-transect`
- Vessel: `vessel-attenborough-pc4`
- Horizon: `1`
- Preference: `balanced`
- Route: `balanced`
- Settings: nautical, standard, auto-center enabled, 50 m soundings depth
- Map layers: all enabled

## 4. Simulation contract

Engine order in `src/simulations/engine.ts`, including eight labeled blocks plus route-recommendation selection:

1. Sea-ice forecast
2. Iceberg trajectories
3. Hazard map
4. Vessel compatibility
5. Route alternatives
6. Recommended-route selection
7. Mitigations
8. Consequence synthesis
9. POLARIS executive summary

Horizon normalization:

```ts
const h: ForecastHorizon = horizon === 3 || horizon === 7 ? horizon : 1;
```

Key multipliers:

| Horizon | Iceberg uncertainty | Hazard escalation | Route risk escalation |
|---|---|---|---|
| 1 | 1.0 | 1.0 | 1.0 |
| 3 | 2.2 | 1.1 | 1.08 |
| 7 | 4.8 | 1.22 | 1.18 |

Route ranking weights:

| Preference | Risk | Fuel | Time | Distance |
|---|---|---|---|---|
| balanced | 0.35 | 0.35 | 0.20 | 0.10 |
| safety | 0.85 | 0.05 | 0.05 | 0.05 |
| fuel | 0.05 | 0.85 | 0.05 | 0.05 |
| time | 0.05 | 0.05 | 0.85 | 0.05 |

Mitigations always number seven. Consequence values are ice-class-keyed constants; SOLAS reserve margin is fixed at 28.4.

## 5. State, pages, map, settings, and reports

Recreate `MissionSessionProvider` with:

- mission/vessel IDs, horizon, preference, selected route
- simulation status/progress/timestamp/result
- map layers, active iceberg, settings
- 13 observed mutators
- derived forecast, trajectories, hazards, compatibility, routes, mitigations, consequence, and POLARIS summary
- timed 0/40/80/100 progress over approximately 1.2 seconds
- no persistence

Recreate all 11 pages through `AppShell`. Recreate the equirectangular SVG map with Ice, Icebergs, Hazards, and Routes controls, horizon selection, iceberg selection, route selection, cursor telemetry, legend, and scale/telemetry displays.

Preserve settings limitations:

- unit selection does not change formatting utilities;
- risk tolerance does not affect route generation;
- auto-center and soundings depth do not affect the map;
- coordinate format remains local to Settings;
- departure datetime remains local to Mission and is not passed to simulation.

Preserve report behavior:

- client-rendered document;
- `window.print()` export;
- hardcoded document reference, timestamp, and status;
- first five of seven mitigations displayed;
- static signature placeholders.

## 6. Shell blocker

Recreate the observed broken dependency exactly:

- `AppShell.tsx:12` imports `./Sidebar`.
- `components/layout/Sidebar.tsx` is absent.
- `components/navigation/` is empty.
- Desktop and mobile shell paths both require the missing module.

For a runnable rebuild, a Sidebar implementation would additionally need to satisfy the six-group navigation contract asserted by the tests. That implementation does not exist in the observed source.

## 7. Verification

`npm test` executes:

- 9 inline AC checks
- tier 1–5
- automated code verification

It does not execute `m2` or `m5`.

Observed `npm test`:

- **117 checks/tests**
- **98 passed**
- **19 failed**

Direct all-on-disk inventory:

- **136 tests**
- **116 passed**
- **20 failed**

Exact direct-inventory failures:

- AC1, AC2, AC3, AC6
- M2.5, M2.6, M2.7, M2.8
- M5.18
- Tier 1 Features 2.1–2.6, 6.1, 6.4, 6.6
- Tier 5.1b and 5.4

Failure groups:

- Missing Sidebar/navigation implementation
- Token/class/font expectations asserted by the existing test contract
- Hardcoded color and styling-class findings reported by the audit

## 8. Rebuild checklist

1. Recreate stack and config files.
2. Recreate types, constants, utilities, datasets, and simulations.
3. Recreate context state and derivation behavior.
4. Recreate map projection, layers, and interactions.
5. Recreate pages and components in observed locations.
6. Preserve the missing Sidebar blocker.
7. Preserve settings/report limitations.
8. Recreate test runner and all eight on-disk suites.
9. Reconcile `npm test` and direct-inventory totals.
10. Confirm fixed domain counts and component placement.
