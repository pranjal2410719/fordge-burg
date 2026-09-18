# Handoff Report: Requirement R1 Investigation — Dynamic Route Overview Across Pathways

## 1. Observation

### 1.1 Dedicated Routes Page (`app/routes/page.tsx`)
- **Current State**:
  - The page consumes `const { routes, selectedRoute, selectedRouteId, setSelectedRouteId } = useMission();` (`app/routes/page.tsx:20`).
  - Displays 4 route cards (`RouteCard` components in lines 36–45) allowing the user to select an active route via `setSelectedRouteId(r.id)`.
  - Displays a "Decision Explanation" box (`app/routes/page.tsx:48–65`) comparing `selectedRoute` distance and fuel savings against `safest`, and risk against `shortest`.
  - Displays a "Route Comparison Matrix" table (`app/routes/page.tsx:68–110`) displaying 6 static fields:
    ```ts
    const METRICS = [
      { key: "distanceNm",       label: "Distance",    fmt: (v: number) => formatNauticalMiles(v) },
      { key: "etaHours",         label: "ETA",         fmt: (v: number) => formatHours(v) },
      { key: "fuelTons",         label: "Fuel",        fmt: (v: number) => formatFuelTons(v) },
      { key: "averageRiskScore", label: "Avg Risk",    fmt: (v: number) => `${v}` },
      { key: "maxRiskScore",     label: "Max Risk",    fmt: (v: number) => `${v}` },
      { key: "compatibility",    label: "Compat.",     fmt: (v: string) => v },
    ] as const;
    ```
  - Displays `SimpleMap` (`app/routes/page.tsx:114`) passing `selectedRouteId` and `setSelectedRouteId`.
  - **Identified Deficiencies for R1**:
    1. **Waypoints**: `/routes` does **not** render any waypoints table or waypoint list for the active pathway.
    2. **POLARIS RIO Scores**: Neither the comparison table nor the cards display POLARIS RIO certification scores or PASS/MARGINAL regulatory status.
    3. **Ice Exposure Breakdown**: No breakdown is shown for ice concentration regimes (open water %, light ice %, pack ice %, heavy/pressure ridge ice %, peak ice concentration, or multi-year exposure in NM).
    4. **Pathway Recalculation**: Selecting an alternative only updates the decision paragraph and highlights the column in the comparison table, but does not present the comprehensive multi-variable telemetry required by R1.

---

### 1.2 In-App Route Overview Components
- **`app/dashboard/page.tsx` (Mission Control / Route Overview)**:
  - Lines 153–225 render the primary in-app "Route Overview" section:
    - Renders `selectedRoute.name`, `selectedRoute.tradeOff`, `selectedRoute.averageRiskScore`, and a risk progress bar.
    - Lines 189–215 render a static "AI Pathfinding Rationale" block with hardcoded heuristic descriptions:
      ```tsx
      <p><strong>Algorithm:</strong> <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[10px]">Multi-objective A* (D* Lite)</span></p>
      <p><strong>Heuristics:</strong> Selected to minimize multi-year ice exposure {'>'} 1.2m while optimizing for {vessel.name}'s PC4 limits.</p>
      <p><strong>Trade-off:</strong> The engine accepted a +{Math.round(selectedRoute.distanceNm * 0.08)} NM distance penalty to maintain {vessel.iceLimitKn} kn, avoiding high-pressure ice.</p>
      ```
    - Lines 231–270 render 4 KPI cards: Average Risk, Transit Dist, Est. Duration, Bunker Fuel.
    - Lines 273–295 render `SimpleMap` with `selectedRouteId` and `onSelectRoute={setSelectedRouteId}`.
    - **Deficiencies**: The Route Overview does not show POLARIS RIO scores, does not show ice exposure breakdown, does not show waypoints or chokepoints, and uses static AI rationale text instead of pathway-specific rationale.
