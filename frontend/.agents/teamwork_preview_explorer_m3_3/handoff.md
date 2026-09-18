# Milestone 3 Explorer Handoff: Detailed Breakdown Modals & UX Integration

**Author:** Explorer Agent (`teamwork_preview_explorer_m3_3`)  
**Working Directory:** `/home/dev/Desktop/projects/fb/frontend/.agents/teamwork_preview_explorer_m3_3/`  
**Workspace Root:** `/home/dev/Desktop/projects/fb/frontend`  
**Date:** 2026-09-18  
**Handoff Type:** Hard Handoff (Investigation & Architecture Specification Complete)

---

## 1. Observation

### 1.1 Requirements & Scope Definition
From `/home/dev/Desktop/projects/fb/frontend/.agents/ORIGINAL_REQUEST.md:21-23`:
> "### R2. Risk Tab Functionality
> Add new charts, data visualizations, advanced filtering/sorting, export functionality, and detailed breakdown modals to the risk tab."

From `/home/dev/Desktop/projects/fb/frontend/.agents/PROJECT.md:21, 64-77`:
> "Feature 9: R2: Consequence & Mitigation Modals — Accessible modal dialogs for consequence factor decomposition and mitigation SOP / Polar Code regulations (Milestone 3)"

From dispatch instructions:
> 1. Consequence Breakdown Modal:
>    - Triggered by clicking consequence cards (Besetment, Delay, Fuel, Disruption).
>    - Shows detailed factor decomposition, historical Arctic/Antarctic baseline comparison, IMO Polar Code clauses, prevention tactics, and vessel limits.
> 2. Mitigation SOP & Detail Modal:
>    - Triggered by clicking mitigation items.
>    - Displays full Standard Operating Procedure, regulatory reference (Polar Code Ch. 1-12), vessel ice-class applicability (PC2, PC4, PC5, Open Water), and expected risk reduction.
> 3. Accessible Modal Architecture:
>    - Dialog overlay with backdrop blur, keyboard ESC dismissal, focus trapping, smooth entry animation (`animate-fade-in`), and accessible ARIA attributes.
> 4. Seamless integration with `app/risk/page.tsx` and `useMission()` without breaking any existing tests.

### 1.2 Current Implementation in `app/risk/page.tsx`
*Source: `/home/dev/Desktop/projects/fb/frontend/app/risk/page.tsx:22-45, 62-75, 113-158`*
1. **Consequence Grid (`app/risk/page.tsx:62-75`):**
   - Renders 4 consequence cards (`besetment`, `delay`, `fuel`, `disruption`):
   ```tsx
   const consequences = [
     { key: "besetment",  label: "Besetment Risk",    score: isOpenWater ? 75 : 35, value: isOpenWater ? "High" : "Moderate" },
     { key: "delay",      label: "Transit Delay Risk", score: Math.round(risk / 10) * 10, value: `${Math.round(risk / 10)} hrs` },
     { key: "fuel",       label: "Fuel Penalty",       score: Math.round(risk / 5) * 5,   value: `${Math.round(risk / 5)}%` },
     { key: "disruption", label: "Route Disruption",   score: risk > 50 ? 70 : 30,        value: risk > 50 ? "High" : "Low" },
   ];
   ```
   - Currently rendered as static non-interactive `<div>` containers. Clicking them produces zero action.
2. **Mitigation List (`app/risk/page.tsx:113-158`):**
   - Renders 7 items from `MITIGATIONS` (`lib/data.ts:68-76`).
   - The only interactive element is the acknowledge button toggling local `acked` state (`setAcked((s) => ({ ...s, [m.id]: !s[m.id] }))`).
   - There is no SOP inspection action, no link, and no detailed regulatory or procedural view.
3. **Modal Infrastructure:**
   - Search across the codebase reveals **zero** existing modal or dialog components (`grep_search` found 0 matches for `dialog`).
   - No external dialog libraries (e.g. Radix UI, Headless UI, Floating UI) are installed in `package.json:12-18`.

### 1.3 Active Design Tokens & Animation Primitives
*Source: `/home/dev/Desktop/projects/fb/frontend/app/globals.css:1-85`*
- Color tokens available via Tailwind CSS v4 `@theme`:
  - Navy: `--color-navy-950` (`#050d1a`), `--color-navy-900` (`#0a1930`), `--color-navy-800` (`#122040`), `--color-navy-700` (`#1a2e58`), `--color-navy-600` (`#234070`)
  - Accent blue: `--color-blue-600` (`#1e6fd9`), `--color-blue-500` (`#2e86f5`), `--color-blue-400` (`#5aa3f7`), `--color-blue-100` (`#dbeafe`), `--color-blue-50` (`#eff6ff`)
  - Surface: `--color-canvas` (`#f0f4f8`), `--color-surface` (`#ffffff`), `--color-surface2` (`#f8fafc`)
  - Risk: `--color-risk-high` (`#c0392b`), `--color-risk-high-bg` (`#fef2f2`), `--color-risk-med` (`#d4910a`), `--color-risk-med-bg` (`#fffbeb`), `--color-risk-low` (`#1e8449`), `--color-risk-low-bg` (`#f0fdf4`)
  - Text & Border: `--color-text-primary`, `--color-text-muted`, `--color-text-subtle`, `--color-border`, `--color-border-strong`
- Existing animation classes in `app/globals.css:73, 78`:
  ```css
  @keyframes fade-in { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
  .animate-fade-in { animation: fade-in 0.18s ease; }
  ```

### 1.4 Test Suite Baseline
- `npm test` runs Node.js built-in test runner via `tsx --test tests/**/*.test.ts`.
- Command execution confirms: **50 tests across 22 test suites pass with 0 failures** (execution duration: ~4.2s).
- `tests/data_and_utils.test.ts:125-150` validates `MITIGATIONS` length (7 items) and required fields (`id`, `title`, `detail`, `status`).

---

## 2. Logic Chain

### 2.1 Consequence Breakdown Modal Strategy
1. **Observation 1.2:** Consequence cards currently calculate dynamic scores (`besetment`: 75 or 35; `delay`: 0-100 hrs; `fuel`: 0-100%; `disruption`: 30 or 70) based on `selectedRoute` and `vessel.iceClass`.
2. **Deduction:** The Consequence Breakdown Modal must receive the dynamic `score`, `value`, `vessel`, and `selectedRoute` as props to compute and contextualize factor decomposition, historical baselines, and vessel operational limits in real-time.
3. **Interactive Affordance:** Transforming the static card `<div>` into an accessible button (`role="button"`, `tabIndex={0}`, hover elevation with border tint `hover:border-blue-400`, cursor pointer, and an inspection affordance "Breakdown →") immediately alerts operators that deep telemetry is available on click.
4. **Content Architecture:**
   - **Factor Decomposition:** 4 weighted constituent factors totaling 100%, showing relative contribution, impact severity tag (`HIGH`, `MODERATE`, `LOW`), and physical metocean/ice mechanics.
   - **Historical Polar Baseline:** 10-year decadal benchmark (Weddell/Ross Sea 2014-2024 voyages), delta deviation (`+X% above decadal mean`), seasonal percentile (e.g. 68th percentile), and climatological narrative (e.g. Southern Annular Mode anomalies).
   - **IMO Polar Code Clauses:** Part I-A statutory citations (Ch. 6 Machinery, Ch. 9 Navigation, Ch. 11 Voyage Planning, Ch. 1 General Risk Assessment) and POLARIS (MSC.1/Circ.1519) compliance rules.
   - **Tactical Prevention Actions:** 4 concrete bridge commands and maneuvering protocols.
   - **Vessel Limits & Real-Time Alerts:** Vessel ice-class capability check (`PC2`, `PC4`, `PC5`, `OpenWater`), ice speed ceiling (`vessel.iceLimitKn`), and a prominent dynamic alert banner (e.g., Red restriction warning for OpenWater hulls).

### 2.2 Mitigation SOP & Detail Modal Strategy
1. **Observation 1.2:** In the mitigation checklist, clicking a row currently only toggles the checkbox `acked` state.
2. **Separation of Concerns:** Toggling acknowledgment and opening the detailed SOP modal must have clear, separate hit targets. The checkbox button remains dedicated to `onToggleAcknowledge()`, while clicking the row title/body or a dedicated "Inspect SOP" action opens `MitigationModal`.
3. **Content Architecture:**
   - **3-Phase SOP:** Pre-Entry Verification, Active Execution & Maneuvering, and Contingency / Abort Criteria, plus responsible bridge and engine watch roles.
   - **IMO Polar Code Regulatory Reference:** Exact Polar Code chapters (1 through 12), regulations, and statutory intent.
   - **Vessel Ice-Class Applicability Matrix:** Interactive 4-tier matrix (`PC2`, `PC4`, `PC5`, `OpenWater`) with status badges (`Mandatory`, `Recommended`, `Advisory`, `Prohibited`) and special visual highlighting on the active vessel's class (`activeVesselClass`).
   - **Quantified Risk Reduction Impact:** Quantitative risk score delta (e.g. `-24 pts`), percentage reduction (e.g. `-32%`), empirical confidence rating, and secondary co-benefits.
   - **Synchronized Acknowledgment Action:** The modal footer provides an immediate "Acknowledge Measure" button that syncs directly with the parent page's `acked` state.

