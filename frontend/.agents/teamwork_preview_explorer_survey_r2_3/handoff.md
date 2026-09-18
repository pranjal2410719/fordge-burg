# Comprehensive Handoff Report: Requirement R3 (Dynamic Risk & Mitigation Real-Time Alignment) & System Verification

## 1. Observation

### 1.1 Consequence Metrics Architecture (`app/risk/page.tsx`, `components/risk/*`, `lib/riskDetailData.ts`, `lib/riskExport.ts`)
1. **Calculation in `app/risk/page.tsx` (lines 70–102)**:
   ```tsx
   const isOpenWater = vessel.iceClass === "OpenWater";
   const risk = selectedRoute.averageRiskScore;

   const consequences: ConsequenceItem[] = useMemo(
     () => [
       {
         key: "besetment",
         label: "Besetment Risk",
         score: isOpenWater ? 75 : Math.min(85, Math.round(risk * 1.05)),
         value: isOpenWater ? "High" : risk > 50 ? "Elevated" : "Moderate",
         level: isOpenWater || risk > 50 ? "HIGH" : "MODERATE",
       },
       {
         key: "delay",
         label: "Transit Delay Risk",
         score: Math.min(95, Math.round(risk / 10) * 10),
         value: `${Math.max(4, Math.round(risk / 9))} hrs`,
         level: risk > 60 ? "HIGH" : risk > 35 ? "MODERATE" : "LOW",
       },
       {
         key: "fuel",
         label: "Fuel Penalty",
         score: Math.min(90, Math.round(risk / 5) * 5),
         value: `+${Math.max(5, Math.round(risk / 5))}%`,
         level: risk > 55 ? "HIGH" : "MODERATE",
       },
       {
         key: "disruption",
         label: "Route Disruption",
         score: risk > 50 ? 70 : 30,
         value: risk > 50 ? "High" : "Low",
         level: risk > 50 ? "HIGH" : "LOW",
       },
     ],
     [isOpenWater, risk]
   );
   ```
2. **Discrepancy with `RiskRadarChart.tsx` (lines 15–22)**:
   In `components/risk/RiskRadarChart.tsx`, `RADAR_FACTORS` has distinct values hardcoded per route:
   ```ts
   export const RADAR_FACTORS: RadarFactor[] = [
     { key: "besetment",  label: "Besetment",    sub: "Compressive pack",  unit: "%", values: { shortest: 84, safest: 18, fuel_efficient: 46, balanced: 30 } },
     { key: "delay",      label: "Transit Delay", sub: "ETA variance",     unit: "%", values: { shortest: 68, safest: 32, fuel_efficient: 44, balanced: 35 } },
     { key: "fuel",       label: "Fuel Burn",    sub: "Reserve margin",   unit: "%", values: { shortest: 72, safest: 35, fuel_efficient: 22, balanced: 32 } },
     { key: "disruption", label: "Disruption",   sub: "Forced detour",    unit: "%", values: { shortest: 76, safest: 20, fuel_efficient: 40, balanced: 28 } },
     { key: "pressure",   label: "Ice Pressure", sub: "Ridge convergence", unit: "%", values: { shortest: 82, safest: 24, fuel_efficient: 50, balanced: 36 } },
     { key: "hull",       label: "Hull Load",    sub: "Kinetic stress",   unit: "%", values: { shortest: 80, safest: 22, fuel_efficient: 48, balanced: 34 } },
   ];
   ```
   - For `shortest` (averageRiskScore 74): `app/risk/page.tsx` calculates Besetment = 78, Delay = 70, Fuel = 75, Disruption = 70. However, `RiskRadarChart` plots Besetment = 84, Delay = 68, Fuel = 72, Disruption = 76.
   - For `safest` (averageRiskScore 22): `app/risk/page.tsx` calculates Besetment = 23, Delay = 20 (value `4 hrs`), Fuel = 20 (value `+5%`), Disruption = 30. However, `RiskRadarChart` plots Besetment = 18, Delay = 32, Fuel = 35, Disruption = 20.
   - For `fuel_efficient` (fuelTons 39.8 MT, averageRiskScore 45): `app/risk/page.tsx` calculates Fuel Penalty = 45 (value `+9%`), whereas `RiskRadarChart` evaluates fuel burn score at 22 (lowest penalty of all routes).
