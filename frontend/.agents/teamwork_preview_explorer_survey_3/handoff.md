# Survey Explorer 3: Handoff Report — Risk Tab (R2) & Settings Page (R3)

**Author:** Survey Explorer 3  
**Working Directory:** `/home/dev/Desktop/projects/fb/frontend/.agents/teamwork_preview_explorer_survey_3/`  
**Workspace Root:** `/home/dev/Desktop/projects/fb/frontend`  
**Date:** 2026-09-17  
**Type:** Hard Handoff (Investigation & Architecture Survey Complete)

---

## 1. Observation

### 1.1 Scope Definition & Requirements (ORIGINAL_REQUEST.md)
*Source: `ORIGINAL_REQUEST.md:21-26, 40-41`*
```markdown
### R2. Risk Tab Functionality
Add new charts, data visualizations, advanced filtering/sorting, export functionality, and detailed breakdown modals to the risk tab.

### R3. Settings Page Redesign
Redesign the settings page to include simulation configuration options and notification/alert preferences.

### Acceptance Criteria
- [ ] Risk tab successfully renders new charts and allows filtering/exporting data.
- [ ] Settings page allows toggling simulation configurations and alert preferences.
```

---

### 1.2 Risk Tab Current Implementation (`app/risk/page.tsx`)
*Source: `app/risk/page.tsx:1-170`*
1. **Location & Routing:**
   - File: `/home/dev/Desktop/projects/fb/frontend/app/risk/page.tsx`
   - Route: `/risk`
   - Navigation entry: Defined in `components/layout/Sidebar.tsx:47`:
     `{ href: "/risk", label: "Risk & Mitigation", icon: ShieldAlert }`
2. **Current Visualizations & Data Models:**
   - Uses `useMission()` from `@/components/session/MissionContext.tsx` to read:
     - `selectedRoute: RouteAlternative` (`lib/data.ts:28-38`)
     - `vessel: Vessel` (`lib/data.ts:8-18`)
   - Computes 4 consequence metrics (`app/risk/page.tsx:36-41`):
     - `besetment`: score `isOpenWater ? 75 : 35`, value `isOpenWater ? "High" : "Moderate"`
     - `delay`: score `Math.round(risk / 10) * 10`, value `${Math.round(risk / 10)} hrs`
     - `fuel`: score `Math.round(risk / 5) * 5`, value `${Math.round(risk / 5)}%`
     - `disruption`: score `risk > 50 ? 70 : 30`, value `risk > 50 ? "High" : "Low"`
   - **Data Visualizations present:**
     - 4 simple horizontal progress bars (`h-1.5 rounded-full bg-border overflow-hidden` with `riskBar(c.score)` at lines 68-70).
     - 1 circular SVG progress ring tracking mitigation acknowledgments (`app/risk/page.tsx:87-96`):
       `<svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">`
     - **No real charts exist:** No bar chart, radar/spider chart, line/area chart, or multi-dimensional risk matrix exists in the tab.
3. **Filtering & Sorting:**
   - **Current State:** Completely absent (`app/risk/page.tsx:114`). The 7 items in `MITIGATIONS` are rendered directly via `MITIGATIONS.map(...)` in static array order.
   - There are no status filters (mandatory vs. recommended vs. advisory), no acknowledgment filters (all vs. unacknowledged vs. acknowledged), no search input, and no sorting controls (by priority, title, status).
4. **Export Functionality:**
   - **Current State:** None exists on `/risk`.
   - In contrast, `/reports` has a print button calling `window.print()` (`app/reports/page.tsx:30`), but `/risk` has zero export capability (no CSV, no JSON, no PDF/print).
5. **Breakdown Modals:**
   - **Current State:** None exists. A codebase-wide grep for `modal` confirms zero modal components exist across the entire repository.
   - Clicking consequence cards currently does nothing.
   - Clicking mitigation items only toggles acknowledgment checkbox state (`acked` dictionary).

---

### 1.3 Settings Page Current Implementation (`app/settings/page.tsx`)
*Source: `app/settings/page.tsx:1-227`*
1. **Location & Routing:**
   - File: `/home/dev/Desktop/projects/fb/frontend/app/settings/page.tsx`
   - Route: `/settings`
   - Navigation entry: Defined in `components/layout/Sidebar.tsx:54`:
     `{ href: "/settings", label: "Settings", icon: Settings }`