### 2.3 Accessible Modal Dialog Architecture
1. **Observation 1.2 & 1.4:** No third-party UI primitives exist in the repo. Adding heavy external dependencies could introduce React 19 hydration issues or bundle bloat.
2. **Native Lightweight Accessible Architecture:**
   - **Overlay Backdrop:** `fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/70 backdrop-blur-sm animate-fade-in`.
   - **Outside Click Dismissal:** Backdrop click handler triggers `onClose()`, while `e.stopPropagation()` on the modal card prevents accidental closing during interaction.
   - **Keyboard ESC Listener:** Global `keydown` event listener attached when modal opens, cleaned up on unmount or close.
   - **Scroll Locking:** Modal sets `document.body.style.overflow = "hidden"` on open and cleanly restores original overflow on close.
   - **Focus Trapping:** Focus is set to the modal dialog card or close button upon mount. A `keydown` trap intercepts `Tab` / `Shift+Tab` to wrap focus within the modal's focusable elements. Upon closing, focus is restored to the initiating trigger element.
   - **WAI-ARIA Attributes:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="<id>"`, `aria-describedby="<id>"`, and `aria-label="Close dialog"` on dismissal buttons.

---

## 3. Caveats

1. **Read-Only Explorer Discipline:** In strict adherence to Explorer constraints, zero source files have been modified or created during this investigation. All specifications below are ready for the M3 Worker to implement directly.
2. **Coexistence with M3_1 & M3_2 Features:**
   - Explorer M3_1 is designing SVG charts (`RiskCharts.tsx`).
   - Explorer M3_2 is designing filtering, sorting, and telemetry export (`MitigationControls.tsx`).
   - The modal system is designed as standalone components (`components/risk/ConsequenceModal.tsx`, `components/risk/MitigationModal.tsx`, and `components/risk/RiskModalBase.tsx`). This allows the M3 Worker to integrate the modals with zero merge conflicts or inter-dependencies with the charts or filter controls.
3. **Data Model Immutability:** `lib/data.ts`'s existing `MITIGATIONS` export is tested by `tests/data_and_utils.test.ts:125-150` for exact structure. Rather than mutating `MITIGATIONS`, the extended SOP and Consequence details are housed in a dedicated helper lookup dataset (`lib/riskDetailData.ts` or exported alongside `lib/data.ts`), ensuring 100% test compatibility.

---

## 4. Conclusion & Complete Architectural Specification

### 4.1 Component & File Blueprint
```
frontend/
├── app/
│   └── risk/
│       └── page.tsx                     # Integrates interactive triggers and renders modals
├── components/
│   └── risk/
│       ├── RiskModalBase.tsx            # Accessible WAI-ARIA dialog primitive with focus trap & blur
│       ├── ConsequenceModal.tsx         # Factor decomposition, Polar Code, baseline & vessel limits
│       └── MitigationModal.tsx          # 3-phase SOP, Ch. 1-12 regulatory ref, ice-class matrix & delta
├── lib/
│   └── riskDetailData.ts                # Typed datasets for 4 consequences and 7 mitigation SOPs
└── tests/
    └── risk_modals.test.ts              # Unit tests for factor weights, SOP schemas, and modal logic
```

---

### 4.2 Data Schemas (`lib/riskDetailData.ts`)

```typescript
import type { Vessel, RouteAlternative } from "@/lib/data";

// ─── Consequence Breakdown Schemas ───────────────────────────────────────────

export interface ConsequenceFactor {
  id: string;
  name: string;
  weightPct: number;
  score: number; // 0 - 100
  impact: "HIGH" | "MODERATE" | "LOW";
  description: string;
  physicalDriver: string;
}

export interface HistoricalBaseline {
  region: string;
  tenYearMeanScore: number;
  percentile: number;
  deltaVsVoyage: string;
  climatologicalNotes: string;
}

export interface PolarCodeRef {
  chapter: string;
  clause: string;
  title: string;
  summary: string;
  polarisGuidance?: string;
}

export interface VesselIceLimits {
  maxIceThicknessM: number;
  speedCeilingKn: number;
  escortRequired: boolean;
  operationalEnvelope: string;
  warningAlert?: string;
}

export interface ConsequenceDetailData {
  key: string;
  label: string;
  shortDesc: string;
  factors: ConsequenceFactor[];
  historicalBaseline: HistoricalBaseline;
  polarCode: PolarCodeRef;
  preventionTactics: string[];
  vesselLimits: Record<string, VesselIceLimits>;
}

// ─── Mitigation SOP Schemas ───────────────────────────────────────────────────

export interface MitigationSOPPhase {
  phase: "Pre-Entry" | "Execution" | "Contingency";
  title: string;
  steps: string[];
}

export interface VesselClassApplicability {
  class: "PC2" | "PC4" | "PC5" | "OpenWater";
  status: "Mandatory" | "Recommended" | "Advisory" | "Prohibited" | "Exempt";
  guidance: string;
  operationalLimits: string;
}

export interface RiskReductionMetric {
  targetMetric: string;
  riskScoreDelta: number; // e.g. -24
  percentageReduction: string; // e.g. "-32%"
  confidence: string; // e.g. "95% Empirical"
  coBenefits: string[];
}