3. **Static Factor Breakdown in `lib/riskDetailData.ts`**:
   `CONSEQUENCE_DETAILS_MAP` defines static factor lists for `besetment`, `delay`, `fuel`, and `disruption` (e.g. `f-beset-1` score 68, `f-beset-2` score 60; `historicalBaseline.deltaVsVoyage`: `+7.0% above 10-year decadal mean`). When `ConsequenceModal` renders for `safest` corridor, it displays the identical high-pack compression scores and Joinville Island notes as it does for `shortest`.
4. **Static Tactical Mitigations in `lib/data.ts` and `app/risk/page.tsx`**:
   - `MITIGATIONS` is a static constant array in `lib/data.ts` (lines 68–76) containing 7 items:
     - `m1` ("Reduce speed in pack ice", mandatory)
     - `m2` ("Maintain 5.0 NM iceberg standoff", mandatory)
     - `m3` ("Daylight transit of chokepoints", recommended)
     - `m4` ("Extra lookout / ice watch", recommended)
     - `m5` ("Escort on standby for OpenWater hulls", advisory)
     - `m6` ("Fuel reserve margin check", recommended)
     - `m7` ("Contingency anchorage identified", advisory)
   - In `app/risk/page.tsx` (line 134), `filteredMitigations` operates directly on this static array. The statuses, descriptions, and ordering do not react to the active corridor or vessel profile. Specifically:
     - On `shortest`: The vessel traverses Antarctic Sound chokepoint (WP-S2, ice concentration 8/10, risk 88). `m3` (Daylight transit of chokepoints) remains only "recommended" instead of escalating to "mandatory".
     - On `safest`: The vessel bypasses Antarctic Sound via open ocean (West Bransfield Bypass, max ice 3/10). `m3` remains "recommended" instead of relaxing to "advisory".
     - On `OpenWater` hull (`MV Antarctic Navigator`): `m5` (Escort on standby) is labeled "advisory", despite IMO Polar Code Ch. 1 §1.5 strictly mandating escort for unstrengthened hulls entering sea ice.

### 1.2 Mission Context & Cross-Tab Synchronization (`components/session/MissionContext.tsx`)
- `MissionContext.tsx` defines `selectedRouteId` (`RouteId`: `"shortest" | "safest" | "fuel_efficient" | "balanced"`).
- `selectedRoute` is derived via `useMemo(() => routes.find((r) => r.id === selectedRouteId) ?? routes[3], [routes, selectedRouteId])`.
- In `app/risk/page.tsx` line 51:
  `const { mission, vessel, selectedRoute, selectedRouteId, setSelectedRouteId, routes } = useMission();`
- When route selection changes in `RouteRiskComparison.tsx` (or from `/routes` or `/mission`), `setSelectedRouteId(id)` updates `MissionContext`. Currently, consequence cards update superficially via `averageRiskScore`, but lack dynamic corridor-specific hazard telemetry, waypoint-level ice exposure, and adaptive mitigation elevation.

### 1.3 Test Harness, Scripts, and Build Setup
1. **`package.json` scripts**:
   - `"test": "tsx --test tests/**/*.test.ts"`
   - `"build": "next build"`
   - `"lint": "next lint"`
   - Dependencies: `next: ^15.1.6`, `react: ^19.0.0`, `tailwindcss: ^4`, `tsx: ^4.19.2`, `typescript: ^5`.
2. **Current Test Suite Execution (`npm test`)**:
   - Command: `tsx --test tests/**/*.test.ts`
   - Results observed:
     - `tests/adversarial_challenge.test.ts`: 15 tests pass.
     - `tests/data_and_utils.test.ts`: 20 tests pass.
     - `tests/mission_planner_interactive.test.ts`: 15 tests pass.
     - Total: **50 tests across 22 suites, 0 failed, duration ~2.9s**.
3. **TypeScript Compilation (`npx tsc --noEmit`)**:
   - Exited with code 0, 0 type errors.
4. **Next.js Production Build (`npm run build`)**:
   - Compiles cleanly in ~11-14s.
   - Identified transient issue: When multiple background processes run `next build` concurrently in the same directory, Jest worker processes collide on `.next/build-manifest.json` or `.next/cache`, triggering ENOENT or retry loops. Isolated execution completes with exit code 0.

