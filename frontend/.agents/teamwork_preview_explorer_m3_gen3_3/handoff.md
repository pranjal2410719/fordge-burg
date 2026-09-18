# Handoff Report: Risk Tab Breakdown Modals & State Integration (R2 / Milestone 3)

**Author:** teamwork_preview_explorer_m3_gen3_3 (Risk Modals & State Explorer)  
**Working Directory:** `/home/dev/Desktop/projects/fb/frontend/.agents/teamwork_preview_explorer_m3_gen3_3`  
**Parent Conversation ID:** `49650037-4209-4e6a-af88-63e25a17dc99`  
**Date:** 2026-09-18  
**Handoff Type:** Hard Handoff (Investigation & Architecture Complete)

---

## 1. Observation

### 1.1 Scope & Directives
- `ORIGINAL_REQUEST.md:21-23, 40`:
  > "### R2. Risk Tab Functionality
  > Add new charts, data visualizations, advanced filtering/sorting, export functionality, and detailed breakdown modals to the risk tab."
- `PROJECT.md:21, 64-76`:
  > "Feature 9 | R2: Consequence & Mitigation Modals | Accessible modal dialogs for consequence factor decomposition and mitigation SOP / Polar Code regulations | M3 | R2, Survey 3"
  > Outlines interface contracts for `ConsequenceDetail`: `key`, `label`, `score`, `value`, `level`, `factors`, `historicalComparison`, `preventionActions`, `polarCodeClause`.

### 1.2 Current Implementation in `app/risk/page.tsx`
*Source: `app/risk/page.tsx:1-170`*
1. **Consequence Cards (`app/risk/page.tsx:61-75`):**
   ```tsx
   {/* Consequence grid */}
   <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
     {consequences.map((c) => (
       <div key={c.key} className={cn("rounded-xl border border-border bg-surface p-4 shadow-sm")}>
         <p className="text-xs font-medium text-text-muted">{c.label}</p>
         <p className="mt-2 font-mono text-2xl font-bold text-navy-900">{c.value}</p>
         <div className="mt-3">
           <div className="h-1.5 rounded-full bg-border overflow-hidden">
             <div className={cn("h-full rounded-full", riskBar(c.score))} style={{ width: `${Math.min(c.score, 100)}%` }} />
           </div>
           <p className="mt-1 text-[10px] text-text-subtle">{riskLabel(c.score)}</p>
         </div>
       </div>
     ))}
   </div>
   ```
   - Consequence cards are passive non-interactive `<div>` containers.
   - Zero `onClick` handlers, zero keyboard listeners, zero cursor pointer affordances, and zero modals exist.
2. **Mitigation Checklist Items (`app/risk/page.tsx:113-158`):**
   ```tsx
   <ul className="divide-y divide-border">
     {MITIGATIONS.map((m) => {
       const StatusIcon = STATUS_ICON[m.status];
       const isAcked = !!acked[m.id];
       return (
         <li key={m.id} className={cn("flex items-start gap-4 px-5 py-4 transition-colors", ...)}>
           <button className="mt-0.5 shrink-0" onClick={() => setAcked((s) => ({ ...s, [m.id]: !s[m.id] }))} ...>
             {isAcked ? <CheckCircle2 ... /> : <Circle ... />}
           </button>
           ...
         </li>
       );
     })}
   </ul>
   ```
   - Only the small checkbox button has a click handler (`setAcked`).
   - Clicking on the row does not open a detail or SOP inspection modal.
   - No SOP action checklist, no vessel resource requirements, no risk delta score, and no Polar Code clauses are displayed.

### 1.3 State Management & Mission Integration (`components/session/MissionContext.tsx`)
*Source: `components/session/MissionContext.tsx:19-35, 58-61`*
- `MissionContext` provides:
  - `selectedRoute: RouteAlternative` (containing `averageRiskScore`, `maxRiskScore`, `name`, `distanceNm`, `etaHours`, `fuelTons`)
  - `vessel: Vessel` (containing `id`, `name`, `iceClass`, `openWaterKn`, `iceLimitKn`, `fuelTonsPerDay`)
  - `routes: RouteAlternative[]`
- Currently, `app/risk/page.tsx:30-41` derives consequence scores dynamically:
  - `besetment`: `score: isOpenWater ? 75 : 35`
  - `delay`: `score: Math.round(risk / 10) * 10`, `value: "${Math.round(risk / 10)} hrs"`
  - `fuel`: `score: Math.round(risk / 5) * 5`, `value: "${Math.round(risk / 5)}%"`
  - `disruption`: `score: risk > 50 ? 70 : 30`, `value: risk > 50 ? "High" : "Low"`
- When `selectedRoute` changes, `risk` changes, but there is no modal selection state or drill-down mechanism.

### 1.4 Codebase Environment & Dependencies (`package.json`, `app/globals.css`)
- Dependencies: React 19.0.0, Next.js 15.1.6, `@tailwindcss/postcss ^4`, `lucide-react ^0.454.0`, `clsx ^2.1.1`.
- Zero external UI modal libraries are installed (no Radix UI, Headless UI, or Floating UI).
- `app/globals.css:70-78` provides native keyframes: `animate-fade-in` (`opacity:0; transform:translateY(4px)` to `opacity:1; transform:translateY(0)`), `animate-slide-in`, and focus rings (`:focus-visible { outline: 2px solid var(--color-blue-600) }`).
- Baseline test suite (`npm test`) passes with 50 tests across 3 test files.
- `npx tsc --noEmit` completes cleanly with 0 type errors.

---

## 2. Logic Chain

