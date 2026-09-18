# Comprehensive Survey Report: Architecture, Tooling, Testing & UI Conventions

**Agent**: Survey Explorer 1 (Architecture, Tooling & Testing)  
**Target Directory**: `/home/dev/Desktop/projects/fb/frontend`  
**Date**: 2026-09-17  
**Status**: Complete  

---

## 1. Observation

### 1.1 Project Structure & File Map
The frontend repository at `/home/dev/Desktop/projects/fb/frontend` is a **Next.js 15 App Router** application written in TypeScript. A full inventory of project files excluding `node_modules`, `.next`, and `.agents` reveals 46 files:

```
/home/dev/Desktop/projects/fb/frontend/
├── ORIGINAL_REQUEST.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── next.config.ts
├── postcss.config.mjs
├── public/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx              # Root landing & module quick-jump
│   ├── dashboard/page.tsx    # Mission Control KPI & Map dashboard
│   ├── mission/page.tsx      # Mission Planner (R1 target)
│   ├── vessel/page.tsx       # Vessel Intelligence & POLARIS RIO
│   ├── environment/page.tsx  # Sea-ice & Metocean forecast
│   ├── icebergs/page.tsx     # Iceberg intelligence & CPA tracking
│   ├── hazards/page.tsx      # Hazard zones & scoring (R4 target)
│   ├── routes/page.tsx       # Route Optimizer & comparison matrix
│   ├── risk/page.tsx         # Risk & Mitigation consequence analysis (R2 target)
│   ├── reports/page.tsx      # Printable mission briefing
│   └── settings/page.tsx     # Preferences & configuration (R3 target)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx      # Topbar, responsive sidebar drawer, page wrapper
│   │   └── Sidebar.tsx       # Grouped navigation bar
│   ├── map/
│   │   └── SimpleMap.tsx     # Equirectangular SVG polar map component
│   ├── routes/
│   │   └── RouteCard.tsx     # Route alternative selection card
│   └── session/
│       └── MissionContext.tsx# Global React Context provider for state
└── lib/
    ├── data.ts               # Static mock datasets (vessels, missions, routes, mitigations)
    └── utils.ts              # Formatting utilities, risk helpers, SVG coordinate mapper
```

### 1.2 Dependencies & Tooling (`package.json`)
Verified directly in `package.json` (lines 1–26):
```json
{
  "name": "fordge-burg-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

Key observations on tooling and libraries:
- **Framework**: Next.js `^15.1.6` (React 19.0.0, React DOM 19.0.0).
- **CSS / Styling**: Tailwind CSS v4 (`tailwindcss` `^4`, `@tailwindcss/postcss` `^4`, `postcss.config.mjs`). Configured via `@import "tailwindcss"` and `@theme` blocks directly in `app/globals.css`.
- **Icons**: `lucide-react` `^0.454.0` is used across all components and navigation.
- **Utility**: `clsx` `^2.1.1` wrapped as `cn(...)` in `lib/utils.ts`.
- **Animation Libraries**: **None installed**. Framer Motion is NOT installed. Animations rely on pure CSS `@keyframes` in `app/globals.css` (`animate-spin`, `animate-pulse-dot`, `animate-slide-in`, `animate-fade-in`).
- **Chart / Visualization Libraries**: **None installed**. Neither Recharts, Chart.js, nor D3 is in `package.json` or `package-lock.json`. Visualizations are implemented using bespoke SVG elements (e.g. `SimpleMap.tsx` and circular progress indicators in `risk/page.tsx`) and styled `div` progress bars.
- **State Management**: **React Context** (`components/session/MissionContext.tsx` via `MissionProvider` and `useMission()`). No external state manager (Redux, Zustand, Jotai).

### 1.3 Test Suites, Test Runners & Build Status
1. **Existing Test Files**:
   - Executed file searches (`find_by_name` matching `*test*` and `*spec*` excluding `node_modules`).
   - Direct observation: **Zero (0) test files exist in the project**. There are no `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files.
2. **Test Scripts in `package.json`**:
   - `package.json` contains only `dev`, `build`, `start`, and `lint`.
   - Executed command: `npm test`
   - Direct observation verbatim output:
     ```
     npm error Missing script: "test"
     npm error 
     npm error To see a list of scripts, run:
     npm error   npm run
     ```
     Exited with code 1.