- **`app/mission/page.tsx` (Simulation Cockpit & Outcome View)**:
  - Lines 572–580 render `SimulationPreviewMap` with `selectedRouteId` and `onSelectRoute`.
  - Lines 583–589 render `SimulationTelemetryHud`:
    - In `components/mission/SimulationTelemetryHud.tsx` (lines 163–168), telemetry variables (`rioScore: 16.8`, `besetmentPct: 18.4`, `icePeak: 78.4`, `cpaDist: 2.4`) are hardcoded local `useState` values! They do **not** react to `selectedRouteId`.
  - Lines 593–601 render `RouteRevealCards`:
    - Defines a local map `ROUTE_RIO_SCORES` (`components/mission/RouteRevealCards.tsx:43–48`):
      ```ts
      const ROUTE_RIO_SCORES: Record<RouteId, { rio: string; status: "PASS" | "MARGINAL"; note: string }> = {
        balanced: { rio: "+16.8", status: "PASS", note: "Authorized Polar Transit" },
        safest: { rio: "+24.2", status: "PASS", note: "Maximum Ice Standoff" },
        fuel_efficient: { rio: "+11.5", status: "PASS", note: "Optimized Bunker Profile" },
        shortest: { rio: "-3.2", status: "MARGINAL", note: "Elevated Pressure Ice" },
      };
      ```
    - Shows RIO in cards and comparison matrix, but this data is scoped privately inside `RouteRevealCards.tsx`.
- **`app/reports/page.tsx` (Mission Report Overview)**:
  - Lines 9–15 define a hardcoded `WAYPOINTS` array (WP1–WP5) representing a fixed route through Antarctic Sound that does **not** change when `selectedRoute` changes.
- **`components/risk/WaypointRiskChart.tsx`**:
  - Lines 19–47 define `ROUTE_WAYPOINTS`: a comprehensive schedule of waypoints per corridor (`shortest`, `safest`, `fuel_efficient`, `balanced`) with coordinates, leg/cumulative NM, ice concentration (tenths), risk score, besetment risk %, and polar speed ceiling.

---

### 1.3 Pathway / Corridor Telemetry Definition & Storage
- In `lib/data.ts` (lines 28–38):
  ```ts
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
  }
  ```
  and `BASELINE_ROUTES` (lines 54–59):
  ```ts
  export const BASELINE_ROUTES: RouteAlternative[] = [
    { id: "shortest", name: "Shortest", tradeOff: "Fastest distance, highest ice exposure", distanceNm: 412, etaHours: 38.5, fuelTons: 48.2, averageRiskScore: 74, maxRiskScore: 88, compatibility: "marginal" },
    { id: "safest", name: "Safest", tradeOff: "Lowest risk, longest detour", distanceNm: 528, etaHours: 44, fuelTons: 51.5, averageRiskScore: 22, maxRiskScore: 36, compatibility: "high" },
    { id: "fuel_efficient", name: "Fuel-Efficient", tradeOff: "Lowest fuel burn", distanceNm: 458, etaHours: 41.6, fuelTons: 39.8, averageRiskScore: 45, maxRiskScore: 54, compatibility: "high" },
    { id: "balanced", name: "Recommended Balanced", tradeOff: "Best trade-off of risk, fuel and time", distanceNm: 445, etaHours: 37.1, fuelTons: 42.9, averageRiskScore: 31, maxRiskScore: 42, compatibility: "high" },
  ];
  ```
- **Fragmentation of Telemetry Across Files**:
  | Telemetry Dimension | Currently Stored In | Status |
  |---|---|---|
  | Distance, ETA, Fuel, Risk | `lib/data.ts` (`BASELINE_ROUTES`) | Centralized |
  | Map Trajectory Coordinates | `components/map/SimpleMap.tsx` & `SimulationPreviewMap.tsx` | Duplicated in 2 components |
  | Waypoints & Leg Distances | `components/risk/WaypointRiskChart.tsx` | Isolated in Risk component |
  | POLARIS RIO Scores | `components/mission/RouteRevealCards.tsx` | Isolated in Mission component |
  | Multi-Factor Radar Drivers | `components/risk/RiskRadarChart.tsx` | Isolated in Risk component |
  | Ice Exposure Breakdown | Nowhere consolidated | Missing structured model |

---