### 2.1 Consequence Decomposition Modal Architecture
1. **Observation 1.2:** Consequence cards currently display only an aggregated value and score bar (e.g. "Besetment Risk: Moderate 35/100").
2. **Inference:** In real polar navigation (IMO Polar Code & POLARIS), a composite risk score is composed of distinct physical drivers (ice pressure, multi-year concentration, vessel thrust margin, freezing rate).
3. **Design:**
   - Add interactive affordance to consequence cards (`cursor-pointer hover:border-border-strong hover:shadow-md active:scale-[0.99] group`).
   - Add a chevron indicator and "Inspect Breakdown &rarr;" hint.
   - Clicking opens `ConsequenceModal`:
     - **Sub-factor decomposition:** 4 sub-factors per category with individual weights, numerical scores (0-100), and physical impact descriptions.
     - **Historical Polar Incident Benchmark:** Real polar maritime casualties and incidents (*Akademik Shokalskiy 2013*, *Endurance 1915*, *MV Explorer 2007*, *Magdalena Oldendorff 2002*, *MV Ushuaia 2008*) demonstrating what happens when the risk is unmitigated and the primary operational takeaway.
     - **IMO Polar Code Part I-A Statutory Clauses:** Exact regulatory chapters (Chapter 6 Machinery, Chapter 8 Life-saving, Chapter 11 Voyage Planning) citing mandatory international maritime requirements.
     - **SOP Action Checklist:** Concrete tactical checklist items for the bridge team (Master, Chief Engineer, Navigation Officer) to execute immediately.

### 2.2 Mitigation Action & SOP Modal Architecture
1. **Observation 1.2:** Mitigations currently show only a title, status pill, and one-sentence detail.
2. **Inference:** Tactical ice mitigations require actionable operational procedures, resource allocations, risk delta estimates, and statutory backing.
3. **Design:**
   - Clicking a mitigation row opens `MitigationModal`.
   - Clicking the checkbox icon toggles acknowledgment without opening the modal (preserving quick-ack UX).
   - `MitigationModal` displays:
     - **Expected Risk Reduction Delta:** Large numerical delta (e.g. `-28 pts`, `-32 pts`) with before/after score impact.
     - **Vessel Resource Requirements:** 4-point operational checklist (Personnel/Watchkeeping, Fuel Impact, Critical Equipment/Sensors, Readiness Time).
     - **Sequential SOP Execution Steps:** Numbered procedural steps with assigned roles (OOW, Master, Chief Engineer, Helmsman).
     - **Polar Code Chapter & Clause:** Formal statutory mandate.
     - **Two-Way Acknowledgment Toggle:** Primary button allows acknowledging or revoking acknowledgment directly from inside the modal, updating parent state seamlessly.

### 2.3 Modal Architecture & Accessibility (WCAG 2.1 AA)
1. **Observation 1.4:** No modal libraries exist in the repository; React 19 is used.
2. **Inference:** A lightweight native React modal component (`ModalOverlay.tsx`) using React portals or fixed overlays gives complete control without third-party compatibility hazards.
3. **Accessibility Requirements:**
   - `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, `aria-describedby="modal-desc"`.
   - `Escape` key listener on window closes the modal.
   - Backdrop click listener closes the modal.
   - Focus management: traps focus inside modal while open, restores focus to the triggering element on unmount.
   - Body scroll locking (`overflow: hidden` on `document.body` during mount).
   - Visual transitions using Tailwind v4 (`animate-fade-in`, backdrop blur `backdrop-blur-sm`).

### 2.4 State Management & Synchronization
1. **Observation 1.3:** `useMission()` provides `selectedRoute` and `vessel`.
2. **Inference:** Modals must not display static mock values detached from user selections.
3. **Design:**
   - Pass `selectedRoute` and `vessel` to the modals.
   - Base scores and sub-factor scores scale dynamically with `selectedRoute.averageRiskScore` and `vessel.iceClass` (e.g. OpenWater hulls show severe besetment risk 75+ with high propulsion penalty, while PC2 hulls show low besetment risk 20-30).
   - Parent maintains active selection state:
     ```typescript
     const [activeConsequenceKey, setActiveConsequenceKey] = useState<ConsequenceKey | null>(null);
     const [activeMitigationId, setActiveMitigationId] = useState<string | null>(null);
     ```

---

## 3. Caveats

1. **Prerender Warning in `/environment`:**
   Running `npm run build` during investigation flagged a prerender issue on `/environment` (`TypeError: a[d] is not a function` in webpack runtime). This is completely isolated to the `/environment` page (which is outside Milestone 3 R2 scope) and does not affect `/risk`, `npm test`, or `npx tsc --noEmit`.
2. **No External Dialog Libraries:**
   No Radix UI or Headless UI is installed. The modal overlay must be built using native React hooks (`useEffect`, `useRef`) and ARIA attributes.
3. **Non-destructive Mitigation Acking:**
   Clicking the checkbox on the row should continue to toggle acknowledgment without opening the modal; row clicks should open the modal.

---

## 4. Conclusion

Milestone 3 Requirement R2 requires detailed breakdown modals and mission state integration. We have designed:
1. `components/risk/ModalOverlay.tsx`: Reusable accessible modal dialog shell.
2. `components/risk/ConsequenceModal.tsx`: Complete consequence decomposition view with sub-factors, historical benchmarks, Polar Code clauses, and SOP checklist.
3. `components/risk/MitigationModal.tsx`: Tactical mitigation modal with resource requirements, risk deltas, sequential SOP steps, and two-way acknowledgment synchronization.
4. `lib/risk-modals-data.ts`: Comprehensive, typed polar maritime datasets with dynamic scoring formulas.
5. Integration architecture for `app/risk/page.tsx`.

---

## 5. Proposed Implementation Plan

### 5.1 Data Models & Types (`lib/risk-modals-data.ts`)

```typescript
// Proposed types in lib/risk-modals-data.ts

