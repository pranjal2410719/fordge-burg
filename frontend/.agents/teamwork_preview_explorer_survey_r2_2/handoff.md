# Handoff Report: Mission Planner Unified Triggers & Vanishing Transition Flow (Requirement R2)

## 1. Observation

### 1.1 Investigated Components & Source Paths
Direct inspection was conducted on the following primary files:
- `app/mission/page.tsx` (605 lines): The primary page orchestrating mission configuration, simulation execution, pipeline animation, cockpit preview, and route reveal cards.
- `components/mission/ParameterStepper.tsx` (203 lines): Stepper displaying 5 stages (Scenario, Vessel, Horizon, Objective, Run Engine) and workflow completion metrics.
- `components/mission/SimulationPipeline.tsx` (455 lines): The 8-block hydrodynamic pipeline simulation visualization (`ENG-01-MET` through `ENG-08-RIO`).
- `components/mission/SimulationPreviewMap.tsx` (477 lines): Interactive SVG map projecting Antarctic Peninsula coordinates, waypoints, iceberg standoff radii, and hazard polygons.
- `components/mission/SimulationTelemetryHud.tsx` (422 lines): Real-time streaming log terminal, engine metrics, and subsystem telemetry.
- `components/mission/RouteRevealCards.tsx` (339 lines): Animated cards displaying the 4 Pareto route alternatives (`balanced`, `safest`, `fuel_efficient`, `shortest`) with POLARIS RIO regulatory compliance scores.
- `components/session/MissionContext.tsx` (104 lines): Root session context holding parameters (`missionId`, `vesselId`, `forecastHorizon`, `preference`), routes (`routes`, `selectedRouteId`, `selectedRoute`), and simulation state (`simulationStatus`, `simulationProgress`, `runSimulation`).
- `app/layout.tsx` (22 lines): Root layout confirming `MissionProvider` wraps the entire application tree.
- `tests/mission_planner_interactive.test.ts` (425 lines): Existing test suite covering simulation state transitions, parameter synchronization, route selection, and map projection.

### 1.2 Current Plan Generation & Execution Action Triggers (Exact Line Locations)
Three distinct button triggers currently exist in the codebase, but they are disparate, inconsistently named, and do not execute a vanishing transition:

1. **Top Header Run Trigger** (`app/mission/page.tsx:162-185`):
   ```tsx
   <button
     type="button"
     onClick={runSimulation}
     disabled={simulationStatus === "running"}
     className={cn(
       "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all shadow-sm cursor-pointer",
       simulationStatus === "running"
         ? "bg-navy-700 opacity-80 cursor-not-allowed"
         : "bg-navy-900 hover:bg-navy-800"
     )}
   >
     {simulationStatus === "running" ? (
       <>
         <RotateCw size={13} className="animate-spin" />
         Simulating ({simulationProgress}%)
       </>
     ) : (
       <>
         <Zap size={13} />
         {simulationStatus === "completed" ? "Re-run Simulation" : "Run Simulation"}
       </>
     )}
   </button>
   ```
   *Observations*: Labeled "Run Simulation" / "Re-run Simulation". It only triggers `runSimulation()` without altering view modes or hiding the configuration form.

2. **Section 5 Simulation Trigger Deck** (`app/mission/page.tsx:453-478`):
   ```tsx
   <button
     type="button"
     onClick={runSimulation}
     disabled={simulationStatus === "running"}
     className={cn(
       "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all shadow-md cursor-pointer",
       simulationStatus === "running"
         ? "bg-navy-700 opacity-80 cursor-not-allowed"
         : "bg-navy-900 hover:bg-navy-800 hover:scale-[1.01]"
     )}
   >
     {simulationStatus === "running" ? (
       <>
         <RotateCw size={16} className="animate-spin" />
         Computing Pipeline ({simulationProgress}%)
       </>
     ) : (
       <>
         <Zap size={16} />
         {simulationStatus === "completed"
           ? "Re-run Mission Analysis"
           : "Generate Mission Analysis"}
       </>
     )}
   </button>
   ```
   *Observations*: Labeled "Generate Mission Analysis" / "Re-run Mission Analysis". It is positioned at the bottom of the 4 configuration cards and keeps all configuration cards on-screen during and after simulation execution.