3. **Existing Test Runners**:
   - Checked `package-lock.json` for `jest`, `vitest`, `cypress`, `playwright`. Result: 0 matches.
   - However, the host environment runs Node.js `v22.23.1`, which natively supports `--experimental-strip-types` and has a built-in test runner (`node --test`). In addition, `/home/dev/.npm-global/bin/tsx` is available in the environment.
4. **Build & Type Check Diagnostics**:
   - Executed: `./node_modules/.bin/tsc --noEmit`
   - Result: Exited with code 2, reporting verbatim:
     ```
     app/dashboard/page.tsx:93:69 - error TS2367: This comparison appears to be unintentional because the types 'SimulationStatus' and '"ready"' have no overlap.

     93             <span className="text-sm font-medium text-text-subtle">{simulationStatus === 'ready' ? 'Live' : 'Planning'}</span>
                                                                            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~


     Found 1 error in app/dashboard/page.tsx:93
     ```
   - Executed: `npm run build` (`next build`)
   - Result: Compiled all pages in 17.7s, but then failed at type-checking with the exact same error in `app/dashboard/page.tsx:93:69`. All other 45 files passed type checking cleanly.
   - Root Cause: In `components/session/MissionContext.tsx:17`, `SimulationStatus` is defined as:
     ```ts
     export type SimulationStatus = "idle" | "running" | "completed";
     ```
     Checking `simulationStatus === 'ready'` is invalid TypeScript. The intent was `simulationStatus === 'completed'`.
     A ready-to-apply patch has been generated at `.agents/teamwork_preview_explorer_survey_1/dashboard_type_fix.patch`.

### 1.4 Application Layout, Routing & Navigation Architecture
- **Root Shell (`app/layout.tsx`)**: Loads Inter font and wraps entire body in `<MissionProvider>`.
- **Global Frame (`components/layout/AppShell.tsx`)**:
  - Desktop sidebar: Fixed sticky `w-64` navigation pane.
  - Mobile drawer: Slide-in overlay with backdrop blur (`backdrop-blur-sm`).
  - Header: Displays active mission name, vessel profile, vessel ice class pill, simulation status badge (`Idle` / `Simulating…` / `Analysis ready`), notification trigger, and "New mission" action button.
  - Content container: `<main className="flex-1 p-4 md:p-6 animate-fade-in">{children}</main>`.
- **Navigation Structure (`components/layout/Sidebar.tsx`)**:
  - Organized into 5 logical groups matching Antarctic Maritime DSS workflow:
    - **OVERVIEW**: `/dashboard` (Mission Control, `LayoutDashboard`)
    - **PLAN**: `/mission` (Mission Planner, `Navigation2`), `/vessel` (Vessel, `Ship`)
    - **INTELLIGENCE**: `/environment` (Environment, `Snowflake`), `/icebergs` (Icebergs, `Compass`), `/hazards` (Hazards, `AlertTriangle`)
    - **OPERATIONS**: `/routes` (Route Optimizer, `GitBranch`), `/risk` (Risk & Mitigation, `ShieldAlert`), `/reports` (Mission Report, `FileText`)
    - **SYSTEM**: `/settings` (Settings, `Settings`)
  - Root `/` (`app/page.tsx`) provides a search bar with fuzzy route dispatching and quick-jump cards.

### 1.5 Theme & Color Palette (`app/globals.css`)
Configured using Tailwind CSS v4 `@theme` design tokens:
- **Navy Palette**:
  - `--color-navy-950`: `#050d1a`
  - `--color-navy-900`: `#0a1930` (Primary action backgrounds, headers, active tabs)
  - `--color-navy-800`: `#122040`
  - `--color-navy-700`: `#1a2e58`
  - `--color-navy-600`: `#234070`
- **Accent Blues**:
  - `--color-blue-600`: `#1e6fd9` (Primary accent, active borders, selected buttons)
  - `--color-blue-500`: `#2e86f5`
  - `--color-blue-400`: `#5aa3f7`
  - `--color-blue-100`: `#dbeafe`
  - `--color-blue-50`: `#eff6ff` (Active selection backgrounds)
- **Surfaces & Canvases**:
  - Canvas: `#f0f4f8` (`bg-canvas`)
  - Surface 1: `#ffffff` (`bg-surface`, card containers)
  - Surface 2: `#f8fafc` (`bg-surface2`, alternating rows, badges)