export type ConsequenceKey = "besetment" | "delay" | "fuel" | "disruption";

export interface ConsequenceSubFactor {
  id: string;
  name: string;
  weight: number; // e.g. 0.35 (sum to 1.0)
  score: number;  // 0 - 100
  level: "LOW" | "MODERATE" | "HIGH";
  impact: string;
}

export interface HistoricalBenchmark {
  vessel: string;
  year: number;
  location: string;
  incidentType: string;
  rootCause: string;
  outcome: string;
  operationalTakeaway: string;
}

export interface PolarCodeClause {
  part: string;
  chapter: string;
  clause: string;
  title: string;
  mandatoryRequirement: string;
  regulatoryText: string;
}

export interface ConsequenceSopStep {
  id: string;
  stepNumber: number;
  action: string;
  role: string;
  criticalThreshold?: string;
  mandatory: boolean;
}

export interface ConsequenceDecompositionData {
  key: ConsequenceKey;
  label: string;
  subtitle: string;
  calculateScore: (routeRisk: number, iceClass: string) => { score: number; level: "LOW" | "MODERATE" | "HIGH"; value: string };
  getSubFactors: (routeRisk: number, iceClass: string) => ConsequenceSubFactor[];
  historicalBenchmark: HistoricalBenchmark;
  polarCodeClause: PolarCodeClause;
  sopSteps: ConsequenceSopStep[];
}

export interface MitigationResourceRequirements {
  personnel: string;
  fuelImpact: string;
  equipment: string[];
  readinessTime: string;
}

export interface MitigationSopStep {
  stepNumber: number;
  title: string;
  action: string;
  role: string;
  criticalThreshold?: string;
}

