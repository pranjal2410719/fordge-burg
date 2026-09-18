# Survey & Architecture Report: Mission Planner (R1) & Hazard Page (R4)

## 1. Observation

### 1.1 Project Structure and Tooling
- **Root Directory**: `/home/dev/Desktop/projects/fb/frontend`
- **Framework & Dependencies** (`package.json:11-25`):
  - Next.js: `^15.1.6` (running `15.5.25` in runtime)
  - React / React-DOM: `^19.0.0`
  - Tailwind CSS: `@tailwindcss/postcss ^4`, `tailwindcss ^4`
  - Icons & Utilities: `lucide-react ^0.454.0`, `clsx ^2.1.1`
  - Scripts available: `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`, `"lint": "next lint"`.
  - **No test runner** (vitest, jest, etc.) is currently configured in `package.json`.
- **Global Theme Tokens & Keyframes** (`app/globals.css:1-85`):
  - Theme colors: `--color-navy-950` (#050d1a) to `--color-navy-600` (#234070); accent blues `--color-blue-600` (#1e6fd9) down to `--color-blue-50` (#eff6ff); risk palettes `--color-risk-high` (#c0392b), `--color-risk-med` (#d4910a), `--color-risk-low` (#1e8449).
  - Existing CSS keyframes: `spin`, `pulse-dot`, `slide-in`, `fade-in`.
- **Pre-existing Build Issue** (`app/dashboard/page.tsx:93:69`):
  - Verbatim compiler error during `npm run build` / `npx tsc --noEmit`:
    ```
    app/dashboard/page.tsx:93:69 - error TS2367: This comparison appears to be unintentional because the types 'SimulationStatus' and '"ready"' have no overlap.
    93  <span className="text-sm font-medium text-text-subtle">{simulationStatus === 'ready' ? 'Live' : 'Planning'}</span>
    ```
  - Cause: In `components/session/MissionContext.tsx:17`, `SimulationStatus` is defined as:
    ```typescript
    export type SimulationStatus = "idle" | "running" | "completed";
    ```
    Comparing `simulationStatus === 'ready'` causes TS2367 type check error. All other files pass type checking cleanly.

---

### 1.2 Mission Planner Current Implementation (`app/mission/page.tsx`, `components/session/MissionContext.tsx`)
- **Location**:
  - Page: `/home/dev/Desktop/projects/fb/frontend/app/mission/page.tsx` (272 lines)
  - Context Provider: `/home/dev/Desktop/projects/fb/frontend/components/session/MissionContext.tsx` (104 lines)
  - Data definitions: `/home/dev/Desktop/projects/fb/frontend/lib/data.ts` (lines 40-59: `MISSIONS`, `VESSELS`, `BASELINE_ROUTES`)
- **Simulation Flow & Trigger**:
  - Triggered by button at `app/mission/page.tsx:189`: `<button onClick={runSimulation} disabled={simulationStatus === "running"} ...>`
  - Simulation execution in `components/session/MissionContext.tsx:63-76`:
    ```typescript
    const runSimulation = useCallback(() => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setStatus("running");
      setProgress(0);
      timers.current.push(setTimeout(() => setProgress(40), 300));
      timers.current.push(setTimeout(() => setProgress(80), 700));
      timers.current.push(
        setTimeout(() => {
          setProgress(100);
          setStatus("completed");
        }, 1200)
      );
    }, []);
    ```
  - Duration is fixed at 1200ms with hardcoded jumps to 40% (300ms), 80% (700ms), and 100% (1200ms).
- **Current UI & Visual Elements**:
  - Stepper header (`app/mission/page.tsx:45-57`):
    - Static list: `["1 · Scenario", "2 · Vessel", "3 · Horizon", "4 · Objective", "5 · Run"]`
    - Only step 5 changes style upon completion (`i === 4 && simulationStatus === "completed"`). Steps 1-4 are inert pills with no active/completed visual cues.
  - Parameter Cards (`app/mission/page.tsx:60-177`):
    - 2-column grid (`Mission Scenario`, `Vessel Profile — 5 archetypes`, `Forecast Horizon`, `Optimization Objective`).
    - Basic border / active highlight (`border-blue-600 bg-blue-50 ring-1 ring-blue-600/30`).
  - Simulation Block (`app/mission/page.tsx:180-268`):
    - Subtitle states: *"Executes all 8 engine blocks: environment → icebergs → hazards → vessel → routes → mitigations → consequence → POLARIS."*
    - Running UI (`app/mission/page.tsx:213-231`):
      - Progress bar: Single 8px bar (`h-2 rounded-full bg-border overflow-hidden`) with a blue bar (`bg-blue-600 transition-all duration-300`).
      - Only 3 text phase milestones: `"Phase 1: Env + Icebergs"`, `"Phase 2: Routes + Risk"`, `"Phase 3: Complete"`.
    - Completion UI (`app/mission/page.tsx:234-267`):
      - Green banner: `"Analysis complete — 4 route alternatives ready. View routes →"`
      - 4 small static cards displaying `name`, `averageRiskScore`, `distanceNm`, `etaHours`, `fuelTons`.
  - **Absence of Map**: The interactive Antarctic map (`SimpleMap`) is completely missing from `app/mission/page.tsx`.

---

### 1.3 Hazard Page Current Implementation (`app/hazards/page.tsx`)
- **Location**:
  - Page: `/home/dev/Desktop/projects/fb/frontend/app/hazards/page.tsx` (196 lines)
  - Map reference: `components/map/SimpleMap.tsx:59-71` (contains spatial polygons for hazard zones)
  - Polar Code capability reference: `app/vessel/page.tsx:17-53` (`CAPABILITY_MATRIX`, `computeRIO`)
- **Current Layout & Usability**:
  - Layout (`app/hazards/page.tsx:94-192`):
    - 2-column layout (`grid gap-4 xl:grid-cols-3`):
      - Left 2 columns (`xl:col-span-2`): Vertical stack of 6 clickable cards (`HAZARD_ZONES`).
        - Each card displays: `name`, `severity` (`Critical` | `High` | `Moderate` | `Low`), `type`, `riskScore`, and a risk progress bar.
        - Clicking a card expands an accordion with `Factor Decomposition` (3 horizontal score bars) and a `Recommendation` text block.
      - Right 1 column (`xl:col-span-1`):
        - `Zone Summary`: Counts of zones per severity (Critical: 1, High: 2, Moderate: 2, Low: 1) and average score (65).
        - `Zone Inspector`: If selected, displays duplicate zone name, type, and recommendation. If unselected, displays an empty dashed box: *"Click a hazard zone to open the inspector"*.
  - **Absence of Map**: The page does not render `SimpleMap` or any geospatial visualization despite stating *"6 spatial zones"*.
  - **No Filtering or Sorting**: No search bar, no severity filters, no sorting controls.
  - **No Vessel Awareness**: `import { useMission } from "@/components/session/MissionContext";` is imported at line 4, but never called or utilized. Vessel ice class (e.g. PC2 vs OpenWater) has no impact on the displayed hazard severity.
  - **Visual Aesthetics Discrepancy**: Plain flat white cards, minimal iconography, flat progress bars; lacks the modern rounded-2xl cards, decorative glow blobs, KPI trend badges, and AI badges present in `app/dashboard/page.tsx`.

---

## 2. Logic Chain

### 2.1 Mission Planner Enhancements (R1)
1. **Observation**: `app/mission/page.tsx:185` explicitly promises execution of 8 engine blocks:
   *environment → icebergs → hazards → vessel → routes → mitigations → consequence → POLARIS*.
2. **Observation**: The current simulation runs in 1.2 seconds, uses 3 hardcoded `setTimeout` steps (300ms, 700ms, 1200ms), and displays only 3 generic text labels (`Env + Icebergs`, `Routes + Risk`, `Complete`).
3. **Inference**: Replacing this minimal progress bar with a dynamic **8-Engine-Block Telemetry Pipeline** will directly deliver on the promise of the application architecture, creating a compelling, authentic demo.
4. **Observation**: `SimpleMap.tsx` renders routes, waypoints, and hazard zones, but is only used on `dashboard`, `routes`, `icebergs`, and `environment` — it is not on `app/mission/page.tsx`.
5. **Inference**: Integrating an interactive simulation preview map or live computational radar canvas directly into `app/mission/page.tsx` will transform the mission planner from a static form into an immersive command center.
6. **Observation**: Stepper steps 1 to 4 are static pills without step validation or progress feedback.
7. **Inference**: Converting the header stepper into an interactive status track with parameter summaries and checkmarks provides visual polish and seamless UX.
8. **Observation**: Completion currently reveals 4 static cards with a simple fade-in.
9. **Inference**: Staggered animated reveals, route comparison highlights, and direct action CTAs ("Inspect in Route Optimizer", "Simulate Again") create a cohesive demo climax.

### 2.2 Hazard Page Redesign (R4)
1. **Observation**: `app/hazards/page.tsx` currently displays spatial zones as plain text cards without a map, while `components/map/SimpleMap.tsx` already contains Antarctic polygon coordinates and rendering for hazard zones.
2. **Inference**: Adding an integrated Antarctic hazard map (or toggleable split Map/Card view) restores critical spatial context for maritime navigation.
3. **Observation**: `app/dashboard/page.tsx:30-71` sets the standard design language for the application: `rounded-2xl`, subtle borders (`border-border/60`), gradient cards (`from-surface to-surface2`), decorative glow blobs, KPI status badges, and Lucide icons.
4. **Inference**: Upgrading `app/hazards/page.tsx` with a top-level Hero KPI Metric strip (Active Zones, Critical Hotspots, Average Risk, Vessel Vulnerability) brings it to visual parity with the rest of the application.
5. **Observation**: The right column "Zone Inspector" duplicates content already shown in the expanded left card.
6. **Inference**: Replacing the redundant inspector with an interactive detail drawer/panel or synchronized map inspector eliminates dead screen space.
7. **Observation**: `useMission` is imported in `app/hazards/page.tsx:4` but never invoked. In Antarctic navigation, hazard severity is inherently relative to the vessel's hull class (`PC2` vs `OpenWater`).
8. **Inference**: Leveraging `useMission()` to display vessel-specific Polar Code warnings (e.g. "Restricted for OpenWater", "Permitted for PC2") dramatically improves operational realism and usability.
9. **Observation**: There are no search or filtering mechanisms for the 6 zones.
10. **Inference**: Adding severity filter pills ("All", "Critical", "High", "Moderate", "Low"), category filters, and a search input directly fulfills usability acceptance criteria.

---

## 3. Caveats

- **No Existing Automated Test Suite**: The repository currently lacks automated testing frameworks (`vitest`, `jest`, `@testing-library/react`). Verification must rely on TypeScript compiler verification (`npx tsc --noEmit`), Next.js production builds (`npm run build`), and UI verification.
- **Pre-existing Type Error in Dashboard**: `app/dashboard/page.tsx:93` contains a type error (`simulationStatus === 'ready'`). While this file is outside R1/R4, fixing it or noting it for the orchestrator is required for `npm run build` to pass cleanly.
- **Map Component Reusability**: `components/map/SimpleMap.tsx` currently accepts `selectedRouteId` and `onSelectRoute`. To display hazard zones interactively (highlighting clicked hazard zones), `SimpleMap` may either be extended with `selectedHazardId?: string` or wrapped with hazard overlay props.

---

## 4. Conclusion & Proposed Implementation Blueprint

### 4.1 R1: Mission Planner Enhancement Blueprint
1. **Interactive Engine Pipeline (`app/mission/page.tsx`)**:
   - Create an 8-stage visual pipeline:
     1. Metocean & Sea Ice Dynamics (`Snowflake`)
     2. Iceberg Drift & CPA Vectors (`Compass`)
     3. Spatial Hazard Zone Polygons (`AlertTriangle`)
     4. Vessel Polar Class Limits (`Ship`)
     5. Multi-Objective A* Pathfinding (`GitBranch`)
     6. Tactical Mitigation Synthesis (`ShieldCheck`)
     7. Consequence & Besetment Matrix (`Activity`)
     8. POLARIS RIO Certification (`CheckCircle2`)
   - Include real-time streaming calculation log / HUD during the run.
   - Introduce customizable simulation speeds (e.g., "Full Diagnostic Run" 2.5s vs "Fast Scan" 1.0s).
2. **Embedded Simulation Map Canvas**:
   - Embed an active map visual showing waypoint path projection, animated pulse rings, and hazard avoidance during simulation.
3. **Enhanced Stepper & Configuration Cards**:
   - Modernized parameter cards with micro-interactions, vessel specification badges, and route distance chips.
   - Dynamic top stepper highlighting active step completion.
4. **Staggered Results Presentation**:
   - Staggered CSS animation reveal for the 4 route alternatives with recommended route highlight badge and quick-action buttons.

### 4.2 R4: Hazard Page Redesign Blueprint
1. **Hero KPI Metric Strip**:
   - 4 summary cards matching Dashboard aesthetic:
     - Total Monitored Zones (`6 Zones`)
     - Critical Alerts (`1 Critical / 2 High`)
     - Average Sector Risk (`65/100`)
     - Vessel Vulnerability Status (calculated dynamically from `vessel.iceClass`)
2. **Interactive Spatial Map & View Switcher**:
   - Integrated map view displaying Antarctic hazard zones, highlighted polygons, and route intersection corridors.
   - View mode toggle: "Split View (Map + Cards)", "Card Grid", or "Matrix Table".
3. **Filter, Search, & Sort Bar**:
   - Severity filter chips with counts (`All (6)`, `Critical (1)`, `High (2)`, `Moderate (2)`, `Low (1)`).
   - Search bar for quick keyword filtering.
   - Sort dropdown (Risk Score High→Low, Severity, Name).
4. **Vessel-Aware Polar Code / POLARIS Threat Indicators**:
   - Connect to `useMission()` to render hull-specific operational guidance on each hazard card (e.g. PC2 vs PC4 vs OpenWater suitability).
5. **Polished Card Aesthetics & Action Badges**:
   - Lucide icons for hazard classifications (`AlertOctagon`, `Compass`, `Waves`, `Anchor`, `Layers`).
   - Visual factor gauges with color-coded score thresholds.
   - Structured action tags: `Icebreaker Escort`, `Continuous Echo Sounder`, `Daylight Only`, `Speed ≤ 2.5 kn`.

---

## 5. Verification Method

### 5.1 Pre-requisite Fix for Clean Verification
Before verifying builds, fix line 93 in `app/dashboard/page.tsx`:
```diff
- <span className="text-sm font-medium text-text-subtle">{simulationStatus === 'ready' ? 'Live' : 'Planning'}</span>
+ <span className="text-sm font-medium text-text-subtle">{simulationStatus === 'completed' ? 'Live' : 'Planning'}</span>
```

### 5.2 Verification Commands
1. **Type Checking**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected outcome*: Zero errors across all `.ts` and `.tsx` files.
2. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected outcome*: Successful Next.js production build (`Compiled successfully`, zero exit code).
3. **Runtime & UI Inspection**:
   ```bash
   npm run dev
   ```
   - Navigate to `/mission`:
     - Test changing scenario, vessel, horizon, and objective.
     - Trigger simulation: verify 8-block pipeline animation, progress indicator, and smooth completion state.
   - Navigate to `/hazards`:
     - Verify hero KPI cards render correctly with active vessel context.
     - Test severity filtering, search input, and sorting.
     - Verify map integration and interactive card selection synchronization.