3. **Route Reveal Cards Resimulate Trigger** (`components/mission/RouteRevealCards.tsx:324-332`):
   ```tsx
   <button
     type="button"
     onClick={onResimulate}
     className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-surface2 hover:border-border-strong transition-colors cursor-pointer"
   >
     <RotateCw size={12} />
     Re-compute Simulation
   </button>
   ```

### 1.3 Missing Architecture Required for R2
1. **Missing Unified Wording & Synchronization**: The buttons currently have different labels ("Run Simulation", "Generate Mission Analysis", "Re-compute Simulation"). R2 requires 3 synchronized triggers with the unified label `"Generate Plan & Run Simulation"`.
2. **Missing Stepper Summary Trigger**: In `components/mission/ParameterStepper.tsx`, Step 5 (`id: 5`, "5 · Run Engine", lines 70-87) merely executes `handleStepClick(step.id, step.targetId)` which scrolls the page down to `#step-simulation`. There is NO action button inside or alongside the Parameter Stepper summary.
3. **Missing Sticky Bottom Action Bar**: There is currently no persistent floating/sticky bottom bar at the base of the viewport when configuring mission parameters.
4. **Missing Vanishing Transition**: Currently, the entire page is a single monolithic vertical scroll. The 4 configuration cards (`#step-scenario`, `#step-vessel`, `#step-horizon`, `#step-objective`), the simulation trigger deck, the 8-stage pipeline, the simulation preview map, the telemetry HUD, and the route reveal cards are all rendered in the same document at all times.
5. **Missing "Back / Modify Parameters" Control**: There is no control in the outcome/cockpit view allowing the operator to cleanly return to the configuration view with previously chosen parameters intact.

### 1.4 Baseline Test & TypeScript Verification
- `npm test` executed via `tsx --test tests/**/*.test.ts`: **50 passed, 0 failed** across 22 suites.
- `npx tsc --noEmit`: Completed with **0 type errors**.

---

## 2. Logic Chain

### Step 2.1: Multi-Stage View State Machine
From `ORIGINAL_REQUEST.md`, Requirement R2 mandates:
> "Upon clicking any of these action buttons, the initial configuration view (parameter inputs, scenario selectors) vanishes completely and transitions smoothly into the dedicated outcome view (simulation pipeline, preview map, real-time telemetry HUD, and route reveal cards)."
> "Include an intuitive "Back / Modify Parameters" control in the outcome view allowing the operator to return to the configuration step at any time."

To satisfy this requirement, `app/mission/page.tsx` must model an explicit two-stage view state machine:
```ts
type MissionViewMode = "configure" | "outcome";
```

Initial state resolution:
```ts
const [viewMode, setViewMode] = useState<MissionViewMode>(
  simulationStatus !== "idle" ? "outcome" : "configure"
);
```
- If `simulationStatus === "running"` or `"completed"`, the operator lands directly in `"outcome"` view.
- If `simulationStatus === "idle"`, the operator lands in `"configure"` view.
- When any of the 3 synchronized unified triggers is clicked:
  ```ts
  const handleGeneratePlan = () => {
    setViewMode("outcome");
    runSimulation();
  };
  ```
- When "Back / Modify Parameters" is clicked:
  ```ts
  const handleModifyParameters = () => {
    setViewMode("configure");
  };
  ```

### Step 2.2: Parameter State Intactness Guarantee
Because `missionId`, `vesselId`, `forecastHorizon`, and `preference` are stored in `MissionContext` (mounted at `app/layout.tsx:17`), unmounting the configuration DOM tree during `viewMode === "outcome"` does NOT cause parameter loss. When transitioning back to `viewMode === "configure"`, all selected options (e.g. PC4 vessel, 7-day horizon, Fuel objective) remain 100% intact and immediately re-selected.