---

## 2. Logic Chain

1. **Premise 1**: Requirement R3 requires consequence metrics (Besetment, Delay, Fuel Penalty, Route Disruption) and relevant mitigations to update in real time to reflect the specific hazards, geometry, and characteristics of the actively selected pathway.
2. **Premise 2**: Observation 1.1 reveals that `app/risk/page.tsx` currently derives all four consequence metrics from a single scalar heuristic (`selectedRoute.averageRiskScore`) rather than the actual pathway characteristics (e.g., Antarctic Sound chokepoint on `shortest`, detour distance on `safest`, fuel optimization on `fuel_efficient`, and iceberg proximities).
3. **Premise 3**: Observation 1.1 shows a quantitative conflict between `app/risk/page.tsx` and `RiskRadarChart.tsx` (`RADAR_FACTORS`). On `fuel_efficient`, `app/risk/page.tsx` produces a 45/100 fuel penalty score (`+9%`), directly contradicting the route's defining quality (39.8 MT bunker consumption, score 22 in `RiskRadarChart`).
4. **Premise 4**: Observation 1.1 proves that `MITIGATIONS` is a static 7-element constant. Operator safety requirements under IMO Polar Code dictate that mitigations must reflect the active corridor's hazards (e.g. Antarctic Sound chokepoint requires mandatory daylight transit `m3`; OpenWater vessel in ice requires mandatory escort `m5`; fuel-efficient channel navigation requires mandatory fuel reserve checks `m6`).
5. **Premise 5**: Requirement R1 requires route overview telemetry synchronization across `/routes` and mission components; Requirement R2 requires a 3-trigger vanishing configuration flow in `/mission`; Requirement R3 requires dynamic risk/mitigation alignment.
6. **Premise 6**: Observation 1.3 shows that the test harness uses Node's native test runner via `tsx --test`. Existing test files (`data_and_utils.test.ts`, `adversarial_challenge.test.ts`, `mission_planner_interactive.test.ts`) assert static constraints. They do not yet verify dynamic route consequence recalculation, adaptive mitigation elevation, or R2 multi-stage UI transitions.
7. **Conclusion**: To fulfill R3 and satisfy System Verification (100% test pass rate, 0 type errors, clean build):
   - A centralized, corridor-specific risk engine should compute consequence metrics (`besetment`, `delay`, `fuel`, `disruption`) and dynamic mitigation statuses from `selectedRouteId` and `vessel.iceClass`.
   - The factor decomposition in `ConsequenceModal` and telemetry payload in `TelemetryExportBar` must bind to these dynamic calculations.
   - Comprehensive test suites must be updated/added to rigorously verify R1, R2, and R3 behaviors under the native `tsx --test` harness.

---

## 3. Caveats

1. **Read-Only Explorer Constraint**: In accordance with the Explorer archetype mandate, no modifications have been made to application source files (`app/*`, `components/*`, `lib/*`) or test files (`tests/*`). All proposals are documented with exact specifications for the Implementer / Worker agent.
2. **Build Process Concurrency**: When running `npm run build`, concurrent subagents operating in the same workspace directory must not launch parallel Next.js builds simultaneously to prevent lock contention on `.next/`.
3. **Static Route Set**: The application model is intentionally scoped to 4 baseline polar corridors (`shortest`, `safest`, `fuel_efficient`, `balanced`). Dynamic calculations are evaluated deterministically against these corridors and vessel classes.

---

## 4. Conclusion & Actionable Recommendations

### 4.1 Recommended Design for Requirement R3 (Dynamic Risk & Mitigation Engine)

#### A. Pathway-Specific Consequence Metrics Engine
Implement a deterministic consequence calculation utility (e.g. in `lib/riskDetailData.ts` or `lib/riskCalculation.ts`):