- **Text Hierarchy**:
  - Primary: `#0a1930` (`text-text-primary`)
  - Secondary: `#3d4f63` (`text-text-secondary`)
  - Muted: `#5b6b7f` (`text-text-muted`)
  - Subtle: `#8fa0b3` (`text-text-subtle`)
- **Risk System (Standardized Color-Coding)**:
  - High Risk: `#c0392b` / bg: `#fef2f2` / border: `border-risk-high/30`
  - Moderate Risk: `#d4910a` / bg: `#fffbeb` / border: `border-risk-med/30`
  - Low Risk: `#1e8449` / bg: `#f0fdf4` / border: `border-risk-low/30`
- **Typography**:
  - Sans: Inter (`var(--font-sans)`)
  - Monospace: JetBrains Mono / Cascadia Code (`var(--font-mono)`) for coordinates, scores, metrics, and nautical telemetry.

### 1.6 Current State of Target Pages (R1–R4 in `ORIGINAL_REQUEST.md`)

| Target Requirement | File Path | Current State & Gaps |
|---|---|---|
| **R1. Mission Planner Enhancements** | `app/mission/page.tsx` | - Basic stepper (`1..5`) and scenario/vessel/horizon selection.<br>- Simulation execution consists of 3 basic `setTimeout` timers (300ms, 700ms, 1200ms) that simply update a number `0 -> 40 -> 80 -> 100`.<br>- **Gaps**: Lacks rich radar scanning, dynamic telemetry logging during calculation phases, visual route tracing, and interactive phase breakdown during simulation runs. |
| **R2. Risk Tab Functionality** | `app/risk/page.tsx` | - Has 4 simple consequence cards and a 7-item mitigation checklist with checkboxes.<br>- **Gaps**: Completely missing charts/visualizations (no risk matrix, no likelihood vs consequence plot, no polar radar charts), no filtering or sorting controls for mitigations, no export functionality (CSV/JSON/print), and no detailed consequence breakdown modals. |
| **R3. Settings Page Redesign** | `app/settings/page.tsx` | - Has basic unit system (nautical/metric), coordinate format (DMS/decimal), risk tolerance, and map layer checkboxes.<br>- **Gaps**: Completely missing simulation configuration options (Monte Carlo iterations, solver algorithms, environmental update intervals, ice model sensitivity) and notification/alert preferences (audio cues, alert severity thresholds, iceberg proximity warning toggles). |
| **R4. Hazard Page Redesign** | `app/hazards/page.tsx` | - Displays 6 static cards in an accordion list with a small side card.<br>- **Gaps**: Lacks spatial/map visualization of hazard polygons, lacks filtering/search by severity or hazard type, visual styling is plain compared to Mission Control/Dashboard, no bathymetric or ice dynamics detail drawer. |

---

## 2. Logic Chain

1. **Premise 1**: From `ORIGINAL_REQUEST.md`, verification must rely on "existing frontend test suites and scripts in the repository to verify the functionality of the updated components," and acceptance criteria requires "Existing test suites pass successfully for the modified components."
2. **Premise 2**: Direct inspection of `package.json` shows no `"test"` script, and searching the filesystem confirms zero test files (`.test.ts` / `.spec.ts`) exist.
3. **Inference 1**: The team cannot run an existing test suite because none exists yet. The build command `npm run build` and type-checking `npx tsc --noEmit` are the primary existing automated verification tools.
4. **Premise 3**: Running `./node_modules/.bin/tsc --noEmit` fails strictly on line 93 of `app/dashboard/page.tsx` with error TS2367 (`simulationStatus === 'ready'`).
5. **Inference 2**: Resolving this single type mismatch (by comparing against `'completed'`) restores full TypeScript compilation cleanliness (0 errors across the entire codebase), unblocking `npm run build`.
6. **Premise 4**: For testing verification moving forward, Node.js v22.23.1 is installed on the system and natively executes TypeScript via `--experimental-strip-types`, or tests can be run via global `tsx --test`.
7. **Inference 3**: A lightweight test suite (e.g. testing `MissionContext`, `lib/utils.ts` formatters and risk classifications, and core calculations) can easily be introduced with a `"test"` script in `package.json` (`tsx --test` or `node --experimental-strip-types --test`) without breaking any existing dependencies.
8. **Premise 5**: No third-party charting (Recharts, Chart.js) or animation (Framer Motion) libraries are present in `package.json`.
9. **Inference 4**: Enhancements for R1–R4 must either:
   - Implement bespoke, high-performance SVG visualizations and CSS animations (following the established design pattern in `SimpleMap.tsx` and `app/globals.css`), OR
   - Propose explicit package installations (e.g. `lucide-react` is already present, `recharts` / `framer-motion` if desired). However, the existing codebase achieves high visual fidelity using custom SVG components and Tailwind v4 keyframe animations, ensuring zero runtime hydration overhead and compatibility with React 19.