export interface MitigationSOPData {
  id: string;
  title: string;
  category: "Navigation" | "Machinery" | "Bridge Watchkeeping" | "Bunkers" | "Safe Refuge";
  phases: MitigationSOPPhase[];
  responsibleRoles: string[];
  polarCodeRef: {
    chapter: string;
    regulation: string;
    title: string;
    text: string;
  };
  applicability: VesselClassApplicability[];
  riskReduction: RiskReductionMetric;
}
```

---

### 4.3 Detailed Datasets Specification

#### A. Consequence Details Dataset (`CONSEQUENCE_DETAILS_MAP`)

```typescript
export const CONSEQUENCE_DETAILS_MAP: Record<string, ConsequenceDetailData> = {
  besetment: {
    key: "besetment",
    label: "Besetment Risk Analysis",
    shortDesc: "Comprehensive decomposition of vessel entrapment mechanics and compression pressures.",
    factors: [
      {
        id: "f-beset-1",
        name: "Convergent Pack Ice Compression",
        weightPct: 35,
        score: 68,
        impact: "HIGH",
        description: "Wind-driven floe compaction against western Weddell Peninsula coastlines.",
        physicalDriver: "25–35 kn southerly katabatic winds inducing compressive strain rate >0.8%/hr.",
      },
      {
        id: "f-beset-2",
        name: "First-Year Ridge Consolidation",
        weightPct: 25,
        score: 60,
        impact: "HIGH",
        description: "Consolidated pressure ridges exceeding continuous breaking threshold.",
        physicalDriver: "Subsurface ridge keels exceeding 2.5m depth with high shear strength.",
      },
      {
        id: "f-beset-3",
        name: "Hull-Ice Kinetic & Stagnation Friction",
        weightPct: 20,
        score: 45,
        impact: "MODERATE",
        description: "Increased surface drag on hull plating from cold, dry snow cover.",
        physicalDriver: "Ambient temperature -16°C elevating static friction coefficient to μ = 0.18.",
      },
      {
        id: "f-beset-4",
        name: "Lead Divergence Deficit",
        weightPct: 20,
        score: 55,
        impact: "MODERATE",
        description: "Scarcity of open navigation leads and polynyas along corridor.",
        physicalDriver: "Dynamic closing rate of leads ahead of bow exceeding vessel forward speed.",
      },
    ],
    historicalBaseline: {
      region: "Northwestern Weddell Sea / Antarctic Sound",
      tenYearMeanScore: 28,
      percentile: 68,
      deltaVsVoyage: "+7.0% above 10-year decadal mean",
      climatologicalNotes: "Negative Southern Annular Mode (SAM) phase inducing persistent onshore compaction of the Weddell gyre pack against Joinville Island.",
    },
    polarCode: {
      chapter: "Part I-A, Chapter 6 & Chapter 9",
      clause: "§6.3.2 (Propulsion & Steering) & §9.3.3 (Safety of Navigation)",
      title: "Machinery Capability & Navigational Watchfulness in Ice",
      summary: "Propulsion systems must deliver sufficient ahead and astern thrust margin to overcome compressive ice entrapment; vessel Polar Water Operational Manual (PWOM) must define besetment extraction procedures.",
      polarisGuidance: "MSC.1/Circ.1519 Table 1.3: Risk Index Outcome (RIO) < 0 indicates besetment potential requiring specialized escort support.",
    },
    preventionTactics: [
      "Maintain continuous 3cm (X-band) and 10cm (S-band) radar scanning to identify leads under divergent tension.",
      "Step down speed to vessel ice limit (iceLimitKn) 2 NM prior to entering pack boundary to prevent wedging.",
      "Alternate rudder deflection (±15°) every 8–10 minutes to maintain propeller wash clearance.",
      "Maintain aft ballast trim (+0.5m) to ensure 100% propeller immersion and optimal ice knife entry angle.",
    ],
    vesselLimits: {
      PC2: { maxIceThicknessM: 3.0, speedCeilingKn: 8.5, escortRequired: false, operationalEnvelope: "Authorized for multi-year ice conditions; certified for continuous ice breaking." },
      PC4: { maxIceThicknessM: 1.2, speedCeilingKn: 6.5, escortRequired: false, operationalEnvelope: "Safe in first-year ice; monitor ridge consolidation closely in narrow sounds." },
      PC5: { maxIceThicknessM: 1.0, speedCeilingKn: 5.0, escortRequired: false, operationalEnvelope: "Restricted in heavy ridging; avoid unbacked multi-year floe collisions." },
      OpenWater: { maxIceThicknessM: 0.0, speedCeilingKn: 2.0, escortRequired: true, operationalEnvelope: "Unstrengthened hull. Prohibited from entering pack ice.", warningAlert: "CRITICAL POLAR RESTRICTION: OpenWater vessel unauthorized in compressive pack without icebreaker escort (Polar Code Ch. 1 §1.5)." },
    },
  },

  delay: {
    key: "delay",
    label: "Transit Delay Risk Analysis",
    shortDesc: "Decomposition of ETA overrun drivers, speed reductions, and ice detours.",
    factors: [
      {
        id: "f-delay-1",
        name: "Forced Ice Speed Throttling",
        weightPct: 40,
        score: 72,
        impact: "HIGH",
        description: "Mandatory speed step-down across consolidated ice fields.",
        physicalDriver: "Speed reduction from open water cruising speed down to structural ice limits over 120 NM.",
      },
      {
        id: "f-delay-2",
        name: "Iceberg Standoff Deviations",
        weightPct: 25,
        score: 48,
        impact: "MODERATE",
        description: "Course diversions required to maintain 5.0 NM safety standoff from tracked bergs.",
        physicalDriver: "3 active tabular icebergs requiring circular deviations adding +18.4 NM to voyage track.",
      },
      {
        id: "f-delay-3",
        name: "Chokepoint Daylight Scheduling Holds",
        weightPct: 20,
        score: 35,
        impact: "MODERATE",
        description: "Staging and holding outside Antarctic Sound awaiting civil dawn.",
        physicalDriver: "Restricted visibility protocol requiring daylight for narrow passage navigation.",
      },
      {
        id: "f-delay-4",
        name: "Ice Maneuvering & Backing Cycles",
        weightPct: 15,
        score: 40,
        impact: "LOW",
        description: "Cumulative time penalty incurred during 3-point turns and backing runs in heavy floes.",
        physicalDriver: "Frequent backing runs when navigating closed leads.",
      },
    ],
    historicalBaseline: {
      region: "Antarctic Sound & Erebus / Terror Gulf",
      tenYearMeanScore: 22,
      percentile: 59,
      deltaVsVoyage: "+36.4% above decadal mean ETA overrun",
      climatologicalNotes: "Fast ice lingering 12 days longer than the decadal average in Prince Gustav Channel.",
    },
    polarCode: {
      chapter: "Part I-A, Chapter 11",
      clause: "§11.3 (Voyage Planning Procedures)",
      title: "Voyage Duration Margins in Polar Ice Regimes",
      summary: "Voyage planning must account for anticipated ice regime delays, speed limitations, and detour routes to ensure sufficient life support, fuel, and communications endurance.",
    },
    preventionTactics: [
      "Synchronize transit of chokepoints with early nautical dawn to maximize uninterrupted daylight steaming.",
      "Incorporate high-resolution satellite SAR ice drift forecasts downlinked at 4-hour intervals.",
      "Pre-calculate diversion waypoints 15 NM prior to approaching iceberg exclusion zones.",
      "Maintain active AIS and VHF communication with regional vessels to share real-time lead observations.",
    ],
    vesselLimits: {
      PC2: { maxIceThicknessM: 3.0, speedCeilingKn: 8.5, escortRequired: false, operationalEnvelope: "Speed penalty minimal (1.5 hrs delay expected)." },
      PC4: { maxIceThicknessM: 1.2, speedCeilingKn: 6.5, escortRequired: false, operationalEnvelope: "Moderate speed penalty (3.0 hrs delay expected)." },
      PC5: { maxIceThicknessM: 1.0, speedCeilingKn: 5.0, escortRequired: false, operationalEnvelope: "Elevated speed penalty (4.5 hrs delay expected)." },
      OpenWater: { maxIceThicknessM: 0.0, speedCeilingKn: 2.0, escortRequired: true, operationalEnvelope: "Severe delay risk (>12 hrs delay expected without escort)." },
    },
  },

  fuel: {
    key: "fuel",
    label: "Fuel Penalty Analysis",
    shortDesc: "Decomposition of propulsion load spikes and thermal energy overheads.",
    factors: [
      {
        id: "f-fuel-1",
        name: "Continuous Ice Breaking Drag",
        weightPct: 45,
        score: 65,
        impact: "HIGH",
        description: "Elevated engine torque required to continuously fracture and displace floes.",
        physicalDriver: "Specific fuel consumption increased by +38% during continuous ice penetration.",
      },
      {
        id: "f-fuel-2",
        name: "Ramming & Astern Power Spikes",
        weightPct: 25,
        score: 55,
        impact: "MODERATE",
        description: "Heavy transient generator loads during repeated ramming cycles.",
        physicalDriver: "Rapid pitch reversal and full-ahead governor demands spiking diesel generator burn.",
      },
      {
        id: "f-fuel-3",
        name: "Extended Detour Distance Burn",
        weightPct: 20,
        score: 40,
        impact: "MODERATE",
        description: "Additional bunker fuel consumed along circumnavigation tracks.",
        physicalDriver: "+22 NM track extension around heavy fast-ice tongue.",
      },
      {
        id: "f-fuel-4",
        name: "Auxiliary De-Icing & Sea Chest Heating",
        weightPct: 10,
        score: 30,
        impact: "LOW",
        description: "Continuous steam heating to prevent sea chest slush choking.",
        physicalDriver: "Boiler fuel burn for sea chest flushing and deck freeze prevention in -18°C air.",
      },
    ],
    historicalBaseline: {
      region: "Weddell Sea Continental Shelf",
      tenYearMeanScore: 24,
      percentile: 62,
      deltaVsVoyage: "+6.0% to +15.0% above calm-water baseline",
      climatologicalNotes: "Sub-surface seawater temperature of -1.6°C maximizes convective hull thermal losses.",
    },
    polarCode: {
      chapter: "Part I-A, Chapter 6 & Part I-B Guidance",
      clause: "§6.3.1 (Fuel Systems) & Part I-B §3 (Fuel Oil Endurance)",
      title: "Fuel Oil Systems and Voyage Bunkering Reserves",
      summary: "Fuel oil systems must be designed to prevent wax deposition, and vessels must carry statutory fuel reserves to survive protracted delays or unexpected besetment holds.",
    },
    preventionTactics: [
      "Operate engines at optimum Specific Fuel Consumption (SFC) RPM rather than Maximum Continuous Rating (MCR).",
      "Trim vessel +0.4m aft to minimize hull wetted area on forward shoulders.",
      "Utilize automated track-pilot within clear polynyas to minimize rudder-induced hydrodynamic drag.",
      "Regulate sea chest steam valve cycling based on intake temperature sensors rather than continuous venting.",
    ],
    vesselLimits: {
      PC2: { maxIceThicknessM: 3.0, speedCeilingKn: 8.5, escortRequired: false, operationalEnvelope: "Daily burn 35 MT/day; dual-fuel LNG/MGO thermal efficiency." },
      PC4: { maxIceThicknessM: 1.2, speedCeilingKn: 6.5, escortRequired: false, operationalEnvelope: "Daily burn 28 MT/day; optimized ice propulsion modes." },
      PC5: { maxIceThicknessM: 1.0, speedCeilingKn: 5.0, escortRequired: false, operationalEnvelope: "Daily burn 24 MT/day; monitor pump viscosity at sub-zero temperatures." },
      OpenWater: { maxIceThicknessM: 0.0, speedCeilingKn: 2.0, escortRequired: true, operationalEnvelope: "High propeller slip in ice elevates burn rate to >30 MT/day." },
    },
  },

  disruption: {
    key: "disruption",
    label: "Route Disruption Risk Analysis",
    shortDesc: "Decomposition of forced rerouting triggers and corridor blockage hazards.",
    factors: [
      {
        id: "f-disrupt-1",
        name: "Dynamic Pack Closure Probability",
        weightPct: 40,
        score: 58,
        impact: "HIGH",
        description: "Abrupt wind shifts closing navigable polynyas and fairways.",
        physicalDriver: "Frontal system forecasted to shift winds to northeast, jamming pack against shelf ice.",
      },
      {
        id: "f-disrupt-2",
        name: "Tabular Iceberg Chokepoint Ingress",
        weightPct: 30,
        score: 45,
        impact: "MODERATE",
        description: "Drift of giant calved fragments blocking narrow transit corridor.",
        physicalDriver: "Berg fragment B-30 drifting westward into the 6 NM wide fairway.",
      },
      {
        id: "f-disrupt-3",
        name: "Severe Sea Smoke & Whiteout Risk",
        weightPct: 20,
        score: 38,
        impact: "MODERATE",
        description: "Optical and radar clutter preventing safe bridge navigation.",
        physicalDriver: "Air-sea thermal disparity generating dense sea smoke reducing visibility below 0.5 NM.",
      },
      {
        id: "f-disrupt-4",
        name: "Emergency Holding Anchorage Limitations",
        weightPct: 10,
        score: 25,
        impact: "LOW",
        description: "Scarcity of charted safe refuges along corridor.",
        physicalDriver: "Steep bathymetry with depths exceeding 80m near shoreline.",
      },
    ],
    historicalBaseline: {
      region: "Antarctic Peninsula East Coast",
      tenYearMeanScore: 20,
      percentile: 55,
      deltaVsVoyage: "30% (balanced) to 70% (shortest) disruption probability",
      climatologicalNotes: "Elevated iceberg calving events off Larsen-C ice front increasing drift density.",
    },
    polarCode: {
      chapter: "Part I-A, Chapter 1 & POLARIS",
      clause: "§1.5 (Risk Assessment) & MSC.1/Circ.1519",
      title: "Goal-Based Polar Water Operational Risk Assessment",
      summary: "Operations in polar waters must continually evaluate environmental hazard criteria and execute pre-planned alternate transit corridors when operational safety limits are exceeded.",
    },
    preventionTactics: [
      "Maintain active real-time satellite radar downlink on 4-hour update cadence.",
      "Designate and pre-chart secondary escape corridor via Prince Gustav Channel prior to departing Maxwell Bay.",
      "Establish unambiguous abort criteria based on wind shifts >25 kn from the northeast.",
      "Maintain 24/7 radio communications with regional meteorological reporting stations.",
    ],
    vesselLimits: {
      PC2: { maxIceThicknessM: 3.0, speedCeilingKn: 8.5, escortRequired: false, operationalEnvelope: "Disruption threshold RIO < -5; capable of forced breakthrough." },
      PC4: { maxIceThicknessM: 1.2, speedCeilingKn: 6.5, escortRequired: false, operationalEnvelope: "Disruption threshold RIO < 0; detour required if ridge height exceeds 1.5m." },
      PC5: { maxIceThicknessM: 1.0, speedCeilingKn: 5.0, escortRequired: false, operationalEnvelope: "Disruption threshold RIO < +5; detour early before pack consolidates." },
      OpenWater: { maxIceThicknessM: 0.0, speedCeilingKn: 2.0, escortRequired: true, operationalEnvelope: "Disruption threshold RIO < +15; immediate route abort if floes sighted." },
    },
  },
};
```

---

#### B. Mitigation SOP Dataset (`MITIGATION_SOPS_MAP`)

```typescript
export const MITIGATION_SOPS_MAP: Record<string, MitigationSOPData> = {
  m1: {
    id: "m1",
    title: "Reduce speed in pack ice",
    category: "Navigation",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Pack Ice Approach & Setup",
        steps: [
          "Conduct bridge watch briefing 2 NM prior to crossing ice boundary.",
          "Engage propulsion ice-governor mode and verify astern pitch response.",
          "Activate dual radar sets with ice anti-clutter filters (3cm X-band and 10cm S-band).",
          "Sound ballast tanks and verify propeller immersion depth.",
        ],
      },
      {
        phase: "Execution",
        title: "Active Ice Navigation & Speed Control",
        steps: [
          "Step down speed to vessel ice limit ceiling (e.g. 6.5 kn for PC4, 8.5 kn for PC2).",
          "Maintain small rudder angles (<10°) to protect steering gear and propeller tips.",
          "Throttle back immediately upon approaching consolidated floes or rafted ridges.",
          "Continuously evaluate lead continuity; avoid dead-end fractures in converging ice.",
        ],
      },
      {
        phase: "Contingency",
        title: "Stagnation & Abort Protocol",
        steps: [
          "If forward speed drops below 2.0 knots under sustained thrust, stop engines immediately.",
          "Do not force hull into pinch point; initiate astern cycle along broken channel.",
          "Evaluate floe drift direction; back vessel into open water and select divergent lead.",
        ],
      },
    ],
    responsibleRoles: ["Master", "Officer of the Watch (OOW)", "Chief Engineer", "Ice Navigator"],
    polarCodeRef: {
      chapter: "Chapter 6 & Chapter 9",
      regulation: "Part I-A §6.3.3 & §9.3.2.1",
      title: "Machinery Installations & Safe Speed in Ice",
      text: "Vessels operating in polar waters must maintain a safe speed adjusted to ice concentration, thickness, and visibility to avoid structural shock loads exceeding hull scantling design criteria.",
    },
    applicability: [
      { class: "PC2", status: "Mandatory", guidance: "Maximum 8.5 kn in heavy pack; authorized for controlled ramming.", operationalLimits: "Structural ceiling 9.0 kn." },
      { class: "PC4", status: "Mandatory", guidance: "Maximum 6.5 kn in first-year ice >0.7m; ramming prohibited.", operationalLimits: "Structural ceiling 6.5 kn." },
      { class: "PC5", status: "Mandatory", guidance: "Maximum 5.0 kn; avoid floe impacts >3 kn.", operationalLimits: "Structural ceiling 5.0 kn." },
      { class: "OpenWater", status: "Mandatory", guidance: "Maximum 2.0 kn in slush/brash; strictly prohibited in floes >1/10.", operationalLimits: "Structural ceiling 2.0 kn." },
    ],
    riskReduction: {
      targetMetric: "Structural Impact & Hull Plate Stress",
      riskScoreDelta: -24,
      percentageReduction: "-32%",
      confidence: "95% POLARIS Empirical Baseline",
      coBenefits: ["Reduces propeller blade cavitation shock", "Conserves fuel by avoiding friction stagnation"],
    },
  },

  m2: {
    id: "m2",
    title: "Maintain 5.0 NM iceberg standoff",
    category: "Navigation",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Target Detection & Standoff Plotting",
        steps: [
          "Plot iceberg drift vectors and Closest Point of Approach (CPA) on ARPA radar.",
          "Cross-reference satellite Synthetic Aperture Radar (SAR) target bulletin coordinates.",
          "Engage thermal forward-looking infrared (FLIR) cameras to detect submerged spurs.",
        ],
      },
      {
        phase: "Execution",
        title: "Exclusion Zone Enforcement",
        steps: [
          "Maintain active 5.0 NM radius exclusion ring around all tracked tabular and calved bergs.",
          "Pass icebergs on the upwind and up-current side to avoid drifting growlers.",
          "Expand standoff to 7.0 NM if iceberg drift velocity exceeds 1.5 kn toward route axis.",
        ],
      },
      {
        phase: "Contingency",
        title: "Encroachment & Avoidance Maneuver",
        steps: [
          "If CPA unexpectedly drops below 3.0 NM, immediately alter course 45° to open water.",
          "Sound bridge alert and place engine room on immediate full maneuvering standby.",
        ],
      },
    ],
    responsibleRoles: ["Master", "Officer of the Watch (OOW)"],
    polarCodeRef: {
      chapter: "Chapter 9 & Chapter 11",
      regulation: "Part I-A §9.3.3 & §11.3.1",
      title: "Safety of Navigation & Iceberg Collision Avoidance",
      text: "Navigational watchkeepers must ensure adequate clearance from glacial ice targets, accounting for calved underwater rams, rolling hazards, and deteriorating sea states.",
    },
    applicability: [
      { class: "PC2", status: "Mandatory", guidance: "5.0 NM standard standoff; 2.0 NM minimum in restricted channels with active sonar.", operationalLimits: "Sonar active." },
      { class: "PC4", status: "Mandatory", guidance: "5.0 NM standard standoff; underwater spur detection sonar active.", operationalLimits: "Standard standoff." },
      { class: "PC5", status: "Mandatory", guidance: "5.0 NM standard standoff; continuous searchlight ice watch.", operationalLimits: "Standard standoff." },
      { class: "OpenWater", status: "Mandatory", guidance: "8.0 NM expanded standoff; unstrengthened hull cannot withstand growler impact.", operationalLimits: "Strict avoidance." },
    ],
    riskReduction: {
      targetMetric: "Catastrophic Glacial Collision Risk",
      riskScoreDelta: -45,
      percentageReduction: "-85%",
      confidence: "99% Hydrodynamic Empirical Model",
      coBenefits: ["Eliminates growler hull breach danger", "Prevents sonar and echo-sounder acoustic clutter"],
    },
  },

  m3: {
    id: "m3",
    title: "Daylight transit of chokepoints",
    category: "Bridge Watchkeeping",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Ephemeris Calculation & Passage Planning",
        steps: [
          "Calculate solar ephemeris for Antarctic Sound (civil dawn, sunrise, sunset, nautical dusk).",
          "Adjust transit speed so arrival at chokepoint coincides with civil sunrise.",
          "Verify atmospheric refraction corrections for high-latitude polar visibility.",
        ],
      },
      {
        phase: "Execution",
        title: "Daylight Fairway Transit",
        steps: [
          "Proceed through narrow pass only with optical visibility exceeding 3.0 NM.",
          "Station lookout on monkey island equipped with polarized anti-glare filters.",
          "Correlate optical lead sightings with high-resolution radar shadow contours.",
        ],
      },
      {
        phase: "Contingency",
        title: "Nightfall or Fog Ingress",
        steps: [
          "If transit cannot be completed prior to civil dusk, divert to sheltered holding basin.",
          "Never attempt unescorted night transit in concentration >4/10 in restricted waters.",
        ],
      },
    ],
    responsibleRoles: ["Master", "Ice Navigator", "Officer of the Watch (OOW)"],
    polarCodeRef: {
      chapter: "Chapter 9 & Chapter 11",
      regulation: "Part I-A §9.3.2.2 & §11.3.2",
      title: "Environmental Conditions & Optical Navigation",
      summary: "Voyage planning must account for daylight availability and optical contrast when negotiating narrow channels with mobile sea ice and bathymetric shoals.",
      text: "Operations in restricted waterways require sufficient optical visual cues to distinguish rafted ridges from navigable polynyas.",
    },
    applicability: [
      { class: "PC2", status: "Recommended", guidance: "Daylight preferred; night transit authorized with dual 2kW xenon searchlights and forward sonar.", operationalLimits: "Night permitted with sonar." },
      { class: "PC4", status: "Recommended", guidance: "Daylight transit strongly advised when ice concentration exceeds 6/10.", operationalLimits: "Daylight advised." },
      { class: "PC5", status: "Mandatory", guidance: "Mandatory daylight in chokepoints with tidal currents >2.0 kn.", operationalLimits: "Daylight mandatory." },
      { class: "OpenWater", status: "Mandatory", guidance: "Strict daylight only; night transit through restricted polar passes is forbidden.", operationalLimits: "Daylight mandatory." },
    ],
    riskReduction: {
      targetMetric: "Grounding & Chokepoint Besetment Risk",
      riskScoreDelta: -30,
      percentageReduction: "-50%",
      confidence: "92% Navigation Audit Baseline",
      coBenefits: ["Enables visual identification of multi-year floe color hues", "Prevents searchlight backscatter blindness in snow flurry"],
    },
  },

  m4: {
    id: "m4",
    title: "Extra lookout / ice watch",
    category: "Bridge Watchkeeping",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Watch Roster & Survival Gear Check",
        steps: [
          "Establish dedicated Ice Watch roster distinct from standard bridge navigation watch.",
          "Equip lookouts with immersion suits, polarized glare visors, and portable VHF.",
          "Establish 30-minute rotation cycles to prevent cold-stress vigilance impairment.",
        ],
      },
      {
        phase: "Execution",
        title: "Dedicated Optical Scanning",
        steps: [
          "Post dedicated observer at elevated vantage point (monkey island or enclosed crow's nest).",
          "Scan forward 180° arc for growlers, floe edges, and sudden lead closures.",
          "Direct intercom link from lookout post to Master and helmsman.",
        ],
      },
      {
        phase: "Contingency",
        title: "Severe Weather Transfer",
        steps: [
          "If wind chill drops below -35°C or deck icing occurs, relocate lookout to heated forward bridge wing station.",
        ],
      },
    ],
    responsibleRoles: ["Officer of the Watch (OOW)", "Designated Ice Observers"],
    polarCodeRef: {
      chapter: "Chapter 12",
      regulation: "Part I-A §12.3.1 & STCW Regulation V/4",
      title: "Manning, Watchkeeping and Training in Polar Waters",
      text: "Bridge watchkeeping arrangements must ensure additional lookouts experienced in polar conditions are posted whenever ice, fog, or darkness increases risk.",
    },
    applicability: [
      { class: "PC2", status: "Recommended", guidance: "Recommended during pack transit; mandatory in iceberg-dense zones.", operationalLimits: "Active in ice." },
      { class: "PC4", status: "Mandatory", guidance: "Mandatory in pack concentration >4/10 or visibility <2.0 NM.", operationalLimits: "Standard ice watch." },
      { class: "PC5", status: "Mandatory", guidance: "Mandatory continuous watch south of 60°S latitude.", operationalLimits: "Continuous." },
      { class: "OpenWater", status: "Mandatory", guidance: "Mandatory 24/7 dual simultaneous watchkeepers whenever seawater temperature < 2°C.", operationalLimits: "Dual watchkeepers." },
    ],
    riskReduction: {
      targetMetric: "Small Target / Growler Detection Failure",
      riskScoreDelta: -22,
      percentageReduction: "-65%",
      confidence: "95% Empirical Lookout Trial",
      coBenefits: ["Quadruples detection range of low-freeboard growlers", "Provides immediate warning of lead closing trends"],
    },
  },

  m5: {
    id: "m5",
    title: "Escort on standby for OpenWater hulls",
    category: "Navigation",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Escort Rendezvous & Comms Setup",
        steps: [
          "Establish VHF bridge-to-bridge communications on Channel 16/06 with designated icebreaker.",
          "Exchange vessel data: displacement, stopping distance, turning radius, and towing line compatibility.",
          "Confirm convoy order and establish emergency stopping signals.",
        ],
      },
      {
        phase: "Execution",
        title: "Convoy Station-Keeping",
        steps: [
          "Maintain distance of 0.5–1.0 NM directly astern of icebreaker within cleared channel.",
          "Match convoy speed precisely; monitor channel closure rate behind escort stern.",
          "Do not deviate from escort vessel centerline track.",
        ],
      },
      {
        phase: "Contingency",
        title: "Escort Stoppage or Pressure Squeeze",
        steps: [
          "If icebreaker stops suddenly in heavy ridge, immediately reverse propulsion to crash stop.",
          "Veer helm into broken ice shoulder away from icebreaker stern to avoid rear-end impact.",
        ],
      },
    ],
    responsibleRoles: ["Escort Commander", "Master", "Chief Engineer"],
    polarCodeRef: {
      chapter: "Chapter 1",
      regulation: "Part I-A §1.5 & Part I-B §2.3",
      title: "Escort Operations & Category C Hull Authorization",
      text: "Vessels with unstrengthened hulls (Category C / Open Water) navigating through sea ice must operate under direct escort or standby supervision of a certified polar class icebreaker.",
    },
    applicability: [
      { class: "PC2", status: "Exempt", guidance: "Exempt; vessel is certified to act as lead escort.", operationalLimits: "Lead capable." },
      { class: "PC4", status: "Advisory", guidance: "Escort required only in compressive multi-year pressure ridges >1.8m.", operationalLimits: "Advisory." },
      { class: "PC5", status: "Recommended", guidance: "Recommended in fast ice corridors and convergent pack >7/10.", operationalLimits: "Recommended." },
      { class: "OpenWater", status: "Mandatory", guidance: "Strict statutory requirement before entering sea ice >1/10.", operationalLimits: "Mandatory escort." },
    ],
    riskReduction: {
      targetMetric: "Severe Besetment & Hull Penetration",
      riskScoreDelta: -58,
      percentageReduction: "-90%",
      confidence: "98% Escort Convoy Registry",
      coBenefits: ["Guarantees immediate ice extraction and towing", "Provides pre-broken low-resistance channel"],
    },
  },

  m6: {
    id: "m6",
    title: "Fuel reserve margin check",
    category: "Bunkers",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Bunker Sounding & Fuel Wax Testing",
        steps: [
          "Sound all Polar MGO/DMA tanks; verify pour point is below -30°C.",
          "Calculate planned voyage consumption plus statutory 25% reserve margin.",
          "Verify operation of fuel heating coils and fuel separator heat exchangers.",
        ],
      },
      {
        phase: "Execution",
        title: "Consumption Monitoring",
        steps: [
          "Log hourly fuel burn rate during ice transit.",
          "Compare cumulative consumption against voyage plan baseline every 4 hours.",
          "Maintain service tanks at maximum level to prevent condensation ice crystals.",
        ],
      },
      {
        phase: "Contingency",
        title: "Excessive Burn Reroute",
        steps: [
          "If cumulative consumption exceeds plan by >15% at corridor midpoint, throttle to maximum economy speed.",
          "Evaluate diversion to open water route to conserve remaining endurance margin.",
        ],
      },
    ],
    responsibleRoles: ["Chief Engineer", "Master"],
    polarCodeRef: {
      chapter: "Chapter 6",
      regulation: "Part I-A §6.3.1 & Part I-B §3",
      title: "Fuel Systems & Low-Temperature Operability",
      text: "Fuel systems in polar waters must carry sufficient reserves to account for ice maneuvering and severe weather holds, and must maintain fuel temperature above cold filter plugging point (CFPP).",
    },
    applicability: [
      { class: "PC2", status: "Recommended", guidance: "Minimum +20% reserve margin over nominal consumption.", operationalLimits: "20% margin." },
      { class: "PC4", status: "Recommended", guidance: "Minimum +25% reserve margin over nominal consumption.", operationalLimits: "25% margin." },
      { class: "PC5", status: "Recommended", guidance: "Minimum +30% reserve margin over nominal consumption.", operationalLimits: "30% margin." },
      { class: "OpenWater", status: "Mandatory", guidance: "Minimum +40% reserve margin due to high probability of extended detours.", operationalLimits: "40% margin." },
    ],
    riskReduction: {
      targetMetric: "Fuel Exhaustion & Stranding Hazard",
      riskScoreDelta: -28,
      percentageReduction: "-70%",
      confidence: "96% Bunker Safety Log",
      coBenefits: ["Guarantees 96-hour hotel load survival margin", "Prevents fuel wax precipitation in fuel lines"],
    },
  },

  m7: {
    id: "m7",
    title: "Contingency anchorage identified",
    category: "Safe Refuge",
    phases: [
      {
        phase: "Pre-Entry",
        title: "Sheltered Basin Pre-Selection",
        steps: [
          "Identify and chart two sheltered holding anchorages (e.g. Potter Cove, Maxwell Bay South).",
          "Verify seabed holding ground (mud/clay) and water depth (25–50m).",
          "Pre-calculate swinging circle clearances accounting for 45 kn katabatic wind gusts.",
        ],
      },
      {
        phase: "Execution",
        title: "Anchorage Readiness & Standby",
        steps: [
          "Warm windlass motors and hawse pipe de-icing steam lines.",
          "Keep main propulsion engine on 15-minute standby notice while at anchor.",
          "Maintain radar ice guard zone around vessel to monitor drifting tabular fragments.",
        ],
      },
      {
        phase: "Contingency",
        title: "Anchorage Evacuation",
        steps: [
          "If drifting ice floes enter the bay or wind shifts exceed anchor holding limit, weigh anchor immediately.",
          "If anchor is fouled or fast, slip anchor cable with marked marker buoy and proceed to open sea.",
        ],
      },
    ],
    responsibleRoles: ["Master", "Chief Officer", "Bosun"],
    polarCodeRef: {
      chapter: "Chapter 11",
      regulation: "Part I-A §11.3.4",
      title: "Voyage Planning & Emergency Refuge Identification",
      text: "The voyage plan for polar operations must identify locations of safe refuge, sheltered anchorages, and holding areas suitable for weathering severe metocean disturbances.",
    },
    applicability: [
      { class: "PC2", status: "Advisory", guidance: "Standard anchorage protocol with 5 shackles in water.", operationalLimits: "Standard refuge." },
      { class: "PC4", status: "Recommended", guidance: "Identified refuges within 4 hours steaming distance along entire route.", operationalLimits: "4h steaming." },
      { class: "PC5", status: "Recommended", guidance: "Identified refuges within 3 hours steaming distance.", operationalLimits: "3h steaming." },
      { class: "OpenWater", status: "Mandatory", guidance: "Emergency refuge pre-planned before departing Maxwell Bay.", operationalLimits: "Mandatory refuge." },
    ],
    riskReduction: {
      targetMetric: "Severe Metocean & Pack Force Drift Exposure",
      riskScoreDelta: -35,
      percentageReduction: "-55%",
      confidence: "94% Marine Emergency Registry",
      coBenefits: ["Provides shelter from 50+ kn katabatic storms", "Enables safe hull and propeller inspection at anchor"],
    },
  },
};
```

---

### 4.4 Component Implementations

#### 1. `components/risk/RiskModalBase.tsx`
Accessible WAI-ARIA dialog overlay with backdrop blur, keyboard ESC dismissal, focus trapping, and `animate-fade-in`.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export function RiskModalBase({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidthClass = "max-w-3xl",
  ariaLabelledBy = "risk-modal-title",
  ariaDescribedBy = "risk-modal-description",
}: RiskModalBaseProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap & keyboard ESC handler
  useEffect(() => {
    if (!isOpen) return;

    // Remember currently focused element to restore on close
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Lock background scroll
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // ESC key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on dialog
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
      clearTimeout(timer);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative w-full rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] transition-all",
          maxWidthClass
        )}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border bg-surface px-6 py-4 shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={ariaLabelledBy} className="text-lg font-bold text-navy-900">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p id={ariaDescribedBy} className="mt-1 text-xs text-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface2 hover:text-navy-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        {/* Modal Footer (if provided) */}
        {footer && (
          <div className="border-t border-border bg-surface2 px-6 py-3.5 flex items-center justify-between shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

#### 2. `components/risk/ConsequenceModal.tsx`
Consequence Breakdown Modal rendering factor decomposition, Polar Code clauses, baseline comparison, prevention tactics, and vessel limits.

```tsx
"use client";