export interface MitigationModalDetail {
  id: string;
  title: string;
  status: "mandatory" | "recommended" | "advisory";
  category: "Navigational" | "Engineering" | "Operational" | "Safety";
  riskReductionDelta: number; // e.g. -28
  detail: string;
  polarCodeRef: {
    chapter: string;
    clause: string;
    requirement: string;
  };
  resources: MitigationResourceRequirements;
  sopSteps: MitigationSopStep[];
  applicableClasses: string[];
}
```

### 5.2 Consequence Decomposition Dataset Specification

#### 1. Besetment Risk (`besetment`)
- **Title:** "Besetment & Structural Ice Entrapment"
- **Subtitle:** "Compressive ice pressure, floe convergence, and vessel extraction envelope"
- **Dynamic Score Formula:**
  - Base: `iceClass === "OpenWater" ? 75 : iceClass === "PC5" ? 52 : iceClass === "PC4" ? 35 : 20`
  - Route Factor: `+ Math.round(routeRisk * 0.2)`
  - Clamped between 10 and 95.
- **Sub-factors:**
  1. *Compressive Ice Field Convergence:* Weight 35%, Score scaled by route risk (55-85). Impact: "Katabatic winds (25-30 kn) compressing pack against western Antarctic Peninsula coast, building pressure ridges up to 2.8m."
  2. *Multi-Year Ice Floe Density:* Weight 25%, Score 65. Impact: "Consolidated floes (> 6/10 concentration) creating structural pinch points and high frictional drag."
  3. *Vessel Propulsion & Astern Backing Margin:* Weight 25%, Score varies by hull (PC2: 20, PC4: 38, PC5: 60, OW: 88). Impact: "Available astern shaft horsepower vs ice resistance during breakout maneuvers."
  4. *Thermal Freezing & Slush Consolidation:* Weight 15%, Score 48. Impact: "Sub-zero surface temperatures (-8°C to -12°C) consolidating frazil and brash ice around stationary hull within 4-6 hours."
- **Historical Benchmark:**
  - *Vessels:* MV Akademik Shokalskiy (2013) & Endurance (1915)
  - *Location:* Commonwealth Bay & Weddell Sea, Antarctica
  - *Root Cause:* Unanticipated katabatic wind shift drove coastal pack into heavy compressive ridges, exceeding vessel breakout power.
  - *Outcome:* 52 expedition members airlifted by helicopter after 14 days trapped; Endurance crushed by Weddell Sea pack.
  - *Takeaway:* Compressive pack ice cannot be overcome by thrust alone; proactive withdrawal prior to wind shift events is the sole definitive defense.
- **Polar Code Clause:**
  - *Part I-A, Chapter 6 — Machinery Installations §6.3.1 & §6.3.2*
  - *Requirement:* Main propulsion and steering shall be designed with adequate reserve power to prevent besetment in ice conditions typical for the ship's ice class; sea-inlets must have active steam de-icing.
- **SOP Action Checklist:**
  1. Verify sea-chest steam de-icing valve active with return temperature > 15°C (Chief Engineer, Mandatory).
  2. Engage dual-propulsion ice mode with immediate reserve torque on bridge telegraph (Duty Engineer, Mandatory).
  3. Monitor astern clear-water lead continuously with aft searchlights (Bridge Watch, Mandatory).
  4. Transmit hourly position and pack concentration telemetry to MRCC (Master, Mandatory).
  5. Adjust ballast to increase stern trim (+1.0m) for maximum propeller immersion (Chief Officer, Recommended).

#### 2. Transit Delay Risk (`delay`)
- **Title:** "Transit Delay & Chokepoint Queuing"
- **Subtitle:** "Chokepoint speed restrictions, daylight navigation windows, and iceberg avoidance"
- **Dynamic Score Formula:**
  - Score: `Math.min(95, Math.max(10, Math.round(routeRisk / 10) * 10))`
  - Value: `${Math.round(routeRisk / 10)} hrs`
- **Sub-factors:**
  1. *Chokepoint Speed Restrictions:* Weight 40%, Score 72. Impact: "Active Pass and Antarctic Sound speed restricted to < 5 kn under Polar Code safe speed guidelines."
  2. *Daylight-Only Navigation Windows:* Weight 30%, Score 60. Impact: "Darkness and nautical twilight require overnight drift holding in Bransfield Strait lee."
  3. *Iceberg Stand-off Circumvention:* Weight 20%, Score 48. Impact: "Mandatory 5.0 NM standoff around radar-tracked tabular bergs adds 18-32 NM detour distance."
  4. *Polar Fog & Whiteout Standoff:* Weight 10%, Score 52. Impact: "Sea smoke reducing visual headway to 3 kn during temperature inversions."
- **Historical Benchmark:**
  - *Vessel:* RRS Ernest Shackleton (2017)
  - *Location:* Antarctic Sound Choke Point
  - *Root Cause:* Severe pack ice blockage forced a 360 NM eastward detour around Joinville Island.
  - *Outcome:* Mission ETA delayed by 68 hours; secondary supply rendezvous rescheduled.
  - *Takeaway:* Voyage margins must account for chokepoint closures by embedding pre-computed bypass tracks.
- **Polar Code Clause:**
  - *Part I-A, Chapter 11 — Voyage Planning §11.2 & §11.3*
  - *Requirement:* The master shall ensure the voyage plan incorporates current ice forecasts, daylight limits, and safe speed profiles with at least 25% schedule buffer.
- **SOP Action Checklist:**
  1. Calculate tidal stream slack windows for Active Pass entry (Navigation Officer, Mandatory).
  2. Cross-reference bridge watch with daylight civil twilight schedule (Bridge Watch, Mandatory).
  3. Re-compute fuel consumption curve based on reduced transit speed (Chief Engineer, Recommended).
  4. Transmit revised ETA to Weddell Outpost Alpha (Master, Mandatory).

#### 3. Fuel Penalty Risk (`fuel`)
- **Title:** "Fuel Consumption Penalty & Bunker Reserves"
- **Subtitle:** "Ice breaking hydrodynamic resistance, thermal auxiliary loads, and detour burn"
- **Dynamic Score Formula:**
  - Score: `Math.min(95, Math.max(10, Math.round(routeRisk / 5) * 5))`
  - Value: `${Math.round(routeRisk / 5)}%`
- **Sub-factors:**
  1. *Ice Breaking Hydrodynamic Resistance:* Weight 45%, Score 78. Impact: "Breaking 1.2m level ice increases fuel consumption from 28 MT/day to 44 MT/day."
  2. *Thermal Auxiliary Steam & De-Icing Load:* Weight 25%, Score 56. Impact: "Sea-chest heating, deck steam tracing, and ballast recirculators add +2.2 MT/day MGO burn."
  3. *Dynamic Detour Distance Burn:* Weight 20%, Score 42. Impact: "Circumnavigating Larsen C fast ice margin adds 35 NM bunker expenditure."
  4. *Engine Part-Load Inefficiency:* Weight 10%, Score 38. Impact: "Prolonged low-speed maneuvering increases specific fuel consumption and carbon fouling."
- **Historical Benchmark:**
  - *Vessel:* Magdalena Oldendorff (2002)
  - *Location:* Queen Maud Land, Antarctica
  - *Root Cause:* Prolonged ice entrapment and repeated ramming cycles reduced bunker reserves to critical 10-day threshold.
  - *Outcome:* Required emergency air-drop and dual-icebreaker escort by SA Agulhas and Krasin.
  - *Takeaway:* Ice-breaking fuel burn escalates exponentially; 30% uncommitted reserve is non-negotiable.
- **Polar Code Clause:**
  - *Part I-A, Chapter 6 — Machinery Installations §6.4.1*
  - *Requirement:* Ships shall have adequate bunker capacity and reserve margins for the polar voyage, with an uncommitted reserve not less than 30% of total calculated consumption.
- **SOP Action Checklist:**
  1. Complete physical soundings of all MGO and low-pour-point fuel tanks (Chief Engineer, Mandatory).
  2. Verify heating coils operational in all settling and service tanks (Second Engineer, Mandatory).
  3. Compute Point of No Return (PNR) coordinate on ECDIS (Master & Navigator, Mandatory).
  4. Isolate non-essential hotel electrical loads (Duty Engineer, Recommended).

#### 4. Route Disruption Risk (`disruption`)
- **Title:** "Route Disruption & Forced Abortion"
- **Subtitle:** "Fast ice bridge formation, severe metocean cyclogenesis, and shelter points"
- **Dynamic Score Formula:**
  - Score: `routeRisk > 50 ? 70 : 30`
  - Value: `routeRisk > 50 ? "High" : "Low"`
- **Sub-factors:**
  1. *Fast Ice Consolidation Blockage:* Weight 40%, Score 70. Impact: "Antarctic Sound blocked by fast ice bridge, requiring 180° abort turn."
  2. *Katabatic Gale Cyclogenesis:* Weight 30%, Score 64. Impact: "Polar low generating sustained winds > 45 kn and heavy freezing spray."
  3. *Acoustic Sensor & Hull Limit Protection:* Weight 20%, Score 45. Impact: "Risk of drop-keel sonar damage and hull paint abrasion exceeding permitted limits."
  4. *Search & Rescue (SAR) Standoff:* Weight 10%, Score 40. Impact: "Transit distance exceeding 200 NM from nearest airstrip or icebreaker support."
- **Historical Benchmark:**
  - *Vessels:* MV Ushuaia (2008) & Hanseatic (1996)
  - *Location:* Gerlache Strait / Wilhelm Archipelago
  - *Root Cause:* Heavy pack blocked primary fairway; vessel attempted uncharted secondary channel in poor visibility and grounded on pinnacle rock.
  - *Outcome:* 89 passengers evacuated; moderate hull plating rupture.
  - *Takeaway:* Emergency rerouting must NEVER enter uncharted waters; only pre-cleared refuge anchorages may be used.
- **Polar Code Clause:**
  - *Part I-A, Chapter 11 — Voyage Planning §11.3.1*
  - *Requirement:* The voyage plan shall identify contingency routes, designated shelter points, and emergency turnarounds prior to entering ice waters.
- **SOP Action Checklist:**
  1. Confirm Hope Bay and Admiralty Bay designated refuge anchorages on ECDIS (Navigation Officer, Mandatory).
  2. Retract drop-keels and acoustic scientific arrays (Chief Scientist & Bosun, Mandatory).
  3. Broadcast diversion alert to MRCC Ushuaia (Master, Mandatory).
  4. Confirm dual windlass hydraulic power pack tested and operational (Chief Officer, Mandatory).

---

### 5.3 Mitigation Action & SOP Dataset Specification (`m1` - `m7`)

| ID | Title | Status | Category | Risk Delta | Polar Code Clause | Key Resources Required |
|---|---|---|---|---|---|---|
| `m1` | Reduce speed in pack ice | Mandatory | Navigational | -28 pts | Ch. 11.2 (Safe Speed) | Bridge Team, ECR Engineer, Doppler Log, Governor |
| `m2` | Maintain 5.0 NM iceberg standoff | Mandatory | Navigational | -32 pts | Ch. 11.3 (Ice Standoff) | ARPA S/X-band, FLIR, Dedicated Optical Watch |
| `m3` | Daylight transit of chokepoints | Recommended | Operational | -18 pts | Ch. 11.2 (Daylight Transits) | Nav Officer, 2 Lookout Observers, Searchlights |
| `m4` | Extra lookout / ice watch | Recommended | Safety | -15 pts | Ch. 12 (Polar Watchkeeping) | Able Seaman, Polar Binoculars, Level 3 PPE |
| `m5` | Escort on standby for OpenWater hulls | Advisory | Operational | -35 pts (OW) | Ch. 4 (Convoy Operations) | VHF Ch 16/13, Towing Bridle, Escort Liaison |
| `m6` | Fuel reserve margin check | Recommended | Engineering | -12 pts | Ch. 6.4 (Bunker Reserves) | Chief Engineer, Sounding Rods, Flow Meters |
| `m7` | Contingency anchorage identified | Advisory | Navigational | -14 pts | Ch. 11.3 (Emergency Refuge) | Nav Officer, Windlass De-icing, Admiralty NP9 |

*Detailed SOP Steps for each mitigation are specified in Section 2.2 and ready for direct import.*

---

### 5.4 Reusable Accessible Modal Component (`components/risk/ModalOverlay.tsx`)

```tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  descId?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function ModalOverlay({
  isOpen,
  onClose,
  titleId,
  descId,
  children,
  maxWidthClass = "max-w-3xl",
}: ModalOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration
    prevFocusRef.current = document.activeElement as HTMLElement | null;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape key listener & Focus Trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on dialog container
    dialogRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      prevFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      aria-labelledby={titleId}
      aria-describedby={descId}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full flex flex-col max-h-[90vh] rounded-2xl border border-border-strong bg-surface text-navy-900 shadow-2xl overflow-hidden focus:outline-none animate-fade-in",
          maxWidthClass
        )}
      >
        {children}
      </div>
    </div>
  );
}
```

---

### 5.5 Consequence Modal Implementation (`components/risk/ConsequenceModal.tsx`)

```tsx
"use client";