### 1.4 State Management & Tab Persistence
- In `components/session/MissionContext.tsx`:
  - `selectedRouteId` is initialized as:
    ```ts
    const [selectedRouteId, setSelectedRouteId] = useState<RouteId>(DEFAULTS.routeId);
    ```
  - `selectedRoute` is derived:
    ```ts
    const selectedRoute = useMemo(
      () => routes.find((r) => r.id === selectedRouteId) ?? routes[3],
      [routes, selectedRouteId]
    );
    ```
  - `MissionProvider` is mounted at the root in `app/layout.tsx:17`:
    ```tsx
    <body className={inter.className}>
      <MissionProvider>{children}</MissionProvider>
    </body>
    ```
  - Navigation between sidebar tabs (`/dashboard`, `/mission`, `/routes`, `/risk`, `/reports`) is handled by Next.js `<Link>` elements in `components/layout/Sidebar.tsx:106–124`. Because routing is client-side within the same persistent React tree, in-memory state in `MissionContext` **does** persist across tab transitions during normal SPA navigation.
  - However, there is no browser storage persistence (`sessionStorage` or `localStorage`). If the user reloads the browser, duplicates a tab, or visits `/routes` directly, `selectedRouteId` resets to `"balanced"`.

---

### 1.5 Existing Tests (`tests/*`)
- Current test suite contains 3 test files running via `tsx --test`:
  1. `tests/data_and_utils.test.ts` (19 test cases): tests data models (`VESSELS`, `MISSIONS`, `BASELINE_ROUTES`, `MITIGATIONS`), utilities (`formatNauticalMiles`, `formatHours`, `formatFuelTons`), risk classification, coordinate projection.
  2. `tests/mission_planner_interactive.test.ts` (11 test cases): tests 8-stage simulation pipeline, parameter synchronization, route selection resolving, POLARIS RIO status verification, map path coordinates.
  3. `tests/adversarial_challenge.test.ts` (20 test cases): tests coordinate clamping, risk boundary epsilons, number formatting edge cases, physical speed/burn coherence, monotonic risk ordering.
- **Test Suite Results**:
  - `npm test`: 50 passed, 0 failed, 22 suites, duration ~3.7s.
  - `npx tsc --noEmit`: 0 errors.

---

## 2. Logic Chain

1. **Premise**: Requirement R1 requires that selecting any pathway corridor (Shortest, Safest, Fuel-Efficient, Balanced) on `/routes` or mission overview dynamically recalculates, displays, and synchronizes all telemetry (waypoints, distance in NM, fuel consumption in MT, ETA hours, POLARIS RIO scores, and ice exposure breakdown) across both views in real time, and persists active pathway selection across navigation tabs.
2. **Analysis of Current Telemetry Model**:
   - `RouteAlternative` in `lib/data.ts` only contains basic scalar numbers (`distanceNm`, `etaHours`, `fuelTons`, `averageRiskScore`, `maxRiskScore`, `compatibility`).
   - The richer telemetry required by R1 exists in scattered locations (`ROUTE_WAYPOINTS` in `WaypointRiskChart.tsx`, `ROUTE_RIO_SCORES` in `RouteRevealCards.tsx`, `ROUTE_PATHS` in `SimpleMap.tsx`), while Ice Exposure Breakdown does not exist in any structured format.
3. **Deduction — Single Source of Truth**:
   - Consolidating all pathway telemetry into `lib/data.ts` (or a dedicated `lib/pathways.ts` re-exported by `lib/data.ts`) will ensure that `RouteAlternative` / `PathwayCorridor` contains:
     - `waypoints`: array of waypoints (ID, name, lat/lon, leg distance, cumulative distance, ice concentration, safe speed limit, waypoint risk score).
     - `rio`: POLARIS RIO score (e.g. +16.8, +24.2, +11.5, -3.2), status (PASS / MARGINAL), regulatory certificate info (IMO Polar Code MSC.1/Circ.1519).
     - `iceExposure`: breakdown percentages (Open Water %, Light/Drift Ice %, Medium Pack %, Heavy Pressure Ridges %, Peak Ice Concentration tenths & location, Multi-Year Ice exposure in NM).
     - `pathCoordinates`: SVG coordinates array for map rendering.
     - `aiRationale`: route-specific pathfinding explanation for the dashboard overview.
4. **Deduction — Real-Time State Synchronization**:
   - Because `MissionProvider` already exposes `{ selectedRouteId, setSelectedRouteId, selectedRoute, routes }` and is rendered at root level in `app/layout.tsx`, enriching `selectedRoute` automatically delivers synchronized telemetry to all listening pages.
   - Adding `sessionStorage` backing to `MissionContext.tsx` ensures that active pathway selection is 100% durable across navigation tabs, browser reloads, and deep links.