### Step 2.3: Architecture of the 3 Synchronized Unified Action Buttons
The 3 unified buttons must be strategically positioned and perfectly synchronized:

1. **Position 1: Top Navigation Bar / Header**:
   - Location: Top-right header section of `app/mission/page.tsx` (lines 151-185).
   - In `configure` view: Displays the unified primary action button:
     - Label: `"Generate Plan & Run Simulation"` (idle) / `"Simulating (${simulationProgress}%)"` (running)
     - Icon: `<Zap size={14} className="fill-current text-amber-400" />`
     - Action: `onClick={handleGeneratePlan}`
     - Disabled: `simulationStatus === "running"`
     - Attribute: `data-testid="mission-primary-action-top"`
   - In `outcome` view: Replaced by / supplemented with `"Back / Modify Parameters"` and status badges.

2. **Position 2: Parameter Stepper Summary**:
   - Location: Integrated within `components/mission/ParameterStepper.tsx`.
   - Add new prop to `ParameterStepperProps`: `onGeneratePlan?: () => void;`.
   - Add a Parameter Stepper Summary Bar directly underneath the 5-step grid:
     - Left side: Configuration summary chip (`{missionName} · {vesselName} ({vesselClass}) · {horizonDays}D · {objectiveName.toUpperCase()}`).
     - Right side: Synchronized unified action button:
       - Label: `"Generate Plan & Run Simulation"` (idle) / `"Simulating (${simulationProgress}%)"` (running)
       - Action: `onClick={onGeneratePlan}`
       - Disabled: `simulationStatus === "running"`
       - Attribute: `data-testid="mission-primary-action-stepper"`
   - Additionally, clicking Step 5 ("5 · Run Engine") directly invokes `onGeneratePlan()`.

3. **Position 3: Sticky Bottom Action Bar**:
   - Location: Rendered at the bottom of the viewport during `viewMode === "configure"`.
   - Positioning: `fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md px-4 py-3 shadow-lg md:left-64`.
   - Note on layout: The app sidebar is `w-64 shrink-0` on `md:` breakpoints (`components/layout/AppShell.tsx:17`). Setting `md:left-64` ensures the sticky bottom bar perfectly spans only the main content area without overlapping the sidebar.
   - Left side: Compact configuration summary pills (Vessel, Mission, Horizon, Objective).
   - Right side: Synchronized unified action button:
     - Label: `"Generate Plan & Run Simulation"` (idle) / `"Simulating (${simulationProgress}%)"` (running)
     - Action: `onClick={handleGeneratePlan}`
     - Disabled: `simulationStatus === "running"`
     - Attribute: `data-testid="mission-primary-action-bottom"`
   - Bottom padding: The configuration view container receives `pb-24` so that the bottom-most configuration cards are never obscured by the sticky bar.

### Step 2.4: Vanishing Transition Flow Layout
The UI is partitioned into two mutually exclusive views:

```tsx
{viewMode === "configure" ? (
  <div className="animate-fade-in pb-24 space-y-6" data-testid="mission-configure-view">
    {/* 1. Header with Top Unified Button */}
    {/* 2. Parameter Stepper with Summary Unified Button */}
    {/* 3. 4-Card Parameter Configuration Grid */}
    {/* 4. Sticky Bottom Action Bar with Bottom Unified Button */}
  </div>
) : (
  <div className="animate-fade-in space-y-6" data-testid="mission-outcome-view">
    {/* 1. Dedicated Outcome Header Bar with "Back / Modify Parameters" Control */}
    {/* 2. Simulation Pipeline (8 hydrodynamic blocks) */}
    {/* 3. Visual Simulation Cockpit (Preview Map + Telemetry HUD) */}
    {/* 4. Route Reveal Cards (when simulation completes) */}
  </div>
)}
```