2. **Current Settings Options:**
   - **Unit System** (`app/settings/page.tsx:22`): `"nautical" | "metric"` (radio cards; notes that metric is not applied).
   - **Coordinate Format** (`app/settings/page.tsx:23`): `"dms" | "decimal"` (radio cards with examples).
   - **Risk Tolerance** (`app/settings/page.tsx:24`): `"conservative" (30/100)`, `"standard" (50/100)`, `"aggressive" (70/100)`.
   - **Map Preferences** (`app/settings/page.tsx:25-29`):
     - Layer toggles: `ice`, `icebergs`, `hazards`, `routes`
     - Auto-center toggle: boolean
     - Soundings Depth slider: 20m - 100m (step 5m)
   - Reset Defaults button (`app/settings/page.tsx:31-38`).
3. **State Storage & Persistence:**
   - Purely local component state using React `useState` (`app/settings/page.tsx:22-29`).
   - Line 20 calls `const { } = useMission();` without extracting or storing anything.
   - Not connected to `MissionContext`, nor persisted in `localStorage`.
   - Explicitly described in UI at line 46: `"In-memory preferences — reset on page reload"`.
4. **Missing R3 Requirements:**
   - **Simulation Configuration Options:** Zero options exist.
   - **Notification / Alert Preferences:** Zero options exist.

---