5. **Deduction — UI Updates for R1 Compliance**:
   - On `/routes/page.tsx`:
     - Update "Route Comparison Matrix" to include rows for POLARIS RIO Score and Peak Ice Exposure.
     - Add a "Selected Pathway Telemetry & Waypoints Breakdown" section:
       - Displays the complete waypoints schedule of the active pathway (waypoint ID, name, coordinates, leg distance, cumulative distance, ice concentration, speed limit, risk score).
       - Displays the Ice Exposure Regime breakdown visually (progress bars for Open Water, Light Pack, Medium Pack, Heavy Ridged Ice).
       - Displays the POLARIS RIO Certification card (certified score, PASS/MARGINAL badge, IMO compliance notes).
     - Update the "Decision Explanation" card to dynamically describe the trade-offs, RIO compliance, and ice hazards of the selected route vs others.
   - On `/dashboard/page.tsx` ("Route Overview" panel):
     - Display the POLARIS RIO badge alongside the Risk badge.
     - Display the Ice Exposure breakdown (Peak Ice Concentration, Pack Ice %).
     - Display a summary of waypoints and corridor transit milestones.
     - Dynamically update the "AI Pathfinding Rationale" to reflect the actual heuristics of the active pathway.
   - On `/mission/page.tsx`:
     - Connect `SimulationTelemetryHud.tsx` to `selectedRoute` so the HUD's real-time readout (POLARIS RIO, Peak Ice Conc, Besetment Risk) updates dynamically when a pathway is selected.
   - On `/reports/page.tsx`:
     - Replace the static `WAYPOINTS` table with the active pathway's dynamic `selectedRoute.waypoints`.

---

## 3. Caveats

1. **Backward Compatibility**: `BASELINE_ROUTES` and `RouteAlternative` in `lib/data.ts` are consumed by multiple components and existing tests (`tests/data_and_utils.test.ts`, `tests/mission_planner_interactive.test.ts`, `tests/adversarial_challenge.test.ts`). Any additions to `RouteAlternative` must be non-breaking (adding new properties while preserving all existing properties).
2. **Client-Side vs Server-Side Hydration**: When initializing `selectedRouteId` from `sessionStorage` or `localStorage`, Next.js SSR may encounter hydration mismatches if not handled using an effect (`useEffect`) or SSR-safe state initialization (`typeof window !== 'undefined'`).
3. **Next.js Build Cache**: Next.js production builds (`npm run build`) generate type definitions in `.next/types/validator.ts`. If `.next` directory is stale or corrupted, running `rm -rf .next` before build ensures clean compilation.

---

## 4. Conclusion & Recommendations

### 4.1 Pathway Telemetry Data Specification
We recommend standardizing the pathway corridor telemetry as follows:

| Pathway Corridor | Distance | ETA | Fuel | Avg Risk | Max Risk | POLARIS RIO | Peak Ice Conc | Heavy Pack / Ridge % | Multi-Year Exposure | Waypoints Count |
|---|---|---|---|---|---|---|---|---|---|---|
| **Shortest** | 412 NM | 38.5 hrs | 48.2 MT | 74 (High) | 88 | -3.2 (MARGINAL) | 8/10 (Antarctic Sound) | 36% | 145 NM (PR-01) | 4 WPs |
| **Safest** | 528 NM | 44.0 hrs | 51.5 MT | 22 (Low) | 36 | +24.2 (PASS) | 3/10 (Trinity Lead) | 0% | 0 NM (Clear) | 5 WPs |
| **Fuel-Efficient** | 458 NM | 41.6 hrs | 39.8 MT | 45 (Med) | 54 | +11.5 (PASS) | 5/10 (Prince Gustav) | 0% | 38 NM (Larsen Edge) | 4 WPs |
| **Balanced** | 445 NM | 37.1 hrs | 42.9 MT | 31 (Low) | 42 | +16.8 (PASS) | 4/10 (Joinville Pass) | 0% | 18 NM (MYI-02 Skirt) | 6 WPs |