```ts
export interface DynamicConsequenceResult {
  key: "besetment" | "delay" | "fuel" | "disruption";
  label: string;
  score: number;
  value: string;
  level: "LOW" | "MODERATE" | "HIGH";
  factorHighlights: string[];
}

export const CORRIDOR_CONSEQUENCES: Record<RouteId, (iceClass: string) => Record<string, DynamicConsequenceResult>> = {
  shortest: (iceClass) => ({
    besetment: {
      key: "besetment",
      label: "Besetment Risk",
      score: iceClass === "OpenWater" ? 92 : 84,
      value: iceClass === "OpenWater" ? "Critical (92%)" : "Severe (84%)",
      level: "HIGH",
      factorHighlights: ["Antarctic Sound 8/10 pack compression", "Ridge keels >2.5m depth"],
    },
    delay: {
      key: "delay",
      label: "Transit Delay Risk",
      score: 68,
      value: "+8.5 hrs",
      level: "HIGH",
      factorHighlights: ["Mandatory ice speed throttling (4.0 kn)", "Daylight staging hold at chokepoint"],
    },
    fuel: {
      key: "fuel",
      label: "Fuel Penalty",
      score: 72,
      value: "+22.5% (+10.8 MT)",
      level: "HIGH",
      factorHighlights: ["Continuous ice fracturing drag", "Ramming & astern pitch cycling"],
    },
    disruption: {
      key: "disruption",
      label: "Route Disruption",
      score: 76,
      value: "High (76%)",
      level: "HIGH",
      factorHighlights: ["Dynamic lead closure across Antarctic Sound", "Tabular iceberg A-76A fragment drift"],
    },
  }),
  safest: (iceClass) => ({
    besetment: {
      key: "besetment",
      label: "Besetment Risk",
      score: iceClass === "OpenWater" ? 45 : 18,
      value: iceClass === "OpenWater" ? "Moderate (45%)" : "Minimal (18%)",
      level: iceClass === "OpenWater" ? "MODERATE" : "LOW",
      factorHighlights: ["Wide divergent leads in Bransfield Strait", "Open water bypass"],
    },
    delay: {
      key: "delay",
      label: "Transit Delay Risk",
      score: 32,
      value: "+2.0 hrs",
      level: "LOW",
      factorHighlights: ["Detour pre-planned (+83 NM)", "Minimal ice speed step-down"],
    },
    fuel: {
      key: "fuel",
      label: "Fuel Penalty",
      score: 35,
      value: "+8.0% (+4.1 MT)",
      level: "MODERATE",
      factorHighlights: ["Extended circumnavigation distance", "Zero high-resistance ramming"],
    },
    disruption: {
      key: "disruption",
      label: "Route Disruption",
      score: 20,
      value: "Minimal (20%)",
      level: "LOW",
      factorHighlights: ["Multiple escape vectors into open sea", "Zero narrow strait chokepoints"],
    },
  }),
  fuel_efficient: (iceClass) => ({
    besetment: {
      key: "besetment",
      label: "Besetment Risk",
      score: iceClass === "OpenWater" ? 65 : 46,
      value: iceClass === "OpenWater" ? "Elevated (65%)" : "Moderate (46%)",
      level: iceClass === "OpenWater" ? "HIGH" : "MODERATE",
      factorHighlights: ["Prince Gustav Channel ice tongue", "Moderate lead consolidation"],
    },
    delay: {
      key: "delay",
      label: "Transit Delay Risk",
      score: 44,
      value: "+4.5 hrs",
      level: "MODERATE",
      factorHighlights: ["Channel speed limit ceiling", "Iceberg B-30 margin clearance"],
    },
    fuel: {
      key: "fuel",
      label: "Fuel Penalty",
      score: 22,
      value: "+2.5% (+1.0 MT)",
      level: "LOW",
      factorHighlights: ["Optimized hydrodynamic track", "Sub-nominal engine thermal overhead"],
    },
    disruption: {
      key: "disruption",
      label: "Route Disruption",
      score: 40,
      value: "Moderate (40%)",
      level: "MODERATE",
      factorHighlights: ["Fast ice shelf margin stability", "Channel exit vulnerability"],
    },
  }),
  balanced: (iceClass) => ({
    besetment: {
      key: "besetment",
      label: "Besetment Risk",
      score: iceClass === "OpenWater" ? 55 : 30,
      value: iceClass === "OpenWater" ? "Elevated (55%)" : "Low-Mod (30%)",
      level: iceClass === "OpenWater" ? "HIGH" : "LOW",
      factorHighlights: ["Joinville Island passage leads", "Moderate floe friction"],
    },
    delay: {
      key: "delay",
      label: "Transit Delay Risk",
      score: 35,
      value: "+3.2 hrs",
      level: "MODERATE",
      factorHighlights: ["Daylight transit coordination", "Minor course diversions"],
    },
    fuel: {
      key: "fuel",
      label: "Fuel Penalty",
      score: 32,
      value: "+6.5% (+2.8 MT)",
      level: "LOW",
      factorHighlights: ["Economical cruise RPM profile", "Controlled pack resistance"],
    },
    disruption: {
      key: "disruption",
      label: "Route Disruption",
      score: 28,
      value: "Low (28%)",
      level: "LOW",
      factorHighlights: ["Secondary escape routes charted", "Manageable holding anchorages"],
    },
  }),
};
```