import { RiskModalBase } from "./RiskModalBase";
import { CONSEQUENCE_DETAILS_MAP } from "@/lib/riskDetailData";
import { riskBadge, riskBar, riskLabel, cn } from "@/lib/utils";
import type { Vessel, RouteAlternative } from "@/lib/data";
import { AlertTriangle, ShieldCheck, Scale, History, BookOpen, Compass, CheckCircle2 } from "lucide-react";

interface ConsequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  consequenceKey: string | null;
  consequenceScore: number;
  consequenceValue: string;
  vessel: Vessel;
  selectedRoute: RouteAlternative;
}

export function ConsequenceModal({
  isOpen,
  onClose,
  consequenceKey,
  consequenceScore,
  consequenceValue,
  vessel,
  selectedRoute,
}: ConsequenceModalProps) {
  if (!consequenceKey) return null;

  const detail = CONSEQUENCE_DETAILS_MAP[consequenceKey] ?? CONSEQUENCE_DETAILS_MAP.besetment;
  const limits = detail.vesselLimits[vessel.iceClass] ?? detail.vesselLimits.PC4;
  const isHighRisk = consequenceScore >= 65;

  return (
    <RiskModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={detail.label}
      subtitle={detail.shortDesc}
      badge={
        <span className={cn("rounded border px-2 py-0.5 font-mono text-xs font-bold", riskBadge(consequenceScore))}>
          Score {consequenceScore}/100 · {consequenceValue}
        </span>
      }
      footer={
        <>
          <span className="text-xs text-text-subtle">
            Evaluated for <strong>{selectedRoute.name}</strong> · Hull: {vessel.name} ({vessel.iceClass})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
          >
            Dismiss Analysis
          </button>
        </>
      }
    >
      {/* 1. Dynamic Metric Summary Banner */}
      <div className="rounded-xl border border-border bg-surface2 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Current Assessment</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-navy-900">{consequenceValue}</span>
              <span className="text-xs text-text-muted">({riskLabel(consequenceScore)} severity rating)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl font-bold text-navy-900">{consequenceScore}</span>
            <span className="text-xs text-text-subtle font-mono">/100</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", riskBar(consequenceScore))} style={{ width: `${Math.min(consequenceScore, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Factor Decomposition */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Scale size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">Detailed Factor Decomposition</h3>
          <span className="text-[11px] text-text-subtle">Weighted physical drivers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detail.factors.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-navy-900">{f.name}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.2 text-[10px] font-bold uppercase",
                    f.impact === "HIGH"
                      ? "bg-risk-high-bg text-risk-high border border-risk-high/20"
                      : f.impact === "MODERATE"
                      ? "bg-risk-med-bg text-risk-med border border-risk-med/20"
                      : "bg-risk-low-bg text-risk-low border border-risk-low/20"
                  )}
                >
                  {f.impact} ({f.weightPct}%)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-text-muted">{f.description}</p>
              <div className="mt-2.5 rounded bg-surface2 px-2 py-1 text-[11px] text-text-subtle font-mono">
                Driver: {f.physicalDriver}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Historical Polar Baseline Comparison */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <History size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">10-Year Decadal Polar Baseline</h3>
          <span className="text-[11px] text-text-subtle">{detail.historicalBaseline.region}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 border-y border-border py-3 my-2 text-center">
          <div>
            <div className="text-[11px] text-text-muted">10-Yr Decadal Mean</div>
            <div className="mt-0.5 font-mono text-base font-bold text-navy-900">{detail.historicalBaseline.tenYearMeanScore}/100</div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted">Seasonal Percentile</div>
            <div className="mt-0.5 font-mono text-base font-bold text-navy-900">{detail.historicalBaseline.percentile}th</div>
          </div>
          <div>
            <div className="text-[11px] text-text-muted">Voyage Delta</div>
            <div className="mt-0.5 font-mono text-xs font-bold text-blue-600">{detail.historicalBaseline.deltaVsVoyage}</div>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted leading-relaxed">
          {detail.historicalBaseline.climatologicalNotes}
        </p>
      </div>

      {/* 4. IMO Polar Code Regulatory Clauses */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">IMO Polar Code Statutory Reference</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="font-mono text-xs font-bold text-navy-900">{detail.polarCode.chapter}</span>
          <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-600 font-semibold">{detail.polarCode.clause}</span>
        </div>
        <h4 className="text-xs font-semibold text-text-primary">{detail.polarCode.title}</h4>
        <p className="mt-1 text-xs text-text-muted leading-relaxed">{detail.polarCode.summary}</p>
        {detail.polarCode.polarisGuidance && (
          <div className="mt-2 rounded bg-surface2 p-2 text-xs text-navy-900 font-mono">
            {detail.polarCode.polarisGuidance}
          </div>
        )}
      </div>

      {/* 5. Prevention Tactics & Bridge Orders */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">Tactical Prevention &amp; Bridge Orders</h3>
        </div>
        <ul className="space-y-2 mt-2">
          {detail.preventionTactics.map((tactic, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
              <CheckCircle2 size={14} className="text-risk-low shrink-0 mt-0.5" />
              <span>{tactic}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. Active Vessel Envelope & Warning Banner */}
      <div className={cn(
        "rounded-xl border p-4",
        limits.warningAlert
          ? "border-risk-high/40 bg-risk-high-bg text-risk-high"
          : "border-border bg-surface2 text-navy-900"
      )}>
        <div className="flex items-start gap-3">
          {limits.warningAlert ? (
            <AlertTriangle size={20} className="shrink-0 text-risk-high mt-0.5" />
          ) : (
            <ShieldCheck size={20} className="shrink-0 text-risk-low mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {limits.warningAlert ? "Statutory Polar Water Alert" : "Operational Hull Envelope"}
            </h4>
            <p className="mt-1 text-xs font-medium">
              {limits.warningAlert || limits.operationalEnvelope}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
              <span>Hull Class: <strong>{vessel.iceClass}</strong></span>
              <span>Max Ice Thickness: <strong>{limits.maxIceThicknessM}m</strong></span>
              <span>Speed Ceiling: <strong>{limits.speedCeilingKn} kn</strong></span>
              <span>Escort Required: <strong>{limits.escortRequired ? "YES" : "NO"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </RiskModalBase>
  );
}
```

---

#### 3. `components/risk/MitigationModal.tsx`
Mitigation SOP & Detail Modal rendering 3-phase SOP, IMO Polar Code Ch. 1-12 reference, vessel ice-class applicability matrix, and expected risk reduction.

```tsx
"use client";

import { RiskModalBase } from "./RiskModalBase";
import { MITIGATION_SOPS_MAP } from "@/lib/riskDetailData";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, BookOpen, Layers, ShieldCheck, TrendingDown, Users } from "lucide-react";

interface MitigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mitigationId: string | null;
  isAcknowledged: boolean;
  onToggleAcknowledge: (id: string) => void;
  activeVesselClass: string;
}

const STATUS_PILL: Record<string, string> = {
  Mandatory:   "bg-risk-high-bg text-risk-high border-risk-high/30",
  Recommended: "bg-risk-med-bg text-risk-med border-risk-med/30",
  Advisory:    "bg-surface2 text-text-muted border-border",
  Prohibited:  "bg-risk-high text-white border-risk-high",
  Exempt:      "bg-risk-low-bg text-risk-low border-risk-low/30",
};

export function MitigationModal({
  isOpen,
  onClose,
  mitigationId,
  isAcknowledged,
  onToggleAcknowledge,
  activeVesselClass,
}: MitigationModalProps) {
  if (!mitigationId) return null;

  const sop = MITIGATION_SOPS_MAP[mitigationId] ?? MITIGATION_SOPS_MAP.m1;

  return (
    <RiskModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={sop.title}
      subtitle={`Standard Operating Procedure & Statutory Compliance · Category: ${sop.category}`}
      badge={
        <span className={cn(
          "rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
          isAcknowledged
            ? "bg-risk-low-bg text-risk-low border-risk-low/30"
            : "bg-risk-high-bg text-risk-high border-risk-high/30"
        )}>
          {isAcknowledged ? "Acknowledged" : "Pending Acknowledgment"}
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => onToggleAcknowledge(sop.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors border",
              isAcknowledged
                ? "bg-risk-low-bg text-risk-low border-risk-low/30 hover:bg-risk-low/10"
                : "bg-navy-900 text-white border-navy-900 hover:bg-navy-800"
            )}
          >
            {isAcknowledged ? (
              <>
                <CheckCircle2 size={16} /> Measure Acknowledged (Click to Revoke)
              </>
            ) : (
              <>
                <Circle size={16} /> Acknowledge Tactical Measure
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-navy-900 hover:bg-surface2 transition-colors"
          >
            Close SOP
          </button>
        </>
      }
    >
      {/* 1. 3-Phase Standard Operating Procedure */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-navy-900">Standard Operating Procedure (SOP)</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Users size={14} />
            <span>Roles: {sop.responsibleRoles.join(", ")}</span>
          </div>
        </div>

        <div className="space-y-3">
          {sop.phases.map((phase, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-surface p-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wide">
                  {phase.phase}: {phase.title}
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 pl-7">
                {phase.steps.map((step, sIdx) => (
                  <li key={sIdx} className="list-disc text-xs text-text-secondary leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 2. IMO Polar Code Regulatory Reference */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">IMO Polar Code Regulatory Reference</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-navy-900">{sop.polarCodeRef.chapter}</span>
          <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-600 font-semibold">
            {sop.polarCodeRef.regulation}
          </span>
        </div>
        <h4 className="text-xs font-semibold text-text-primary">{sop.polarCodeRef.title}</h4>
        <p className="mt-1.5 text-xs text-text-muted leading-relaxed italic border-l-2 border-blue-600 pl-3">
          &ldquo;{sop.polarCodeRef.text}&rdquo;
        </p>
      </div>

      {/* 3. Vessel Ice-Class Applicability Matrix */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-navy-900">Vessel Ice-Class Applicability Matrix</h3>
          <span className="text-[11px] text-text-subtle">Active Vessel: <strong>{activeVesselClass}</strong></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {sop.applicability.map((app) => {
            const isActive = app.class === activeVesselClass;
            return (
              <div
                key={app.class}
                className={cn(
                  "rounded-xl border p-3 transition-all",
                  isActive
                    ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40 shadow-xs"
                    : "border-border bg-surface"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-navy-900">
                    {app.class} {isActive && <span className="text-[10px] font-sans text-blue-600">(Active)</span>}
                  </span>
                  <span className={cn("rounded border px-1.5 py-0.2 text-[10px] font-bold", STATUS_PILL[app.status])}>
                    {app.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-muted leading-snug">{app.guidance}</p>
                <div className="mt-2 text-[10px] font-mono text-text-subtle">{app.operationalLimits}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Expected Risk Reduction Impact */}
      <div className="rounded-xl border border-risk-low/30 bg-risk-low-bg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-risk-low" />
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Expected Risk Reduction: {sop.riskReduction.targetMetric}
            </h4>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold text-risk-low">{sop.riskReduction.riskScoreDelta} pts</span>
            <span className="font-mono text-xs font-semibold text-risk-low">({sop.riskReduction.percentageReduction})</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-secondary">
          <span className="rounded bg-surface px-2 py-0.5 border border-risk-low/20 font-mono">
            {sop.riskReduction.confidence}
          </span>
          {sop.riskReduction.coBenefits.map((b, i) => (
            <span key={i} className="rounded bg-surface px-2 py-0.5 border border-border">
              + {b}
            </span>
          ))}
        </div>
      </div>
    </RiskModalBase>
  );
}
```

---

### 4.5 Integration in `app/risk/page.tsx`

The M3 Worker can integrate the modals into `app/risk/page.tsx` with this clean drop-in pattern:

```tsx
// Imports to add to app/risk/page.tsx:
import { ConsequenceModal } from "@/components/risk/ConsequenceModal";
import { MitigationModal } from "@/components/risk/MitigationModal";
import { ChevronRight, ExternalLink } from "lucide-react";

// State hooks to add:
const [selectedConsequenceKey, setSelectedConsequenceKey] = useState<string | null>(null);
const [selectedMitigationId, setSelectedMitigationId] = useState<string | null>(null);

// Interactive Consequence Card Button:
{consequences.map((c) => (
  <button
    type="button"
    key={c.key}
    onClick={() => setSelectedConsequenceKey(c.key)}
    className="rounded-xl border border-border bg-surface p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all text-left cursor-pointer group focus-visible:ring-2 focus-visible:ring-blue-600"
    aria-label={`Inspect factor decomposition for ${c.label}`}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-text-muted group-hover:text-blue-600 transition-colors">{c.label}</p>
      <span className="text-[10px] text-text-subtle group-hover:text-blue-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        Breakdown <ChevronRight size={12} />
      </span>
    </div>
    <p className="mt-2 font-mono text-2xl font-bold text-navy-900">{c.value}</p>
    <div className="mt-3">
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={cn("h-full rounded-full", riskBar(c.score))} style={{ width: `${Math.min(c.score, 100)}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-text-subtle">{riskLabel(c.score)}</p>
    </div>
  </button>
))}

// Interactive Mitigation Row with SOP trigger:
<li key={m.id} className={cn("flex items-start gap-4 px-5 py-4 transition-colors", isAcked ? "bg-surface2" : "hover:bg-surface2/60")}>
  <button
    type="button"
    className="mt-0.5 shrink-0"
    onClick={() => setAcked((s) => ({ ...s, [m.id]: !s[m.id] }))}
    aria-label={isAcked ? `Unacknowledge ${m.title}` : `Acknowledge ${m.title}`}
  >
    {isAcked ? <CheckCircle2 size={18} className="text-risk-low" /> : <Circle size={18} className="text-border-strong" />}
  </button>
  <div
    className="flex-1 min-w-0 cursor-pointer group"
    onClick={() => setSelectedMitigationId(m.id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedMitigationId(m.id); }}
    aria-label={`Inspect standard operating procedure for ${m.title}`}
  >
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn("text-sm font-semibold group-hover:text-blue-600 transition-colors", isAcked ? "text-text-muted line-through" : "text-navy-900")}>
        {m.title}
      </span>
      <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold", STATUS_STYLE[m.status])}>
        <StatusIcon size={9} />
        {m.status}
      </span>
      <span className="ml-auto text-[10px] text-blue-600 font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        Inspect SOP <ExternalLink size={10} />
      </span>
    </div>
    <p className={cn("mt-0.5 text-xs", isAcked ? "text-text-subtle" : "text-text-muted")}>
      {m.detail}
    </p>
  </div>
</li>

// Render Modals:
const activeConsequence = consequences.find((c) => c.key === selectedConsequenceKey);

<ConsequenceModal
  isOpen={selectedConsequenceKey !== null}
  onClose={() => setSelectedConsequenceKey(null)}
  consequenceKey={selectedConsequenceKey}
  consequenceScore={activeConsequence?.score ?? 0}
  consequenceValue={activeConsequence?.value ?? ""}
  vessel={vessel}
  selectedRoute={selectedRoute}
/>

<MitigationModal
  isOpen={selectedMitigationId !== null}
  onClose={() => setSelectedMitigationId(null)}
  mitigationId={selectedMitigationId}
  isAcknowledged={Boolean(selectedMitigationId && acked[selectedMitigationId])}
  onToggleAcknowledge={(id) => setAcked((s) => ({ ...s, [id]: !s[id] }))}
  activeVesselClass={vessel.iceClass}
/>
```

---

## 5. Verification Method

### 5.1 Automated Test Suite Execution
Execute the full frontend test suite:
```bash
npm test
```
**Expected Outcome:**
- All existing 50 tests pass with zero regressions.
- Milestone 3 tests (e.g. `tests/risk_modals.test.ts`) run and pass smoothly.

### 5.2 Unit Test File Specification (`tests/risk_modals.test.ts`)
The M3 Worker or Verifier should create `tests/risk_modals.test.ts` to test:
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CONSEQUENCE_DETAILS_MAP, MITIGATION_SOPS_MAP } from '../lib/riskDetailData';
import { VESSELS } from '../lib/data';

describe('Detailed Breakdown Modals Data Verification', () => {
  describe('Consequence Breakdown Datasets', () => {
    it('verifies all 4 consequence keys exist with factor weights summing to 100%', () => {
      const keys = ['besetment', 'delay', 'fuel', 'disruption'];
      for (const key of keys) {
        const detail = CONSEQUENCE_DETAILS_MAP[key];
        assert.ok(detail, `Consequence ${key} must exist`);
        assert.ok(detail.factors.length >= 4, `Consequence ${key} must have at least 4 factors`);
        
        const totalWeight = detail.factors.reduce((sum, f) => sum + f.weightPct, 0);
        assert.strictEqual(totalWeight, 100, `Factors weight for ${key} must sum exactly to 100%`);

        assert.ok(detail.historicalBaseline.tenYearMeanScore > 0);
        assert.ok(detail.polarCode.chapter.length > 0);
        assert.ok(detail.preventionTactics.length >= 4);
      }
    });

    it('verifies vessel limits mapping across all 5 active vessels', () => {
      for (const v of VESSELS) {
        const besetmentLimits = CONSEQUENCE_DETAILS_MAP.besetment.vesselLimits[v.iceClass];
        assert.ok(besetmentLimits, `Vessel limits must cover ice class ${v.iceClass}`);
        if (v.iceClass === 'OpenWater') {
          assert.strictEqual(besetmentLimits.escortRequired, true);
          assert.ok(besetmentLimits.warningAlert?.includes('CRITICAL POLAR RESTRICTION'));
        }
      }
    });
  });

  describe('Mitigation SOP Datasets', () => {
    it('verifies all 7 mitigations have complete 3-phase SOP and Polar Code references', () => {
      const ids = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
      for (const id of ids) {
        const sop = MITIGATION_SOPS_MAP[id];
        assert.ok(sop, `Mitigation SOP ${id} must exist`);
        assert.strictEqual(sop.phases.length, 3, 'Must have Pre-Entry, Execution, and Contingency phases');
        assert.ok(sop.responsibleRoles.length > 0);
        assert.ok(sop.polarCodeRef.chapter.length > 0);
        assert.strictEqual(sop.applicability.length, 4, 'Must have PC2, PC4, PC5, OpenWater applicability');
        assert.ok(sop.riskReduction.riskScoreDelta < 0, 'Risk delta must be a reduction (negative value)');
      }
    });
  });
});
```

### 5.3 Manual & Browser UX Verification Steps
1. **Consequence Modal Inspection:**
   - Navigate to `/risk`.
   - Click the "Besetment Risk" card.
   - Verify modal opens with smooth animation (`animate-fade-in`), blurred backdrop, and score `75` (if OpenWater) or `35` (if PC2/PC4/PC5).
   - Check factor decomposition bars and historical baseline comparison.
   - If vessel is `MV Antarctic Navigator (OpenWater)`, verify prominent Red statutory warning banner appears.
   - Press `Escape` or click backdrop; verify modal dismisses cleanly and background scroll is restored.
2. **Mitigation SOP Modal Inspection:**
   - Click "Reduce speed in pack ice" row.
   - Verify 3-phase SOP appears with numbered phases.
   - Verify IMO Polar Code Chapter 6 & 9 citations.
   - Verify Vessel Ice-Class Matrix highlights the currently active vessel class.
   - Click "Acknowledge Tactical Measure" button inside modal footer; verify acknowledgment state toggles and reflects on the main page.
   - Close modal via the `X` button.
3. **Accessibility Verification:**
   - Tab through the page; ensure consequence cards and mitigation items are keyboard focusable.
   - Press `Enter` on a focused consequence card; verify modal opens.
   - Tab within the open modal; verify focus cycles exclusively within modal elements (focus trapping).
   - Press `Escape`; verify modal closes and focus returns to the card that opened it.

### 5.4 Invalidation Conditions
- Any implementation that relies on third-party modal dependencies incompatible with Next.js 15 App Router or React 19 is invalid.
- Any implementation that mutates `lib/data.ts`'s `MITIGATIONS` in a way that breaks existing test assertions in `tests/data_and_utils.test.ts` is invalid.
- Any implementation where opening a modal fails to trap focus or fail keyboard `Escape` dismissal is invalid.
- Any implementation where consequence cards or mitigation items are non-interactive is invalid.