---

## 3. Caveats

1. **Read-Only Constraint**: As Survey Explorer 1, this investigation strictly did not modify any source code outside `.agents/teamwork_preview_explorer_survey_1/`. The patch for `app/dashboard/page.tsx` is provided as an artifact for implementers.
2. **Interactive `next lint` Prompt**: Running `npm run lint` directly invokes `next lint`, which pauses for interactive terminal input because ESLint has not been initialized. Downstream agents running automated scripts should invoke `npx tsc --noEmit` or `next build` rather than unconfigured `next lint`.
3. **React 19 Compatibility**: React 19.0.0 is installed. Certain third-party libraries (older versions of Recharts or React 18-bound UI packages) may have peer dependency conflicts if installed without `--legacy-peer-deps`. Custom SVG visualizations (as demonstrated by `SimpleMap.tsx`) avoid all React 19 compatibility hazards.

---

## 4. Conclusion

The application is a well-structured Next.js 15 + React 19 + Tailwind CSS v4 prototype with 11 distinct routes and a centralized `MissionContext`. 

Key survey takeaways for the planning and implementation phases:
1. **Tooling & Architecture**:
   - Next.js 15.1.6 App Router, React 19, Tailwind v4.
   - Central state in `components/session/MissionContext.tsx`.
   - Pure CSS animations in `app/globals.css` and pure SVG data visualizations (`components/map/SimpleMap.tsx`, `lib/utils.ts`).
2. **Current Defects**:
   - Exactly one TypeScript error exists: `app/dashboard/page.tsx:93:69` (`simulationStatus === 'ready'`). Applying `dashboard_type_fix.patch` immediately allows `npx tsc --noEmit` and `npm run build` to pass.
3. **Testing Baseline**:
   - There are currently **no test files** and **no `"test"` script** in `package.json`.
   - A test suite should be created for `lib/utils.ts`, `lib/data.ts`, and component logic, runnable via `npm test` using `tsx --test` or Node 22 native test runner.
4. **Scope Targets (R1–R4)**:
   - **R1 (Mission Planner)**: Expand the simulation phase engine with visual phase transitions, live calculation telemetry feed, and progress visualization.
   - **R2 (Risk Tab)**: Implement interactive risk matrix charts (likelihood × consequence), radar/breakdown visualizers, multi-criteria filtering/sorting, export triggers (CSV/JSON), and detailed breakdown modals.
   - **R3 (Settings Page)**: Add simulation configuration cards (Monte Carlo iterations, solver weights, ice model sensitivity) and alert preference controls (thresholds, audio cues, triggers).
   - **R4 (Hazard Page)**: Redesign into a modern visual command layout featuring an interactive spatial hazard overlay, severity filtering, factor drill-downs, and bathymetric/operational cards.

---

## 5. Verification Method

To independently reproduce and verify all observations:

1. **Verify TypeScript type check**:
   ```bash
   cd /home/dev/Desktop/projects/fb/frontend
   ./node_modules/.bin/tsc --noEmit
   ```
   *Expected output*: Exactly 1 error in `app/dashboard/page.tsx:93:69` (`TS2367: This comparison appears to be unintentional because the types 'SimulationStatus' and '"ready"' have no overlap`).

2. **Verify missing test script**:
   ```bash
   npm test
   ```
   *Expected output*: `npm error Missing script: "test"`, exiting with code 1.

3. **Verify Node & Runner Availability**:
   ```bash
   node -v
   /home/dev/.npm-global/bin/tsx --version
   ```
   *Expected output*: Node `v22.23.1` and `tsx` available.

4. **Verify Application Production Build**:
   ```bash
   npm run build
   ```
   *Expected output*: Next.js compiles routes in ~18s, then fails on the aforementioned TS2367 error in `app/dashboard/page.tsx`.

5. **Verify Patch Resolution**:
   Inspect `.agents/teamwork_preview_explorer_survey_1/dashboard_type_fix.patch`.
   Once line 93 of `app/dashboard/page.tsx` is updated from `'ready'` to `'completed'`, `npx tsc --noEmit` exits 0 with zero errors.