### 4.2 Required Code Changes by File
1. **`lib/data.ts` (or `lib/pathways.ts`)**:
   - Define interfaces: `RouteWaypoint`, `PolarisRioProfile`, `IceExposureBreakdown`.
   - Extend `RouteAlternative` with `rio`, `iceExposure`, `waypoints`, `pathCoordinates`, and `aiRationale`.
   - Populate `BASELINE_ROUTES` with full telemetry for all 4 corridors.
2. **`components/session/MissionContext.tsx`**:
   - Ensure `selectedRouteId` is persisted to `sessionStorage` on changes and initialized from `sessionStorage` (with SSR safety).
   - Expose enriched `selectedRoute` containing all telemetry fields.
3. **`app/routes/page.tsx`**:
   - Add POLARIS RIO and Ice Exposure metrics to "Route Comparison Matrix".
   - Add "Selected Pathway Telemetry & Waypoints Breakdown" section with interactive Waypoint Table, Ice Exposure Regime progress bars, and POLARIS Certification details.
   - Make Decision Explanation dynamic to compare selected pathway telemetry against baselines.
4. **`app/dashboard/page.tsx`**:
   - Update "Route Overview" panel to show POLARIS RIO badge, Ice Exposure breakdown, and waypoints count.
   - Update "AI Pathfinding Rationale" dynamically based on `selectedRoute.id`.
5. **`components/mission/SimulationTelemetryHud.tsx`**:
   - Accept `selectedRoute` or read from `useMission()` to synchronize `rioScore`, `icePeak`, and `besetmentPct` with the active pathway.
6. **`app/reports/page.tsx`**:
   - Connect the Waypoint Schedule table to `selectedRoute.waypoints`.

### 4.3 New Test Suite Required for R1 (`tests/route_overview_pathways.test.ts`)
A dedicated test suite should verify:
1. **Data Model Integrity**: All 4 routes contain valid waypoints (>=4 waypoints each, positive leg distances summing to total distance), valid POLARIS RIO scores with certified statuses, and complete ice exposure percentages summing to 100%.
2. **Reactivity & Synchronization**: Changing `selectedRouteId` from `"balanced"` to `"shortest"`, `"safest"`, or `"fuel_efficient"` synchronously updates all telemetry fields (waypoints, RIO, ice breakdown, fuel, ETA).
3. **Physical & Regulatory Consistency**: Shortest route has lowest distance but negative RIO and highest ice exposure; Safest route has highest distance and lowest ice exposure with highest positive RIO (+24.2); Fuel-efficient has lowest fuel burn (39.8 MT).
4. **Storage Persistence**: State helper correctly writes to and reads from session storage keys.

---

## 5. Verification Method

### 5.1 Command Line Verification
Execute the following verification commands from `/home/dev/Desktop/projects/fb/frontend`:
```bash
# 1. Run full unit and integration test suite (must pass 100%)
npm test
# Verified: 50/50 tests pass across 22 test suites in ~3.7s

# 2. Run TypeScript type checker with no emissions (must output 0 errors)
npx tsc --noEmit
# Verified: 0 type errors

# 3. Verify clean production build
npm run build
# Verified: Clean static build generating 14/14 static pages with 0 errors
```

### 5.2 Browser & UI Verification
1. Navigate to `/routes`:
   - Click each route card (`Shortest`, `Safest`, `Fuel-Efficient`, `Balanced`).
   - Verify that the waypoints table, POLARIS RIO certificate, ice exposure bars, and comparison matrix immediately update to reflect the clicked pathway.
2. Navigate to `/dashboard`:
   - Verify the "Route Overview" panel reflects the pathway selected on `/routes`.
   - Select another pathway using the map line or cards; verify KPIs and AI rationale update instantly.
3. Switch between sidebar navigation tabs (`/routes` -> `/dashboard` -> `/mission` -> `/risk` -> `/reports`):
   - Verify that the active pathway selection is preserved and consistently reflected across all views.
4. Hard-refresh the page (`Ctrl+F5`):
   - Verify that the active pathway selection is retained via storage persistence.

### 5.3 Invalidation Conditions
- Any route card click fails to update waypoints or RIO score.
- Refreshing the page or switching navigation tabs resets the route back to default without operator interaction.
- Discrepancy between waypoints shown on `/routes` vs `/reports`.
- Any TypeScript type errors (`npx tsc --noEmit` exits with code > 0).