#### B. Dynamic Mitigation Elevation Engine
Update `MITIGATIONS` resolution so that items adapt dynamically:
- **`m3` (Daylight transit of chokepoints)**:
  - When `routeId === "shortest"`: status elevates to **`"mandatory"`** with note *"Mandatory for WP-S2 Antarctic Sound transit (ice conc. 8/10)"*.
  - When `routeId === "safest"`: status relaxes to **`"advisory"`** with note *"Advisory; corridor bypasses narrow chokepoints via Bransfield Strait"*.
  - Otherwise: **`"recommended"`**.
- **`m5` (Escort on standby)**:
  - When `vessel.iceClass === "OpenWater"`: status elevates to **`"mandatory"`** under IMO Polar Code Ch. 1 §1.5.
  - When `vessel.iceClass === "PC2"`: status is **`"advisory"`** (lead escort capable).
  - On `shortest` route for `PC4`/`PC5`: status elevates to **`"recommended"`**.
- **`m6` (Fuel reserve margin check)**:
  - When `routeId === "fuel_efficient"`: status elevates to **`"mandatory"`** (*"Enforce bunker reserve margin check to prevent fuel starvation during channel entrapment"*).
  - Otherwise: **`"recommended"`**.
- **`m7` (Contingency anchorage identified)**:
  - When `routeId === "shortest"`: status elevates to **`"recommended"`** (*"Pre-select emergency anchorage before entering Antarctic Sound"*).

#### C. Real-Time UI Binding in `app/risk/page.tsx`
- Replace static `consequences` array with `CORRIDOR_CONSEQUENCES[selectedRouteId](vessel.iceClass)`.
- Replace static `[...MITIGATIONS]` with corridor/vessel-aware `getDynamicMitigations(selectedRouteId, vessel)`.
- Pass dynamic values to `ConsequenceModal` and `TelemetryExportBar`.

---

### 4.2 Comprehensive Test Addition Plan (Ensuring 100% Pass Rate & Full Coverage)

Add a dedicated test suite `tests/route_and_risk_dynamics.test.ts` (or expand existing test files) covering all three core requirements:

#### Test Group 1: Requirement R1 (Dynamic Route Overview Across Pathways)
1. `verifies unique telemetry attributes across all 4 corridors`:
   - Validates that `shortest`, `safest`, `fuel_efficient`, `balanced` each have strictly distinct `distanceNm`, `etaHours`, `fuelTons`, `averageRiskScore`, `maxRiskScore`.
2. `verifies POLARIS RIO scores and regulatory status per corridor`:
   - `shortest`: RIO `-3.2` (`MARGINAL`)
   - `safest`: RIO `+24.2` (`PASS`)
   - `fuel_efficient`: RIO `+11.5` (`PASS`)
   - `balanced`: RIO `+16.8` (`PASS`)
3. `verifies corridor waypoint telemetry and ice exposure profiles`:
   - Validates `ROUTE_WAYPOINTS` for each route: verifies waypoint coordinates fall within sector bounds, validates monotonic distance progression, and asserts ice exposure percentages.
4. `verifies selection state synchronization`:
   - Emulates `MissionContext` route selection and confirms that `selectedRoute` updates synchronously across simulated consumers.

#### Test Group 2: Requirement R2 (Mission Planner Multi-Stage Transition & Unified Triggers)
1. `verifies 3 unified triggers invoke identical execution logic`:
   - Tests that triggering from Top Nav, Parameter Stepper Summary, or Sticky Bottom Bar executes the exact same simulation state sequence (`idle` -> `running` -> `completed`).