When any of the 3 action buttons is clicked:
1. `handleGeneratePlan()` updates `viewMode = "outcome"`.
2. The initial configuration cards, parameter stepper, and sticky bottom bar vanish completely.
3. The dedicated outcome view mounts smoothly (`animate-fade-in`).
4. The 8 hydrodynamic pipeline blocks animate as simulation progress advances from 0% -> 40% -> 80% -> 100%.
5. The map and telemetry HUD stream real-time physics telemetry.
6. Upon completion (100%), the Route Reveal Cards display the 4 Pareto routes with POLARIS RIO scores and regulatory authorization.

### Step 2.5: "Back / Modify Parameters" Control Design
In `viewMode === "outcome"`, a dedicated control bar is rendered at the top of the outcome view:
```tsx
<div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={handleModifyParameters}
      data-testid="mission-back-to-config"
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-bold text-navy-900 hover:bg-surface2 hover:border-border-strong transition-all shadow-xs cursor-pointer"
    >
      <ArrowLeft size={14} />
      Back / Modify Parameters
    </button>
    <div className="hidden sm:block h-5 w-px bg-border" />
    <div className="flex items-center gap-2 text-xs">
      <span className="font-bold text-navy-900">{mission.name}</span>
      <span className="text-text-muted">·</span>
      <span className="font-semibold text-text-muted">{vessel.name} ({vessel.iceClass})</span>
      <span className="text-text-muted">·</span>
      <span className="rounded bg-surface2 border border-border px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-600">
        {forecastHorizon * 24}h Window
      </span>
    </div>
  </div>

  <div className="flex items-center gap-2">
    {simulationStatus === "completed" && (
      <Link
        href="/routes"
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-navy-900 hover:bg-surface2 hover:border-border-strong transition-colors"
      >
        Route Optimizer
        <ArrowRight size={13} />
      </Link>
    )}
    <button
      type="button"
      onClick={runSimulation}
      disabled={simulationStatus === "running"}
      className="flex items-center gap-2 rounded-lg bg-navy-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-800 transition-colors cursor-pointer"
    >
      <RotateCw size={13} className={cn(simulationStatus === "running" && "animate-spin")} />
      {simulationStatus === "running" ? `Simulating (${simulationProgress}%)` : "Re-run Simulation"}
    </button>
  </div>
</div>
```

---

## 3. Caveats

1. **Mobile Breakpoint Handling on Sticky Bottom Bar**: On mobile devices (`< md`), the sidebar collapses into a hidden drawer. The sticky bottom bar must use `left-0` on mobile and `md:left-64` on desktop to avoid obscuring the sidebar while properly anchoring to the bottom of the viewport.
2. **Next.js 15 Memory Constraints in Build Workers**:
   - During `next build`, Next.js 15 attempts to spawn multi-core build workers for static generation. In resource-constrained container environments, this can trigger exit code 137 (OOM).
   - Running `NODE_OPTIONS="--max-old-space-size=2048"` or setting `experimental: { cpus: 1 }` prevents OOM during production build.
   - `npx tsc --noEmit` and `npm test` execute in single-process mode with 0 errors.
3. **No Unintentional State Loss**: No form state is stored in ephemeral local component state of the unmounted cards; `missionId`, `vesselId`, `forecastHorizon`, and `preference` are all safely stored in `MissionContext`.
4. **Resimulate vs. Back**: When the operator is in outcome view and wants to re-run with identical parameters, they can click "Re-run Simulation" directly in the outcome header or RouteRevealCards. If they wish to change parameters (e.g., test a different vessel or objective), they click "Back / Modify Parameters", make their change in the configuration view, and click any of the 3 unified action buttons to re-transition.

---

## 4. Conclusion & Concrete Implementation Blueprint

### 4.1 Target File Modifications