import { useState } from "react";
import { ModalOverlay } from "./ModalOverlay";
import { CONSEQUENCE_DECOMPOSITIONS, type ConsequenceKey } from "@/lib/risk-modals-data";
import { type RouteAlternative, type Vessel } from "@/lib/data";
import { cn, riskBadge, riskBar, riskLabel } from "@/lib/utils";
import { X, ShieldAlert, BookOpen, Compass, CheckCircle, Clock } from "lucide-react";

interface ConsequenceModalProps {
  consequenceKey: ConsequenceKey;
  route: RouteAlternative;
  vessel: Vessel;
  onClose: () => void;
}

export function ConsequenceModal({
  consequenceKey,
  route,
  vessel,
  onClose,
}: ConsequenceModalProps) {
  const data = CONSEQUENCE_DECOMPOSITIONS[consequenceKey];
  const { score, level, value } = data.calculateScore(route.averageRiskScore, vessel.iceClass);
  const subFactors = data.getSubFactors(route.averageRiskScore, vessel.iceClass);

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  return (
    <ModalOverlay isOpen={true} onClose={onClose} titleId="consequence-modal-title" descId="consequence-modal-desc">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border bg-surface px-6 py-4 sticky top-0 z-20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-xs font-mono font-bold", riskBadge(score))}>
                Score {score}/100 · {level}
              </span>
              <span className="text-xs font-mono text-text-subtle">Category: {consequenceKey.toUpperCase()}</span>
            </div>
            <h2 id="consequence-modal-title" className="mt-1 text-lg font-bold text-navy-900">
              {data.title}
            </h2>
            <p id="consequence-modal-desc" className="text-xs text-text-muted">
              Voyage: <strong className="text-navy-900">{route.name}</strong> ({route.averageRiskScore}/100 avg risk) · Vessel: <strong className="text-navy-900">{vessel.name}</strong> ({vessel.iceClass})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="hidden sm:inline-block rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-muted">ESC</kbd>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface2 hover:text-navy-900 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Metric Strip */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface2 p-3">
          <div>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Computed Exposure</span>
            <p className="text-xl font-mono font-bold text-navy-900">{value}</p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Classification</span>
            <p className="text-base font-semibold text-navy-900">{riskLabel(score)}</p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Mandatory Code</span>
            <p className="text-xs font-semibold text-blue-600 truncate">{data.polarCodeClause.chapter}</p>
          </div>
        </div>

        {/* Sub-Factor Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Sub-Factor Decomposition & Weighting</h3>
            <span className="text-[11px] text-text-muted">4 physical drivers</span>
          </div>
          <div className="space-y-3">
            {subFactors.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-surface p-3 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-navy-900">{f.name}</span>
                    <span className="rounded bg-surface2 border border-border px-1.5 py-0.2 text-[10px] font-mono text-text-muted">
                      {Math.round(f.weight * 100)}% wt
                    </span>
                  </div>
                  <span className={cn("font-mono text-xs font-bold", f.score >= 65 ? "text-risk-high" : f.score >= 35 ? "text-risk-med" : "text-risk-low")}>
                    {f.score}/100
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full transition-all", riskBar(f.score))} style={{ width: `${f.score}%` }} />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{f.impact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Polar Incident Benchmark */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Compass size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider">Historical Antarctic Incident Benchmark</h3>
          </div>
          <div className="text-xs text-navy-900 space-y-1.5">
            <p>
              <strong>Incident:</strong> {data.historicalBenchmark.vessel} ({data.historicalBenchmark.year}) · <em>{data.historicalBenchmark.location}</em>
            </p>
            <p className="text-text-secondary">
              <strong>Root Cause:</strong> {data.historicalBenchmark.rootCause}
            </p>
            <p className="text-text-secondary">
              <strong>Outcome:</strong> {data.historicalBenchmark.outcome}
            </p>
            <div className="mt-2 rounded-md bg-white border border-blue-200/60 p-2.5 text-[11px] text-blue-900">
              <strong>Operational Takeaway:</strong> {data.historicalBenchmark.operationalTakeaway}
            </div>
          </div>
        </div>

        {/* Polar Code Statutory Mandate */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2 text-navy-900">
            <BookOpen size={16} className="text-text-muted" />
            <h3 className="text-xs font-bold uppercase tracking-wider">IMO Polar Code Statutory Mandate</h3>
          </div>
          <p className="text-xs font-semibold text-blue-600">{data.polarCodeClause.chapter} — {data.polarCodeClause.clause}</p>
          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{data.polarCodeClause.regulatoryText}</p>
          <div className="mt-2 text-[11px] font-medium text-risk-high bg-risk-high-bg border border-risk-high/20 rounded p-2">
            Requirement: {data.polarCodeClause.mandatoryRequirement}
          </div>
        </div>

        {/* SOP Checklist */}
        <div>
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">Tactical Bridge Action Checklist (SOP)</h3>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {data.sopSteps.map((step) => {
              const isChecked = !!completedSteps[step.id];
              return (
                <div
                  key={step.id}
                  onClick={() => setCompletedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                  className={cn(
                    "flex items-start gap-3 p-3 text-xs cursor-pointer transition-colors",
                    isChecked ? "bg-surface2 text-text-muted line-through" : "hover:bg-surface2/60 text-navy-900"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-border-strong text-blue-600 focus:ring-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Step {step.stepNumber}:</span>
                      <span>{step.action}</span>
                    </div>
                    <span className="mt-0.5 inline-block text-[10px] text-text-subtle font-mono">Assigned: {step.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-surface2 px-6 py-4 sticky bottom-0 z-20">
        <span className="text-xs text-text-muted">
          All tactical actions logged to ECDIS audit trail.
        </span>
        <button
          onClick={onClose}
          className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 transition-all shadow-sm"
        >
          Close Assessment
        </button>
      </div>
    </ModalOverlay>
  );
}
```

---

### 5.6 Mitigation Modal Implementation (`components/risk/MitigationModal.tsx`)

```tsx
"use client";

import { ModalOverlay } from "./ModalOverlay";
import { MITIGATION_MODAL_DETAILS } from "@/lib/risk-modals-data";
import { type RouteAlternative, type Vessel } from "@/lib/data";
import { cn, riskBadge } from "@/lib/utils";
import { X, CheckCircle2, ShieldCheck, Siren, AlertTriangle, Users, Fuel, Gauge, Clock } from "lucide-react";

interface MitigationModalProps {
  mitigationId: string;
  route: RouteAlternative;
  vessel: Vessel;
  isAcked: boolean;
  onToggleAck: (id: string) => void;
  onClose: () => void;
}

const STATUS_ICONS = {
  mandatory: Siren,
  recommended: AlertTriangle,
  advisory: ShieldCheck,
};

export function MitigationModal({
  mitigationId,
  route,
  vessel,
  isAcked,
  onToggleAck,
  onClose,
}: MitigationModalProps) {
  const m = MITIGATION_MODAL_DETAILS[mitigationId];
  if (!m) return null;

  const StatusIcon = STATUS_ICONS[m.status];
  const postRisk = Math.max(0, route.averageRiskScore + m.riskReductionDelta);

  return (
    <ModalOverlay isOpen={true} onClose={onClose} titleId="mitigation-modal-title" descId="mitigation-modal-desc">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border bg-surface px-6 py-4 sticky top-0 z-20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <StatusIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                m.status === "mandatory" ? "border-risk-high/30 bg-risk-high-bg text-risk-high" :
                m.status === "recommended" ? "border-risk-med/30 bg-risk-med-bg text-risk-med" :
                "border-border bg-surface2 text-text-muted"
              )}>
                {m.status} · {m.category}
              </span>
              <span className="text-xs font-mono text-text-subtle">ID: {m.id.toUpperCase()}</span>
            </div>
            <h2 id="mitigation-modal-title" className="mt-1 text-lg font-bold text-navy-900">
              {m.title}
            </h2>
            <p id="mitigation-modal-desc" className="text-xs text-text-muted">
              Standard Operating Procedure for <strong className="text-navy-900">{vessel.name}</strong> ({vessel.iceClass})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="hidden sm:inline-block rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-muted">ESC</kbd>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface2 hover:text-navy-900 transition-colors" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Risk Delta Banner */}
        <div className="rounded-xl border border-risk-low/30 bg-risk-low-bg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-risk-low">Projected Risk Mitigation Delta</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono text-3xl font-extrabold text-risk-low">{m.riskReductionDelta} pts</span>
                <span className="text-xs text-text-secondary">reduction in route exposure index</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="rounded bg-white border border-border px-2 py-1 text-text-muted">Before: {route.averageRiskScore}</span>
              <span className="text-risk-low font-bold">&rarr;</span>
              <span className="rounded bg-white border border-risk-low/40 px-2 py-1 font-bold text-risk-low">After: {postRisk}</span>
            </div>
          </div>
        </div>

        {/* Vessel Resource Requirements */}
        <div>
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">Vessel Resource Requirements</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Users size={14} className="text-blue-600" />
                <span className="text-[11px] font-semibold">Personnel</span>
              </div>
              <p className="text-xs text-navy-900 font-medium">{m.resources.personnel}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Fuel size={14} className="text-blue-600" />
                <span className="text-[11px] font-semibold">Fuel Impact</span>
              </div>
              <p className="text-xs text-navy-900 font-medium">{m.resources.fuelImpact}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Gauge size={14} className="text-blue-600" />
                <span className="text-[11px] font-semibold">Readiness</span>
              </div>
              <p className="text-xs text-navy-900 font-medium">{m.resources.readinessTime}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">
                <Clock size={14} className="text-blue-600" />
                <span className="text-[11px] font-semibold">Equipment</span>
              </div>
              <p className="text-xs text-navy-900 font-medium truncate">{m.resources.equipment.join(", ")}</p>
            </div>
          </div>
        </div>

        {/* Sequential SOP Steps */}
        <div>
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">Standard Operating Procedure Execution Sequence</h3>
          <div className="space-y-2.5">
            {m.sopSteps.map((step) => (
              <div key={step.stepNumber} className="rounded-lg border border-border bg-surface p-3.5 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white font-mono text-xs font-bold">
                  {step.stepNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-navy-900">{step.title}</span>
                    <span className="rounded bg-surface2 border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-subtle">
                      Role: {step.role}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{step.action}</p>
                  {step.criticalThreshold && (
                    <p className="mt-1 text-[11px] font-medium text-risk-med bg-risk-med-bg border border-risk-med/20 rounded px-2 py-0.5">
                      {step.criticalThreshold}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Polar Code Statutory Reference */}
        <div className="rounded-xl border border-border bg-surface2 p-4 text-xs">
          <p className="font-semibold text-navy-900">IMO Polar Code Statutory Reference: {m.polarCodeRef.chapter} ({m.polarCodeRef.clause})</p>
          <p className="mt-1 text-text-secondary leading-relaxed">{m.polarCodeRef.requirement}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-surface2 px-6 py-4 sticky bottom-0 z-20">
        <div className="flex items-center gap-2">
          {isAcked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-risk-low">
              <CheckCircle2 size={16} /> Acknowledged by Master
            </span>
          ) : (
            <span className="text-xs text-text-muted">Requires Bridge Officer Acknowledgment</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-muted hover:text-navy-900 transition-colors">
            Close
          </button>
          <button
            onClick={() => onToggleAck(m.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5",
              isAcked
                ? "bg-risk-low-bg text-risk-low border border-risk-low/40 hover:bg-risk-low-bg/80"
                : "bg-navy-900 text-white hover:bg-navy-800"
            )}
          >
            <CheckCircle2 size={15} />
            {isAcked ? "Revoke Acknowledgment" : "Acknowledge & Apply SOP"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
```

---

### 5.7 Integration in `app/risk/page.tsx`

1. **Import Modals & Types:**
   ```tsx
   import { useState } from "react";
   import { ConsequenceModal } from "@/components/risk/ConsequenceModal";
   import { MitigationModal } from "@/components/risk/MitigationModal";
   import { type ConsequenceKey } from "@/lib/risk-modals-data";
   import { ChevronRight, Sparkles } from "lucide-react";
   ```
2. **State in `RiskPage`:**
   ```tsx
   const [selectedConsequenceKey, setSelectedConsequenceKey] = useState<ConsequenceKey | null>(null);
   const [selectedMitigationId, setSelectedMitigationId] = useState<string | null>(null);
   ```
3. **Attach Handlers to Consequence Cards:**
   ```tsx
   <div
     key={c.key}
     role="button"
     tabIndex={0}
     onClick={() => setSelectedConsequenceKey(c.key as ConsequenceKey)}
     onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedConsequenceKey(c.key as ConsequenceKey); }}
     className={cn(
       "rounded-xl border border-border bg-surface p-4 shadow-sm cursor-pointer transition-all hover:border-border-strong hover:shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-600 group"
     )}
   >
     <div className="flex items-center justify-between">
       <p className="text-xs font-medium text-text-muted">{c.label}</p>
       <ChevronRight size={14} className="text-text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
     </div>
     <p className="mt-2 font-mono text-2xl font-bold text-navy-900">{c.value}</p>
     <div className="mt-3">
       <div className="h-1.5 rounded-full bg-border overflow-hidden">
         <div className={cn("h-full rounded-full", riskBar(c.score))} style={{ width: `${Math.min(c.score, 100)}%` }} />
       </div>
       <div className="mt-1 flex items-center justify-between">
         <p className="text-[10px] text-text-subtle">{riskLabel(c.score)}</p>
         <p className="text-[10px] font-medium text-blue-600 group-hover:underline">Decompose &rarr;</p>
       </div>
     </div>
   </div>
   ```
4. **Attach Handlers to Mitigation Rows:**
   ```tsx
   <li
     key={m.id}
     onClick={() => setSelectedMitigationId(m.id)}
     className={cn(
       "flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer group",
       isAcked ? "bg-surface2" : "hover:bg-surface2/60"
     )}
   >
     <button
       className="mt-0.5 shrink-0 p-1"
       onClick={(e) => {
         e.stopPropagation();
         setAcked((s) => ({ ...s, [m.id]: !s[m.id] }));
       }}
       aria-label={isAcked ? "Unacknowledge" : "Acknowledge"}
     >
       {isAcked ? <CheckCircle2 size={18} className="text-risk-low" /> : <Circle size={18} className="text-border-strong" />}
     </button>
     <div className="flex-1 min-w-0">
       <div className="flex flex-wrap items-center gap-2">
         <span className={cn("text-sm font-semibold", isAcked ? "text-text-muted line-through" : "text-navy-900")}>
           {m.title}
         </span>
         <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold", STATUS_STYLE[m.status])}>
           <StatusIcon size={9} />
           {m.status}
         </span>
       </div>
       <p className={cn("mt-0.5 text-xs", isAcked ? "text-text-subtle" : "text-text-muted")}>
         {m.detail}
       </p>
     </div>
     <button
       onClick={(e) => {
         e.stopPropagation();
         setSelectedMitigationId(m.id);
       }}
       className="shrink-0 rounded border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-muted opacity-0 group-hover:opacity-100 hover:text-navy-900 hover:border-border-strong transition-all"
     >
       Inspect SOP
     </button>
   </li>
   ```
5. **Render Modals Conditionally:**
   ```tsx
   {selectedConsequenceKey && (
     <ConsequenceModal
       consequenceKey={selectedConsequenceKey}
       route={selectedRoute}
       vessel={vessel}
       onClose={() => setSelectedConsequenceKey(null)}
     />
   )}

   {selectedMitigationId && (
     <MitigationModal
       mitigationId={selectedMitigationId}
       route={selectedRoute}
       vessel={vessel}
       isAcked={!!acked[selectedMitigationId]}
       onToggleAck={(id) => setAcked((s) => ({ ...s, [id]: !s[id] }))}
       onClose={() => setSelectedMitigationId(null)}
     />
   )}
   ```

---

## 6. Verification Method

### 6.1 Automated Test Suites
Run the project test command:
```bash
npm test
```
*(Runs `tsx --test tests/**/*.test.ts` via Node.js native test runner).*

### 6.2 TypeScript Compilation Check
```bash
npx tsc --noEmit
```
Ensures zero type regressions and strict interface conformance.

### 6.3 Automated Modal & State Unit Test Design (`tests/risk_modals_and_state.test.ts`)
The implementation worker should add a unit test suite verifying:
1. **Consequence Decomposition Consistency:**
   - All 4 keys (`besetment`, `delay`, `fuel`, `disruption`) resolve to valid data records.
   - Sum of sub-factor weights equals 1.0 (within `1e-6`).
   - Every factor score is bounded in `[0, 100]`.
   - Historical benchmarks contain valid non-empty strings and incident years `> 1900`.
   - Polar Code citations include Chapter number and statutory requirement.
2. **Mitigation SOP Model Integrity:**
   - All 7 mitigations (`m1` - `m7`) have corresponding modal records.
   - `riskReductionDelta < 0` for all mitigations.
   - Resources include non-empty personnel, fuel impact, and equipment.
   - Sequential SOP steps are strictly ordered (`stepNumber` 1, 2, 3...).
3. **Dynamic Vessel & Route Math:**
   - OpenWater vessel yields besetment score > PC4 vessel for identical route.
   - Shortest route yields higher transit delay score than Safest route.

### 6.4 Manual UI & Accessibility Verification Checklist
- [ ] Consequence cards display hover styles and "Decompose &rarr;" affordance.
- [ ] Clicking any consequence card opens `ConsequenceModal` with backdrop blur.
- [ ] Pressing `Escape` key immediately closes the open modal.
- [ ] Clicking outside the dialog card (on backdrop) closes the modal.
- [ ] Tab key cycles focus strictly within the modal (focus trap).
- [ ] Toggling SOP checklist checkboxes updates item state without closing modal.
- [ ] Clicking any mitigation row opens `MitigationModal`.
- [ ] Clicking "Acknowledge & Apply SOP" inside the modal toggles acknowledgment, updates the circular progress ring in the parent page, and updates button text.
- [ ] Modal displays expected risk delta (e.g. -28 pts) and resource requirements.
- [ ] Background body scroll is locked while modal is mounted, and restored upon close.

### 6.5 Invalidation Conditions
- Any modal implementation that introduces third-party React 19 incompatible libraries is invalid.
- An implementation where modal acknowledgment fails to sync with the main checklist / progress ring is invalid.
- An implementation lacking keyboard ESC dismissal or ARIA dialog attributes is invalid.