2. `verifies complete vanishing transition into outcome view`:
   - Asserts state transition logic: When simulation is launched (`status !== 'idle'`), configuration view state is `false` (vanished) and outcome view state is `true` (visible).
3. `verifies "Back / Modify Parameters" reversibility and state preservation`:
   - Tests that reverting to configuration mode restores view state while preserving all previously selected user inputs (`missionId`, `vesselId`, `forecastHorizon`, `preference`, `selectedRouteId`).

#### Test Group 3: Requirement R3 (Dynamic Risk & Mitigation Real-Time Alignment)
1. `verifies dynamic consequence metrics recalculation across all 4 corridors`:
   - Asserts that selecting `shortest` produces Besetment score 84 (`HIGH`), Delay +8.5 hrs (`HIGH`), Fuel +22.5% (`HIGH`), Disruption 76 (`HIGH`).
   - Asserts that selecting `safest` produces Besetment score 18 (`LOW`), Delay +2.0 hrs (`LOW`), Fuel +8.0% (`MODERATE`), Disruption 20 (`LOW`).
   - Asserts that selecting `fuel_efficient` produces Fuel Penalty score 22 (lowest of all corridors) and +2.5% value.
   - Asserts that selecting `balanced` produces balanced scores matching Pareto profile.
2. `verifies OpenWater hull class risk amplification`:
   - Asserts that selecting `MV Antarctic Navigator (OpenWater)` elevates besetment risk to critical (>= 75) across corridors and triggers statutory warnings.
3. `verifies dynamic mitigation status adaptation`:
   - Asserts `m3` (Daylight transit) is `mandatory` on `shortest` and `advisory` on `safest`.
   - Asserts `m5` (Escort standby) is `mandatory` for OpenWater vessels.
   - Asserts `m6` (Fuel reserve check) is `mandatory` on `fuel_efficient`.
   - Asserts acknowledgment state (`acked`) is preserved across corridor switches.
4. `verifies telemetry export alignment (CSV & JSON)`:
   - Validates that `generateRiskCsv` and `generateRiskJson` output files contain the dynamically updated consequence scores, values, and route-aligned mitigation statuses.

---

## 5. Verification Method

To independently verify the findings and the implementation:

1. **Test Runner Verification**:
   ```bash
   npm test
   ```
   *Expected result*: Executes `tsx --test tests/**/*.test.ts`, running all test suites with 100% pass rate (exit code 0).
2. **TypeScript Strict Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Clean run with 0 type errors (exit code 0).
3. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Expected result*: Clean static page generation with 0 build errors (exit code 0). Ensure no concurrent `next build` processes are running during verification.
4. **Key Files for Inspection**:
   - `app/risk/page.tsx`: Lines 70–102 (consequence calculation), lines 134–176 (mitigations filtering).
   - `components/risk/RiskRadarChart.tsx`: Lines 15–22 (`RADAR_FACTORS` scores per corridor).
   - `components/risk/WaypointRiskChart.tsx`: Lines 19–47 (`ROUTE_WAYPOINTS` hazard data).
   - `lib/data.ts`: Lines 54–59 (`BASELINE_ROUTES`), lines 68–76 (`MITIGATIONS`).
   - `lib/riskDetailData.ts`: Lines 91–368 (`CONSEQUENCE_DETAILS_MAP`), lines 372–752 (`MITIGATION_SOPS_MAP`).
   - `lib/riskExport.ts`: Lines 47–171 (`generateRiskCsv`, `generateRiskJson`).
   - `components/session/MissionContext.tsx`: Lines 40–97 (`selectedRouteId`, `selectedRoute`, `runSimulation`).

### Invalidation Conditions
- Any consequence metric (e.g. Besetment or Fuel Penalty) remaining identical when toggling between `shortest` (high ice drag) and `fuel_efficient` (minimum bunker track).
- Mitigations list maintaining identical statuses when toggling between `shortest` (chokepoint) and `safest` (open water bypass).
- `MV Antarctic Navigator (OpenWater)` failing to trigger mandatory escort mitigation status.
- `npm test` reporting any failed or unhandled assertion.