### 1.4 Dependencies & Tooling Ecosystem (`package.json`)
*Source: `package.json:1-27`*
- Next.js 15.1.6, React 19.0.0, React DOM 19.0.0
- Tailwind CSS v4 (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`)
- Icons: `lucide-react: ^0.454.0`
- Class utilities: `clsx: ^2.1.1`
- **Charting libraries:** None installed (no `recharts`, `chart.js`, `victory`, etc.).
- **CSS / Styling:** Tailwind CSS v4 `@theme` in `app/globals.css:1-48` provides color tokens:
  `--color-navy-950` through `--color-navy-600`, `--color-blue-600` through `--color-blue-50`, `--color-risk-high`, `--color-risk-med`, `--color-risk-low`, and `--color-canvas`, `--color-surface`, `--color-surface2`.
- **Animations:** Custom CSS keyframes in `app/globals.css:70-78`: `animate-spin`, `animate-pulse-dot`, `animate-slide-in`, `animate-fade-in`.

---

### 1.5 Test Suites & Build Diagnostics
*Tool command: `npm run build`*
- Build command failed with:
  ```text
  ./app/dashboard/page.tsx:93:69
  Type error: This comparison appears to be unintentional because the types 'SimulationStatus' and '"ready"' have no overlap.
    91 |           <div className="flex items-center gap-2 mb-1">
    92 |             <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-600/10">Active Mission</span>
  > 93 |             <span className="text-sm font-medium text-text-subtle">{simulationStatus === 'ready' ? 'Live' : 'Planning'}</span>
       |                                                                     ^
  ```
- *Cause:* `components/session/MissionContext.tsx:17` defines `SimulationStatus = "idle" | "running" | "completed"`. `app/dashboard/page.tsx:93` mistakenly compared with `'ready'`.
- *Automated test runner:* No test scripts (`"test"`) exist in `package.json`. No Jest or Vitest setup currently exists. Verification relies on `tsc --noEmit` and `npm run build`.

---

## 2. Logic Chain

### 2.1 Risk Tab Enhancement Strategy (R2)
1. **Observation 1.2:** Currently, `app/risk/page.tsx` contains only 4 progress bars and an ack ring. No charts exist, and no charting library is installed (Observation 1.4).
2. **Inference:** Because React 19 and Tailwind v4 are used, adding an external charting library may introduce bundle bloat or React 19 peer dependency conflicts. Clean SVG-based data visualizations (such as used in `components/map/SimpleMap.tsx` and `app/risk/page.tsx:87-96`) provide pixel-perfect, interactive, responsive visualizations without any external dependencies.
3. **Recommended Visualizations for R2:**
   - **Chart A: Waypoint Risk Exposure Profile (Area/Bar chart):** Plots risk scores across the 5 voyage waypoints (`WAYPOINTS` from `app/reports/page.tsx:9-15`: Maxwell Bay -> Antarctic Sound -> Active Pass Choke -> Weddell Entry -> Weddell Outpost Alpha). Shows where risk spikes (e.g. at Active Pass Choke and Weddell Entry).
   - **Chart B: Multi-Factor Risk Radar / Spider Diagram:** Compares consequence dimensions (Besetment, Delay, Fuel Reserve, Disruption, Ice Pressure, Hull Exposure) between the baseline route and mitigated route.
   - **Chart C: Route Alternatives Risk Comparison:** Compares average vs. maximum risk scores across the 4 routes (`shortest`, `safest`, `fuel_efficient`, `balanced`).
4. **Filtering & Sorting for Mitigations:**
   - Add status filter pills: `All`, `Mandatory`, `Recommended`, `Advisory`.
   - Add acknowledgment filter pills: `All`, `Pending`, `Acknowledged`.
   - Add text search bar for mitigation title/detail.
   - Add sort dropdown / toggles: Priority (`Mandatory` -> `Recommended` -> `Advisory`), Name (A-Z), Acknowledged status.
5. **Export Functionality:**
   - Add "Export Data" dropdown / action group:
     - **Export CSV:** Formats route risk summary, consequence scores, and mitigation items into a downloadable CSV blob (`data:text/csv;charset=utf-8,...`).
     - **Export JSON:** Generates machine-readable telemetry JSON with vessel, route, consequence scores, and mitigation ack status.
     - **Print / PDF:** Invokes `window.print()` with a print-optimized stylesheet.
6. **Detailed Breakdown Modals:**
   - Create a reusable, accessible Modal dialog component with backdrop blur, keyboard escape listener, and smooth fade/scale animations (`animate-fade-in`).
   - **Consequence Breakdown Modal:** Triggered on consequence card click. Displays factor decomposition (ice thickness, besetment probability, drift velocity), historical baseline comparison, vessel limits, and recommended tactics.
   - **Mitigation Detail Modal:** Triggered on mitigation row click. Displays full SOP, IMO Polar Code regulatory reference, hull class applicability (PC2/PC4/PC5/OpenWater), and expected risk reduction percentage.

---

### 2.2 Settings Page Redesign Strategy (R3)
1. **Observation 1.3:** Settings in `app/settings/page.tsx` are completely ephemeral (`useState`), and line 20 has an empty context call `const { } = useMission();`.
2. **Inference:** To fulfill R3 ("Settings page allows toggling simulation configurations and alert preferences") with a polished user experience, settings must include dedicated sections for Simulation Configurations and Alert Preferences, and should persist to `localStorage` (with SSR fallback) and/or `MissionContext`.
3. **Recommended Settings Architecture for R3:**
   - **Simulation Configuration Section:**
     - *Engine Fidelity:* Fast (100 Monte Carlo iterations) / Balanced (500 iterations) / High-Fidelity (1,000 iterations).
     - *Simulation Speed / Time Step:* 1x Real-time, 5x Accelerated, 10x Turbo.
     - *Dynamic Ice Drift Model:* Toggle (Dynamic forecast integration vs. Static ice field).
     - *Environmental Uncertainty Margin:* Conservative (+20% safety envelope) vs. Standard (Nominal).
     - *Auto-recalculate on Parameter Change:* Toggle (auto-trigger simulation on route or vessel change).
   - **Alert & Notification Preferences Section:**
     - *Iceberg Proximity Alarm:* Minimum CPA alert threshold slider (e.g. 3.0 NM to 10.0 NM, default 5.0 NM mandatory standoff).
     - *Besetment Risk Alert:* Threshold trigger toggle (alert Master if besetment probability exceeds 50%).
     - *Hazard Zone Warning:* Push / banner alert when entering High/Critical hazard zones (e.g. Larsen Fast Ice).
     - *Severe Weather / Wind Warnings:* Toggle for winds > 25 kn.
     - *Audio Chime / Alert Sound:* Toggle for sound alerts.
     - *Notification Display Mode:* Toast banner vs. Topbar badge vs. Modal interruption.
   - **Persistence:**
     - Use a `useSettings` hook or extend `MissionContext` with `localStorage` synchronization (key: `fordgeburg_settings_v1`).
     - Provide a working "Reset to Defaults" button that resets both state and storage.

---

## 3. Caveats
1. **No External Charting Dependency:** The repository does not include Recharts or Chart.js. We recommend using native React SVG components for charts. This guarantees zero version conflicts with React 19, zero bundle overhead, and complete design-system fidelity.
2. **Build Error in `app/dashboard/page.tsx`:** `npm run build` currently errors on line 93 of `app/dashboard/page.tsx` due to `simulationStatus === 'ready'`. While this file is outside R2/R3, fixing this single line (`simulationStatus === 'completed'`) will be required to run `npm run build` during Milestone 5 verification.
3. **No Existing Automated Unit Tests:** Verification of R2 and R3 functionality will rely on Next.js build compilation (`npm run build`), TypeScript typechecking (`npx tsc --noEmit`), and browser interaction verification.

---

## 4. Conclusion & Architecture Blueprint

### 4.1 File Inventory for R2 & R3
| Component / Purpose | File Path | Status | Planned Action |
|---|---|---|---|
| **Risk Tab Page** | `app/risk/page.tsx` | Existing | Complete overhaul with SVG charts, filtering/sorting, export triggers, and modal handlers |
| **Risk Charts Component** | `components/risk/RiskCharts.tsx` | New | SVG Waypoint Risk Profile, Radar Multi-Factor Chart, and Route Comparison Chart |
| **Risk Breakdown Modal** | `components/risk/ConsequenceModal.tsx` | New | Factor decomposition and operational guidance modal |
| **Mitigation Detail Modal** | `components/risk/MitigationModal.tsx` | New | SOP, Polar Code reference, and hull class compatibility modal |
| **Settings Page** | `app/settings/page.tsx` | Existing | Complete redesign with Simulation Configs, Alert Preferences, and persistence |
| **Settings Context/Storage** | `lib/settings.ts` or `components/session/MissionContext.tsx` | Update/New | Typed interfaces and persistent storage for settings |
| **Data Models** | `lib/data.ts` | Existing | Add extended interfaces: `ConsequenceDetail`, `SimulationConfig`, `AlertPreferences` |

---

### 4.2 Proposed Data Model Extensions

```typescript
// Proposed extensions in lib/data.ts or dedicated types

export interface WaypointRiskPoint {
  id: string;
  name: string;
  lat: string;
  lon: string;
  distNm: number;
  iceConc: number; // 0-10
  riskScore: number; // 0-100
  besetmentRisk: number; // 0-100
  hazardProximityNm: number;
}

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
  highContrastFlash: boolean;
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **TypeScript Typecheck:**
   ```bash
   npx tsc --noEmit
   ```
2. **Next.js Production Build:**
   ```bash
   npm run build
   ```
   *(Note: requires resolving line 93 in `app/dashboard/page.tsx` where `'ready'` was used instead of `'completed'`)*.

### 5.2 Manual & UI Verification Matrix
- **Risk Tab (`/risk`):**
  - [ ] Render Waypoint Risk Exposure SVG chart, Radar Risk chart, and Route Comparison chart.
  - [ ] Filter mitigations by Status (`Mandatory`, `Recommended`, `Advisory`, `All`).
  - [ ] Filter mitigations by Acknowledged state (`Pending`, `Acknowledged`, `All`).
  - [ ] Sort mitigations by Priority and Title.
  - [ ] Click "Export CSV" and verify download of formatted CSV file.
  - [ ] Click "Export JSON" and verify download of machine-readable JSON.
  - [ ] Click "Print Report" and verify browser print dialog launches.
  - [ ] Click any consequence card (e.g. Besetment Risk) and verify breakdown modal appears with detailed factors, Polar Code clause, and close button.
  - [ ] Click any mitigation item to open the detailed mitigation SOP modal.
- **Settings Page (`/settings`):**
  - [ ] Verify Simulation Configuration controls (Engine Fidelity, Time Step, Dynamic Ice Drift toggle, Auto-resimulate toggle).
  - [ ] Verify Alert & Notification Preferences (Iceberg CPA slider, Besetment alert threshold, Hazard warnings toggle, Sound alerts toggle).
  - [ ] Toggle options, reload page, and confirm preferences remain persisted in `localStorage`.
  - [ ] Click "Reset Defaults" and verify preferences revert to initial state.

### 5.3 Invalidation Conditions
- An implementation is invalid if it uses heavyweight chart libraries that fail to compile under React 19.
- An implementation is invalid if it fails `npm run build` or introduces unhandled hydration mismatches.
- An implementation is invalid if Settings toggle states are lost upon navigation between routes.