#### File 1: `components/mission/ParameterStepper.tsx`
- **Changes**:
  1. Add `onGeneratePlan?: () => void;` to `ParameterStepperProps`.
  2. Wire Step 5 button click to `onGeneratePlan?.()`.
  3. Add the Stepper Summary Action Bar beneath the 5-step grid containing the unified action button with `data-testid="mission-primary-action-stepper"`.

#### File 2: `app/mission/page.tsx`
- **Changes**:
  1. Add view mode state: `const [viewMode, setViewMode] = useState<"configure" | "outcome">(simulationStatus !== "idle" ? "outcome" : "configure");`.
  2. Add action handler:
     ```ts
     const handleGeneratePlan = () => {
       setViewMode("outcome");
       runSimulation();
     };
     ```
  3. Add modify handler:
     ```ts
     const handleModifyParameters = () => {
       setViewMode("configure");
     };
     ```
  4. Implement Unified Trigger #1 in the top header (`data-testid="mission-primary-action-top"`).
  5. Pass `onGeneratePlan={handleGeneratePlan}` to `ParameterStepper` for Unified Trigger #2 (`data-testid="mission-primary-action-stepper"`).
  6. Implement Unified Trigger #3 in the Sticky Bottom Action Bar (`data-testid="mission-primary-action-bottom"`).
  7. Wrap the configuration grid in `{viewMode === "configure" && ...}`.
  8. Wrap the outcome components (`SimulationPipeline`, Visual Simulation Cockpit, `RouteRevealCards`) in `{viewMode === "outcome" && ...}` with the Outcome Control Bar containing the `"Back / Modify Parameters"` button (`data-testid="mission-back-to-config"`).

#### File 3: `tests/mission_planner_interactive.test.ts`
- **Changes**:
  Add new suite `4. Mission Planner Unified Triggers & Vanishing Transition Flow`:
  1. Test: All 3 unified action buttons exist and share identical label `"Generate Plan & Run Simulation"`.
  2. Test: Triggering any of the 3 action buttons dispatches the simulation and transitions `viewMode` from `configure` to `outcome`.
  3. Test: During simulation, all 3 triggers reflect the active running state and progress percentage synchronously.
  4. Test: Clicking "Back / Modify Parameters" transitions `viewMode` from `outcome` back to `configure`.
  5. Test: Parameter state intactness — verifies that `missionId`, `vesselId`, `forecastHorizon`, `preference`, and `selectedRouteId` remain 100% intact across repeated `configure -> outcome -> configure` transitions.
  6. Test: Mutual exclusivity — verifies that configuration inputs vanish when outcome view is active, and outcome visualizations are not rendered in configuration view.

---

## 5. Verification Method

### 5.1 Verification Commands
The implementing agent and orchestrator can verify the changes independently via:
1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Result*: Exits with code 0, 0 type errors.

2. **Automated Test Suite Execution**:
   ```bash
   npm test
   ```
   *Expected Result*: Exits with code 0, 100% of test suites pass (including the new suite for R2).

3. **DOM Attribute Verification**:
   Inspect the DOM to verify the presence of all test attributes:
   - `data-testid="mission-primary-action-top"`
   - `data-testid="mission-primary-action-stepper"`
   - `data-testid="mission-primary-action-bottom"`
   - `data-testid="mission-configure-view"`
   - `data-testid="mission-outcome-view"`
   - `data-testid="mission-back-to-config"`

4. **Production Build**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048" npm run build
   ```
   *Expected Result*: Exits with code 0, generating all static routes.

### 5.2 Invalidation Conditions
The implementation will be considered failed if:
- Any of the 3 unified action buttons has differing text or does not trigger plan execution.
- Any configuration input cards remain visible during simulation execution or in the outcome view.
- Parameters selected prior to running simulation are reset to defaults upon clicking "Back / Modify Parameters".
- Any test in `tests/mission_planner_interactive.test.ts` fails.
- `npx tsc --noEmit` reports any type errors.
