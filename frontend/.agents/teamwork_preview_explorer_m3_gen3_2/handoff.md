# Risk Filtering, Sorting & Export Explorer: Handoff Report

**Author:** `teamwork_preview_explorer_m3_gen3_2` (Risk Filtering & Export Explorer)  
**Parent Agent:** `49650037-4209-4e6a-af88-63e25a17dc99`  
**Working Directory:** `/home/dev/Desktop/projects/fb/frontend/.agents/teamwork_preview_explorer_m3_gen3_2`  
**Milestone:** Milestone 3 — Requirement R2: Risk Tab Functionality  
**Type:** Hard Handoff (Investigation & Architecture Complete)  
**Date:** 2026-09-18  

---

## 1. Observation

### 1.1 Direct Observations in Existing Source Files

1. **`app/risk/page.tsx` (Current State):**
   - *Lines 29-45:* Component reads `selectedRoute` and `vessel` from `useMission()`. Acknowledgment state is tracked via a local dictionary:
     ```typescript
     const [acked, setAcked] = useState<Record<string, boolean>>({});
     ```
   - *Lines 77-159:* Mitigation checklist renders all 7 items directly via `MITIGATIONS.map(...)` without any filtering, search bar, or sorting:
     ```typescript
     {MITIGATIONS.map((m) => {
       const StatusIcon = STATUS_ICON[m.status];
       const isAcked = !!acked[m.id];
       ...
     })}
     ```
   - *Lines 48-59:* Header contains only route name, vessel name, and average risk score badge. There are **zero export buttons** (no CSV, no JSON, and no Print trigger).
   - *Lines 10-20:* Hardcoded `STATUS_STYLE` and `STATUS_ICON` only support `"mandatory"`, `"recommended"`, and `"advisory"`. No support exists for execution statuses (`"Active"`, `"Implemented"`, `"Pending"`, `"Critical"`).

2. **`lib/data.ts` (Current Mitigation Model):**
   - *Lines 61-76:*
     ```typescript
     export interface Mitigation {
       id: string;
       title: string;
       status: "mandatory" | "recommended" | "advisory";
       detail: string;
     }

     export const MITIGATIONS: Mitigation[] = [
       { id: "m1", title: "Reduce speed in pack ice", status: "mandatory", detail: "Throttle to ice speed limit in zones over 6/10 concentration." },
       { id: "m2", title: "Maintain 5.0 NM iceberg standoff", status: "mandatory", detail: "Keep minimum stand-off distance from tracked bergs." },
       { id: "m3", title: "Daylight transit of chokepoints", status: "recommended", detail: "Plan strait crossings for daylight hours." },
       { id: "m4", title: "Extra lookout / ice watch", status: "recommended", detail: "Post additional lookout in reduced visibility." },
       { id: "m5", title: "Escort on standby for OpenWater hulls", status: "advisory", detail: "Required for OpenWater class in elevated risk." },
       { id: "m6", title: "Fuel reserve margin check", status: "recommended", detail: "Confirm bunker margin covers delay risk hours." },
       { id: "m7", title: "Contingency anchorage identified", status: "advisory", detail: "Pre-select sheltered holding position." },
     ];
     ```
   - The current `Mitigation` objects lack: `severity`, `riskScore`, `priority`, `costK`, `hazardDescription`, `sop`, `polarCodeRef`, `polarCodeImpact`, and `actionStatus`.

3. **`tests/data_and_utils.test.ts` (Strict Test Constraints on `MITIGATIONS`):**
   - *Lines 124-150:*
     ```typescript
     describe('MITIGATIONS Model', () => {
       it('should contain 7 actionable polar mitigations with valid statuses', () => {
         assert.strictEqual(MITIGATIONS.length, 7);
         const validStatuses = ['mandatory', 'recommended', 'advisory'];
         const ids = new Set<string>();

         for (const m of MITIGATIONS) {
           assert.ok(m.id && typeof m.id === 'string');
           assert.ok(m.title && typeof m.title === 'string');
           assert.ok(m.detail && typeof m.detail === 'string');
           assert.ok(validStatuses.includes(m.status), `Invalid mitigation status: ${m.status}`);
           ...
         }
       });

       it('should include critical iceberg standoff and speed throttle mitigations', () => {
         const speedMitigation = MITIGATIONS.find(m => m.id === 'm1');
         assert.ok(speedMitigation);
         assert.strictEqual(speedMitigation.status, 'mandatory');

         const standoffMitigation = MITIGATIONS.find(m => m.id === 'm2');
         assert.ok(standoffMitigation);
         assert.strictEqual(standoffMitigation.status, 'mandatory');
       });
     });
     ```
   - **Crucial Invariant:** `MITIGATIONS.length` must remain exactly 7, and `m.status` must remain `"mandatory" | "recommended" | "advisory"`. Any extension of data fields must be additive and backward-compatible.

4. **Print Styles in `app/globals.css` and Navigation in `components/layout/AppShell.tsx`:**
   - *`app/globals.css:80-84`:*
     ```css
     /* ─── Print ─── */
     @media print {
       .no-print { display: none !important; }
       body { background: white; }
     }
     ```
   - *`components/layout/AppShell.tsx:17-40`:* The `<aside>` sidebar and `<header>` topbar lack `.no-print` classes. Unless `.no-print` or explicit `@media print` rules suppress `<aside>`, `<header>`, and action buttons, the sidebar and header will leak into the printed document.

---

## 2. Logic Chain

1. **Requirement R2 mandates:**
   - Advanced Filtering:
     - Severity chips (`All`, `CRITICAL`, `HIGH`, `MODERATE`, `LOW`) with dynamic matching counts.
     - Action Status filters (`Active`, `Implemented`, `Pending`, `Critical`).
     - Acknowledgment state filters (`All`, `Acknowledged`, `Action Required`).
     - Text search querying risk titles, hazard descriptions, mitigation SOPs, and Polar Code references.
   - Multi-Field Sorting:
     - Sort by Risk Score (Desc/Asc), Priority, Cost ($K), and Polar Code Impact.
   - Telemetry & Data Export:
     - CSV export: RFC 4180 compliant, quotes escaped, timestamped `polar-risk-telemetry-YYYYMMDD.csv`.
     - JSON export: 2-space pretty printed, full metadata schema, timestamped `polar-risk-telemetry-YYYYMMDD.json`.
     - Print export: `window.print()` trigger with print stylesheet suppressing navigation and cleanly formatting risk matrices.

2. **Connecting Requirements to Data Structures:**
   - From Observation 1.3, `MITIGATIONS` cannot break existing properties (`status: "mandatory" | "recommended" | "advisory"`).
   - Therefore, we enrich `MITIGATIONS` in `lib/data.ts` additively:
     - `severity`: `"CRITICAL" | "HIGH" | "MODERATE" | "LOW"`
     - `actionStatus`: `"Active" | "Implemented" | "Pending" | "Critical"`
     - `riskScore`: number (e.g., 32 to 92)
     - `priority`: number (1 = P1 Critical to 4 = P4 Advisory)
     - `costK`: number (estimated cost in thousands of dollars, e.g. 4 to 85)
     - `hazardDescription`: string
     - `sop`: string (standard operating procedure ID and instructions)
     - `polarCodeRef`: string (e.g. "IMO Polar Code Part I-A §6.3")
     - `polarCodeImpact`: `"CRITICAL" | "HIGH" | "MODERATE" | "LOW"`

3. **Dynamic Operational Status Transition:**
   - In maritime ice operations, when the Master or Ice Pilot acknowledges a mitigation measure, its status transitions from `"Active"` / `"Pending"` / `"Critical"` to `"Implemented"`.
   - We define:
     ```typescript
     export function getEffectiveActionStatus(
       item: Mitigation,
       isAcked: boolean
     ): MitigationActionStatus {
       if (isAcked) return "Implemented";
       return item.actionStatus;
     }
     ```
   - When filtering by `"Implemented"`, the UI dynamically lists all acknowledged items. When filtering by `"Critical"`, it surfaces unacknowledged mandatory safety actions.

4. **RFC 4180 CSV Escaping Rules:**
   - Per RFC 4180:
     - Fields containing commas (`,`), line breaks (`\n`, `\r`), or double quotes (`"`) MUST be enclosed in double quotes.
     - Any double quote (`"`) inside a field MUST be escaped by prefixing it with another double quote (`""`).
     - Line separator must be CRLF (`\r\n`).
   - Pure generator function `formatRFC4180CsvField` ensures strict compliance.

5. **JSON Schema & Print Export:**
   - JSON export encapsulates full session context: system metadata, ISO UTC timestamp, vessel attributes, route metrics, consequence decomposition, summary KPIs (total mitigations, acknowledged count, compliance percentage, total cost $K), and the enriched mitigations array.
   - Print export requires updating `app/globals.css` with comprehensive `@media print` rules suppressing `aside`, `header`, `.no-print`, and applying clean table borders, zero margins, and `break-inside: avoid`.

---

## 3. Caveats

1. **Read-Only Explorer Role:** This agent does not directly modify source files. All TypeScript code, utility modules, and unit test suites are fully drafted in this report and ready for the implementer worker.
2. **Component Separation:** Explorer 1 owns `components/risk/RiskCharts.tsx` (SVG charts), and Explorer 3 owns `components/risk/ConsequenceModal.tsx` and `components/risk/MitigationModal.tsx`. The filter bar, sorting toolbar, export dropdown, and enriched table can live in `components/risk/RiskTelemetryPanel.tsx` (or directly in `app/risk/page.tsx`), with export utilities in `lib/riskExport.ts`.
3. **Sandbox Command Environment:** The test runner `npm test` runs with `tsx --test tests/**/*.test.ts`. Unit tests for filtering and export logic should be placed in a dedicated file `tests/risk_filtering_and_export.test.ts` that imports pure TypeScript functions without requiring browser DOM APIs in Node.

---

## 4. Conclusion

- The current `app/risk/page.tsx` is an empty shell with static rendering, zero filters, zero sorting, and zero export handlers.
- By enriching `lib/data.ts` additively, we preserve 100% backward compatibility with all existing test suites while enabling multi-field sorting, dynamic counts, full-text search, and dual-status filtering.
- Telemetry export via RFC 4180 CSV, formatted JSON, and `@media print` PDF readiness elevates the Fordge-Burg platform to a high-grade maritime tactical decision tool.

---

## 5. Verification Method

1. **Automated Unit Tests:**
   Run the project test suite:
   ```bash
   npm test
   ```
   Verify that `tests/risk_filtering_and_export.test.ts` executes and passes alongside existing test suites (`tests/data_and_utils.test.ts`, `tests/adversarial_challenge.test.ts`, `tests/mission_planner_interactive.test.ts`).

2. **TypeScript Compilation:**
   ```bash
   npx tsc --noEmit
   ```
   Verify zero type errors across `lib/data.ts`, `lib/riskExport.ts`, `components/risk/*`, and `app/risk/page.tsx`.

3. **Production Build:**
   ```bash
   npm run build
   ```

4. **UI & Export Functional Verification:**
   - **Filter Chips:** Click `CRITICAL` chip -> verify only 3 critical items appear; verify counter shows `(3)`.
   - **Status Filter:** Click `Critical` -> verify only unacknowledged critical items appear. Check one item -> verify it disappears from `Critical` and appears under `Implemented`.
   - **Search Input:** Type `"pack ice"` or `"§6.3"` -> verify list updates instantly.
   - **Multi-Field Sorting:**
     - Select "Risk Score (High to Low)" -> `m2` (92) is first, `m7` (32) is last.
     - Select "Cost ($K) (High to Low)" -> `m5` ($85K) is first.
     - Select "Polar Code Impact" -> CRITICAL impact items precede HIGH, MODERATE, LOW.
   - **CSV Export:** Click "Export CSV" -> browser downloads `polar-risk-telemetry-YYYYMMDD.csv`. Verify file headers and RFC 4180 quotes in text editor.
   - **JSON Export:** Click "Export JSON" -> browser downloads `polar-risk-telemetry-YYYYMMDD.json`. Verify valid JSON format, 2-space indentation, and metadata schema.
   - **Print Export:** Click "Print Report" -> browser print dialog opens; verify sidebar, topbar, and filter controls are completely hidden; verify cleanly formatted table with black text on white background.

---

## 6. Proposed Implementation Plan & Code Specifications

### 6.1 Data Model Extensions (`lib/data.ts`)

Add the following types and enrich the `MITIGATIONS` array in `lib/data.ts`:

```typescript
export type MitigationSeverity = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
export type MitigationActionStatus = "Active" | "Implemented" | "Pending" | "Critical";
export type PolarCodeImpact = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface Mitigation {
  id: string;
  title: string;
  status: "mandatory" | "recommended" | "advisory";
  detail: string;
  // Extended fields for Milestone 3 R2
  severity: MitigationSeverity;
  actionStatus: MitigationActionStatus;
  riskScore: number;          // 0-100
  priority: number;           // 1 (Critical/P1) to 4 (Advisory/P4)
  costK: number;              // Cost in thousands of USD ($K)
  hazardDescription: string;  // Associated Antarctic hazard
  sop: string;                // Standard Operating Procedure code and instruction
  polarCodeRef: string;       // IMO Polar Code regulatory clause
  polarCodeImpact: PolarCodeImpact;
}

export const MITIGATIONS: Mitigation[] = [
  {
    id: "m1",
    title: "Reduce speed in pack ice",
    status: "mandatory",
    detail: "Throttle to ice speed limit in zones over 6/10 concentration.",
    severity: "CRITICAL",
    actionStatus: "Critical",
    riskScore: 88,
    priority: 1,
    costK: 12,
    hazardDescription: "Multi-year floe pack ice compression and structural hull impact risk in chokepoints",
    sop: "SOP-ICE-04: Throttle governed to 6.0 kn in ice concentration > 6/10; dual rudder pumps active",
    polarCodeRef: "IMO Polar Code Part I-A §6.3 Machinery Installations in Ice",
    polarCodeImpact: "CRITICAL",
  },
  {
    id: "m2",
    title: "Maintain 5.0 NM iceberg standoff",
    status: "mandatory",
    detail: "Keep minimum stand-off distance from tracked bergs.",
    severity: "CRITICAL",
    actionStatus: "Critical",
    riskScore: 92,
    priority: 1,
    costK: 18,
    hazardDescription: "Underwater iceberg ram projection and drift trajectory collision envelope",
    sop: "SOP-NV-108: Radar guard zone at 6.0 NM; thermal IR scanning active; 5.0 NM standoff CPA",
    polarCodeRef: "IMO Polar Code Part I-A §11.3 Navigational Equipment",
    polarCodeImpact: "CRITICAL",
  },
  {
    id: "m3",
    title: "Daylight transit of chokepoints",
    status: "recommended",
    detail: "Plan strait crossings for daylight hours.",
    severity: "HIGH",
    actionStatus: "Active",
    riskScore: 68,
    priority: 2,
    costK: 24,
    hazardDescription: "Active Pass chokepoint bergy water transit with low visual optical detection",
    sop: "SOP-NV-202: Coordinate passage with nautical twilight; delay entry if visibility < 2 NM",
    polarCodeRef: "IMO Polar Code Part I-A §11.2 Watchkeeping & Route Planning",
    polarCodeImpact: "HIGH",
  },
  {
    id: "m4",
    title: "Extra lookout / ice watch",
    status: "recommended",
    detail: "Post additional lookout in reduced visibility.",
    severity: "HIGH",
    actionStatus: "Active",
    riskScore: 62,
    priority: 2,
    costK: 6,
    hazardDescription: "Growler and bergy bit radar blind zones in rough Antarctic sea states",
    sop: "SOP-CR-301: Dedicated forward bridge ice observer rotation on 2-hour cycles with high-intensity spotlights",
    polarCodeRef: "IMO Polar Code Part I-A §12.3 Crewing and Operational Training",
    polarCodeImpact: "HIGH",
  },
  {
    id: "m5",
    title: "Escort on standby for OpenWater hulls",
    status: "advisory",
    detail: "Required for OpenWater class in elevated risk.",
    severity: "CRITICAL",
    actionStatus: "Pending",
    riskScore: 85,
    priority: 1,
    costK: 85,
    hazardDescription: "Besetment or hull puncture risk for non-ice-strengthened hull in fast ice margin",
    sop: "SOP-ESC-505: Radio check-in with polar escort vessel on VHF Ch 16; establish 1.5 NM convoy spacing",
    polarCodeRef: "IMO Polar Code Part I-A §3.2 Hull Structure & Escort Protocols",
    polarCodeImpact: "CRITICAL",
  },
  {
    id: "m6",
    title: "Fuel reserve margin check",
    status: "recommended",
    detail: "Confirm bunker margin covers delay risk hours.",
    severity: "MODERATE",
    actionStatus: "Active",
    riskScore: 48,
    priority: 3,
    costK: 15,
    hazardDescription: "Ice drift induced transit delay resulting in premature fuel exhaustion",
    sop: "SOP-ENG-112: Confirm minimum 25% MGO reserve above nominal voyage consumption plan",
    polarCodeRef: "IMO Polar Code Part I-A §8.3 Reserve Fuel & Life-Saving Appliances",
    polarCodeImpact: "MODERATE",
  },
  {
    id: "m7",
    title: "Contingency anchorage identified",
    status: "advisory",
    detail: "Pre-select sheltered holding position.",
    severity: "LOW",
    actionStatus: "Pending",
    riskScore: 32,
    priority: 4,
    costK: 4,
    hazardDescription: "Katabatic gale wind event forcing emergency sheltering in uncharted bay",
    sop: "SOP-ANC-401: Pre-chart Maxwell Sound and Admiralty Bay emergency holding spots with > 25m sounding clearance",
    polarCodeRef: "IMO Polar Code Part I-B §4.1 Safe Anchorage Guidance",
    polarCodeImpact: "LOW",
  },
];
```

---

### 6.2 Filter & Export Utility Module (`lib/riskExport.ts`)

Create `lib/riskExport.ts` containing pure, reusable filtering, sorting, and export generation functions:

```typescript
import { Mitigation, MitigationSeverity, MitigationActionStatus, PolarCodeImpact } from "./data";

export type SeverityFilter = "ALL" | MitigationSeverity;
export type ActionStatusFilter = "ALL" | MitigationActionStatus;
export type AckStateFilter = "ALL" | "ACKNOWLEDGED" | "ACTION_REQUIRED";
export type SortField = "riskScore" | "priority" | "costK" | "polarCodeImpact" | "title";
export type SortDirection = "asc" | "desc";

export interface FilterSortOptions {
  severity: SeverityFilter;
  status: ActionStatusFilter;
  ackState: AckStateFilter;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export function getEffectiveActionStatus(
  item: Mitigation,
  isAcked: boolean
): MitigationActionStatus {
  if (isAcked) return "Implemented";
  return item.actionStatus;
}

export function filterAndSortMitigations(
  items: Mitigation[],
  acked: Record<string, boolean>,
  options: FilterSortOptions
): Mitigation[] {
  const query = options.searchQuery.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const isAcked = !!acked[item.id];
    const effectiveStatus = getEffectiveActionStatus(item, isAcked);

    // 1. Severity filter
    if (options.severity !== "ALL" && item.severity !== options.severity) {
      return false;
    }

    // 2. Status filter
    if (options.status !== "ALL" && effectiveStatus !== options.status) {
      return false;
    }

    // 3. Acknowledgment filter
    if (options.ackState === "ACKNOWLEDGED" && !isAcked) {
      return false;
    }
    if (options.ackState === "ACTION_REQUIRED" && isAcked) {
      return false;
    }

    // 4. Text search
    if (query) {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchDetail = item.detail.toLowerCase().includes(query);
      const matchHazard = (item.hazardDescription || "").toLowerCase().includes(query);
      const matchSop = (item.sop || "").toLowerCase().includes(query);
      const matchPolar = (item.polarCodeRef || "").toLowerCase().includes(query);

      if (!matchTitle && !matchDetail && !matchHazard && !matchSop && !matchPolar) {
        return false;
      }
    }

    return true;
  });

  const IMPACT_WEIGHT: Record<PolarCodeImpact, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MODERATE: 2,
    LOW: 1,
  };

  return filtered.sort((a, b) => {
    let cmp = 0;
    switch (options.sortField) {
      case "riskScore":
        cmp = a.riskScore - b.riskScore;
        break;
      case "priority":
        cmp = a.priority - b.priority;
        break;
      case "costK":
        cmp = a.costK - b.costK;
        break;
      case "polarCodeImpact":
        cmp = (IMPACT_WEIGHT[a.polarCodeImpact] || 0) - (IMPACT_WEIGHT[b.polarCodeImpact] || 0);
        break;
      case "title":
        cmp = a.title.localeCompare(b.title);
        break;
    }
    return options.sortDirection === "desc" ? -cmp : cmp;
  });
}

export function computeSeverityCounts(
  items: Mitigation[]
): Record<SeverityFilter, number> {
  const counts: Record<SeverityFilter, number> = {
    ALL: items.length,
    CRITICAL: 0,
    HIGH: 0,
    MODERATE: 0,
    LOW: 0,
  };

  for (const item of items) {
    if (counts[item.severity] !== undefined) {
      counts[item.severity]++;
    }
  }

  return counts;
}

// ─── RFC 4180 CSV Generator ───────────────────────────────────────────────

export function formatRFC4180CsvField(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface ExportContext {
  routeName: string;
  vesselName: string;
  vesselIceClass: string;
}

export function generateRiskTelemetryCsv(
  items: Mitigation[],
  acked: Record<string, boolean>,
  context: ExportContext
): string {
  const headers = [
    "Item ID",
    "Title",
    "Regulatory Tier",
    "Action Status",
    "Severity",
    "Risk Score",
    "Priority",
    "Cost ($K)",
    "Acknowledged",
    "Polar Code Reference",
    "Polar Code Impact",
    "Standard Operating Procedure (SOP)",
    "Hazard Scenario Description",
    "Operational Detail",
    "Selected Route",
    "Vessel Name",
    "Ice Class",
    "Export Timestamp UTC",
  ];

  const now = new Date().toISOString();
  const rows = items.map((m) => {
    const isAcked = !!acked[m.id];
    const effectiveStatus = getEffectiveActionStatus(m, isAcked);
    return [
      m.id,
      m.title,
      m.status,
      effectiveStatus,
      m.severity,
      m.riskScore,
      `P${m.priority}`,
      m.costK,
      isAcked ? "YES" : "NO",
      m.polarCodeRef,
      m.polarCodeImpact,
      m.sop,
      m.hazardDescription,
      m.detail,
      context.routeName,
      context.vesselName,
      context.vesselIceClass,
      now,
    ].map(formatRFC4180CsvField).join(",");
  });

  return [headers.map(formatRFC4180CsvField).join(","), ...rows].join("\r\n");
}

// ─── Formatted JSON Generator ─────────────────────────────────────────────

export interface RiskTelemetryJsonMetadata {
  vessel: {
    name: string;
    iceClass: string;
    loaM?: number;
    beamM?: number;
    draftM?: number;
    iceLimitKn?: number;
  };
  route: {
    name: string;
    distanceNm: number;
    etaHours: number;
    fuelTons: number;
    averageRiskScore: number;
    maxRiskScore: number;
  };
  consequences: {
    key: string;
    label: string;
    score: number;
    value: string;
  }[];
}

export function generateRiskTelemetryJson(
  items: Mitigation[],
  acked: Record<string, boolean>,
  metadata: RiskTelemetryJsonMetadata
): string {
  const ackedCount = Object.values(acked).filter(Boolean).length;
  const criticalUnacked = items.filter(
    (m) => m.severity === "CRITICAL" && !acked[m.id]
  ).length;
  const totalCostK = items.reduce((acc, m) => acc + m.costK, 0);

  const payload = {
    $schema: "https://fordgeburg.antarctic.maritime/schemas/risk-telemetry-v1.json",
    system: "fordgeBurg Antarctic Maritime Decision Support System",
    exportTimestamp: new Date().toISOString(),
    classification: "ADVISORY - NOT FOR AUTONOMOUS NAVIGATION",
    vessel: metadata.vessel,
    route: metadata.route,
    consequences: metadata.consequences,
    telemetrySummary: {
      totalMitigations: items.length,
      acknowledgedCount: ackedCount,
      compliancePercentage: Number(((ackedCount / items.length) * 100).toFixed(1)),
      criticalUnacknowledged: criticalUnacked,
      totalMitigationCostK: totalCostK,
    },
    mitigations: items.map((m) => {
      const isAcked = !!acked[m.id];
      return {
        id: m.id,
        title: m.title,
        regulatoryTier: m.status,
        actionStatus: getEffectiveActionStatus(m, isAcked),
        severity: m.severity,
        riskScore: m.riskScore,
        priority: `P${m.priority}`,
        costK: m.costK,
        isAcknowledged: isAcked,
        polarCodeRef: m.polarCodeRef,
        polarCodeImpact: m.polarCodeImpact,
        sop: m.sop,
        hazardDescription: m.hazardDescription,
        detail: m.detail,
      };
    }),
  };

  return JSON.stringify(payload, null, 2);
}

// ─── Filename & Download Helpers ──────────────────────────────────────────

export function getExportFilename(extension: "csv" | "json"): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `polar-risk-telemetry-${yyyy}${mm}${dd}.${extension}`;
}

export function triggerBlobDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

### 6.3 CSS Styling Rules for Print Export (`app/globals.css`)

Update the print block in `app/globals.css`:

```css
/* ─── Print ─── */
@media print {
  .no-print,
  aside,
  header,
  nav,
  button:not(.print-keep) {
    display: none !important;
  }

  body {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 10.5pt !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  main {
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .print-only {
    display: block !important;
  }

  .print-avoid-break {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #94a3b8 !important;
    padding: 6px 8px !important;
    color: #000000 !important;
  }
}
```

---

### 6.4 Risk Page UI Integration (`app/risk/page.tsx`)

The updated `RiskPage` integrates the filter bar, export actions, and print layout:

```tsx
"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MITIGATIONS, type Mitigation } from "@/lib/data";
import { useMission } from "@/components/session/MissionContext";
import { cn, riskBadge, riskBar, riskLabel } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShieldCheck,
  Siren,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode2,
  Search,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  filterAndSortMitigations,
  computeSeverityCounts,
  generateRiskTelemetryCsv,
  generateRiskTelemetryJson,
  getExportFilename,
  triggerBlobDownload,
  type SeverityFilter,
  type ActionStatusFilter,
  type AckStateFilter,
  type SortField,
  type SortDirection,
} from "@/lib/riskExport";

const SEVERITY_CHIP_STYLE: Record<SeverityFilter, string> = {
  ALL: "border-border text-navy-900",
  CRITICAL: "border-risk-high/30 bg-risk-high-bg text-risk-high",
  HIGH: "border-orange-300 bg-orange-50 text-orange-800",
  MODERATE: "border-risk-med/30 bg-risk-med-bg text-risk-med",
  LOW: "border-risk-low/30 bg-risk-low-bg text-risk-low",
};

export default function RiskPage() {
  const { selectedRoute, vessel } = useMission();
  const [acked, setAcked] = useState<Record<string, boolean>>({});

  // Filter & Sort State
  const [severity, setSeverity] = useState<SeverityFilter>("ALL");
  const [status, setStatus] = useState<ActionStatusFilter>("ALL");
  const [ackState, setAckState] = useState<AckStateFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const risk = selectedRoute.averageRiskScore;
  const isOpenWater = vessel.iceClass === "OpenWater";

  const consequences = useMemo(() => [
    { key: "besetment", label: "Besetment Risk", score: isOpenWater ? 75 : 35, value: isOpenWater ? "High" : "Moderate" },
    { key: "delay", label: "Transit Delay Risk", score: Math.round(risk / 10) * 10, value: `${Math.round(risk / 10)} hrs` },
    { key: "fuel", label: "Fuel Penalty", score: Math.round(risk / 5) * 5, value: `${Math.round(risk / 5)}%` },
    { key: "disruption", label: "Route Disruption", score: risk > 50 ? 70 : 30, value: risk > 50 ? "High" : "Low" },
  ], [risk, isOpenWater]);

  // Dynamic counts
  const severityCounts = useMemo(() => computeSeverityCounts(MITIGATIONS), []);

  // Filtered and sorted mitigations
  const processedMitigations = useMemo(() => {
    return filterAndSortMitigations(MITIGATIONS, acked, {
      severity,
      status,
      ackState,
      searchQuery,
      sortField,
      sortDirection,
    });
  }, [acked, severity, status, ackState, searchQuery, sortField, sortDirection]);

  const ackedCount = Object.values(acked).filter(Boolean).length;
  const allAcked = ackedCount === MITIGATIONS.length;

  // Export handlers
  const handleExportCsv = () => {
    const csv = generateRiskTelemetryCsv(MITIGATIONS, acked, {
      routeName: selectedRoute.name,
      vesselName: vessel.name,
      vesselIceClass: vessel.iceClass,
    });
    triggerBlobDownload(csv, getExportFilename("csv"), "text/csv;charset=utf-8;");
  };

  const handleExportJson = () => {
    const json = generateRiskTelemetryJson(MITIGATIONS, acked, {
      vessel: {
        name: vessel.name,
        iceClass: vessel.iceClass,
        loaM: vessel.loaM,
        beamM: vessel.beamM,
        draftM: vessel.draftM,
        iceLimitKn: vessel.iceLimitKn,
      },
      route: {
        name: selectedRoute.name,
        distanceNm: selectedRoute.distanceNm,
        etaHours: selectedRoute.etaHours,
        fuelTons: selectedRoute.fuelTons,
        averageRiskScore: selectedRoute.averageRiskScore,
        maxRiskScore: selectedRoute.maxRiskScore,
      },
      consequences,
    });
    triggerBlobDownload(json, getExportFilename("json"), "application/json;charset=utf-8;");
  };

  const handleResetFilters = () => {
    setSeverity("ALL");
    setStatus("ALL");
    setAckState("ALL");
    setSearchQuery("");
    setSortField("riskScore");
    setSortDirection("desc");
  };

  return (
    <AppShell>
      {/* ─── Header & Telemetry Export Action Bar ─── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Risk &amp; Mitigation</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Tactical risk controls for <strong className="text-navy-900">{selectedRoute.name}</strong> · Vessel: {vessel.name} ({vessel.iceClass})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm hover:bg-surface2 transition-colors"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm hover:bg-surface2 transition-colors"
          >
            <FileCode2 size={14} className="text-blue-600" />
            Export JSON
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-800 transition-colors"
          >
            <Printer size={14} />
            Print Report
          </button>
          <span className={cn("rounded-lg border px-3 py-1.5 font-mono text-xs font-bold", riskBadge(risk))}>
            Avg risk {risk}/100
          </span>
        </div>
      </div>

      {/* ─── Consequence Metric Cards ─── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 print-avoid-break">
        {consequences.map((c) => (
          <div key={c.key} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
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

      {/* ─── Advanced Filtering & Multi-Field Sorting Toolbar ─── */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3 no-print">
        {/* Row 1: Search & Sorting */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search risks, hazards, SOPs, Polar Code clauses (e.g. 'pack ice', 'SOP-ICE', '§6.3')..."
              className="w-full rounded-lg border border-border bg-surface2 pl-9 pr-8 py-2 text-xs text-navy-900 placeholder:text-text-subtle focus:border-blue-600 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-navy-900 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-text-muted flex items-center gap-1">
              <SlidersHorizontal size={13} /> Sort:
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-lg border border-border bg-surface2 px-2.5 py-1.5 text-xs text-navy-900 font-medium focus:outline-none"
            >
              <option value="riskScore">Risk Score</option>
              <option value="priority">Priority Rank</option>
              <option value="costK">Cost ($K)</option>
              <option value="polarCodeImpact">Polar Code Impact</option>
              <option value="title">Alphabetical Title</option>
            </select>
            <button
              onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface2 px-2.5 py-1.5 text-xs font-semibold text-navy-900 hover:bg-border/40"
              title={`Sort ${sortDirection === "asc" ? "Descending" : "Ascending"}`}
            >
              <ArrowUpDown size={12} />
              {sortDirection === "desc" ? "Desc" : "Asc"}
            </button>
            <button
              onClick={handleResetFilters}
              className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-border/40"
              title="Reset all filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Row 2: Severity Level Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <span className="text-xs font-semibold text-text-muted shrink-0 mr-1">Severity:</span>
          {(["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"] as SeverityFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
                severity === s
                  ? "bg-navy-900 text-white border-navy-900 shadow-sm"
                  : cn("bg-surface hover:bg-surface2", SEVERITY_CHIP_STYLE[s])
              )}
            >
              {s} <span className="opacity-75 font-mono">({severityCounts[s]})</span>
            </button>
          ))}
        </div>

        {/* Row 3: Action Status & Acknowledgment Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-text-muted shrink-0">Status:</span>
            {(["ALL", "Active", "Implemented", "Pending", "Critical"] as ActionStatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                  status === st
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "bg-surface2 text-text-muted hover:bg-border/50"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Acknowledgment state */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-muted shrink-0">Ack State:</span>
            <div className="inline-flex rounded-lg border border-border bg-surface2 p-0.5">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "ACTION_REQUIRED", label: "Action Required" },
                  { id: "ACKNOWLEDGED", label: "Acknowledged" },
                ] as { id: AckStateFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAckState(tab.id)}
                  className={cn(
                    "rounded-md px-2.5 py-0.5 text-xs font-medium transition-all",
                    ackState === tab.id
                      ? "bg-white text-navy-900 font-semibold shadow-xs"
                      : "text-text-muted hover:text-navy-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mitigation Checklist Panel ─── */}
      <div className="mt-4 rounded-xl border border-border bg-surface shadow-sm overflow-hidden print-avoid-break">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Tactical Mitigations</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Showing {processedMitigations.length} of {MITIGATIONS.length} tactical measures · {ackedCount}/{MITIGATIONS.length} acknowledged
            </p>
          </div>
          <div className="flex items-center gap-3 no-print">
            {/* SVG Progress Ring */}
            <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={allAcked ? "var(--color-risk-low)" : "var(--color-blue-600)"}
                strokeWidth="3"
                strokeDasharray={`${(ackedCount / MITIGATIONS.length) * 94.2} 94.2`}
                className="transition-all duration-300"
              />
            </svg>
            <button
              onClick={() =>
                setAcked(allAcked ? {} : Object.fromEntries(MITIGATIONS.map((m) => [m.id, true])))
              }
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                allAcked
                  ? "bg-risk-low-bg text-risk-low border border-risk-low/30 hover:bg-risk-low-bg/80"
                  : "bg-navy-900 text-white hover:bg-navy-800"
              )}
            >
              {allAcked ? "Reset acknowledgments" : "Acknowledge all"}
            </button>
          </div>
        </div>

        {/* List of Mitigations */}
        {processedMitigations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-navy-900">No mitigations match active criteria</p>
            <p className="mt-1 text-xs text-text-muted">Try resetting search or loosening severity filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-3 rounded-lg border border-border bg-surface2 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-border/60"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {processedMitigations.map((m) => {
              const isAcked = !!acked[m.id];
              return (
                <li
                  key={m.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition-colors",
                    isAcked ? "bg-surface2/80" : "hover:bg-surface2/50"
                  )}
                >
                  <button
                    className="mt-0.5 shrink-0 no-print"
                    onClick={() => setAcked((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    aria-label={isAcked ? "Unacknowledge" : "Acknowledge"}
                  >
                    {isAcked ? (
                      <CheckCircle2 size={18} className="text-risk-low" />
                    ) : (
                      <Circle size={18} className="text-border-strong hover:text-navy-900" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isAcked ? "text-text-muted line-through" : "text-navy-900"
                        )}
                      >
                        {m.title}
                      </span>

                      {/* Severity Chip */}
                      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold", SEVERITY_CHIP_STYLE[m.severity])}>
                        {m.severity}
                      </span>

                      {/* Action Status Badge */}
                      <span className="rounded bg-surface2 border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                        Status: {isAcked ? "Implemented" : m.actionStatus}
                      </span>

                      {/* Polar Code Reference Badge */}
                      <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-mono text-blue-700">
                        {m.polarCodeRef}
                      </span>

                      {/* Cost */}
                      <span className="text-[11px] font-mono font-semibold text-text-muted ml-auto">
                        Est: ${m.costK}K
                      </span>

                      {/* Risk Score */}
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-mono font-bold", riskBadge(m.riskScore))}>
                        Risk: {m.riskScore}/100
                      </span>
                    </div>

                    <p className={cn("mt-1 text-xs", isAcked ? "text-text-subtle" : "text-text-muted")}>
                      {m.detail}
                    </p>

                    {/* Hazard & SOP metadata row */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-subtle">
                      <span><strong>Hazard:</strong> {m.hazardDescription}</span>
                      <span>·</span>
                      <span><strong>SOP:</strong> {m.sop}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ─── Printable Dedicated Audit Document Footer (Visible in Print) ─── */}
      <div className="mt-6 rounded-xl border border-border bg-surface2 px-4 py-3 print-avoid-break">
        <p className="text-xs text-text-subtle">
          <strong className="text-text-muted">Advisory only.</strong> The Master and Ice Pilot retain sole command authority under SOLAS Chapter V and the IMO Polar Code. These mitigations represent automated algorithmic decision support and do not substitute for certified professional ice navigation judgment.
        </p>
      </div>
    </AppShell>
  );
}
```

---

### 6.5 Comprehensive Unit Test Suite (`tests/risk_filtering_and_export.test.ts`)

Create `tests/risk_filtering_and_export.test.ts` to execute under `npm test` (`tsx --test`):

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MITIGATIONS, type Mitigation } from "../lib/data";
import {
  filterAndSortMitigations,
  computeSeverityCounts,
  formatRFC4180CsvField,
  generateRiskTelemetryCsv,
  generateRiskTelemetryJson,
  getExportFilename,
  getEffectiveActionStatus,
  type FilterSortOptions,
} from "../lib/riskExport";

describe("Milestone 3 R2: Risk Filtering, Sorting & Telemetry Export Verification", () => {
  const defaultOptions: FilterSortOptions = {
    severity: "ALL",
    status: "ALL",
    ackState: "ALL",
    searchQuery: "",
    sortField: "riskScore",
    sortDirection: "desc",
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Data Schema & Baseline Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("1. Enriched Mitigation Data Schema", () => {
    it("preserves exactly 7 mitigations with backward-compatible base statuses", () => {
      assert.strictEqual(MITIGATIONS.length, 7);
      const validBaseStatuses = ["mandatory", "recommended", "advisory"];
      for (const m of MITIGATIONS) {
        assert.ok(validBaseStatuses.includes(m.status));
        assert.ok(m.title && m.title.length > 0);
        assert.ok(m.detail && m.detail.length > 0);
      }
    });

    it("verifies all enriched fields are present and typed correctly", () => {
      const validSeverities = ["CRITICAL", "HIGH", "MODERATE", "LOW"];
      const validActionStatuses = ["Active", "Implemented", "Pending", "Critical"];

      for (const m of MITIGATIONS) {
        assert.ok(validSeverities.includes(m.severity), `Invalid severity: ${m.severity}`);
        assert.ok(validActionStatuses.includes(m.actionStatus), `Invalid actionStatus: ${m.actionStatus}`);
        assert.ok(typeof m.riskScore === "number" && m.riskScore >= 0 && m.riskScore <= 100);
        assert.ok(typeof m.priority === "number" && m.priority >= 1 && m.priority <= 4);
        assert.ok(typeof m.costK === "number" && m.costK > 0);
        assert.ok(m.hazardDescription && m.hazardDescription.length > 0);
        assert.ok(m.sop && m.sop.startsWith("SOP-"));
        assert.ok(m.polarCodeRef && m.polarCodeRef.includes("Polar Code"));
        assert.ok(validSeverities.includes(m.polarCodeImpact));
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Dynamic Severity Filter & Matching Counts
  // ──────────────────────────────────────────────────────────────────────────
  describe("2. Dynamic Severity Filter & Matching Counts", () => {
    it("computes accurate static and dynamic severity counts across all tiers", () => {
      const counts = computeSeverityCounts(MITIGATIONS);
      assert.strictEqual(counts.ALL, 7);
      assert.strictEqual(counts.CRITICAL, 3); // m1, m2, m5
      assert.strictEqual(counts.HIGH, 2);     // m3, m4
      assert.strictEqual(counts.MODERATE, 1); // m6
      assert.strictEqual(counts.LOW, 1);      // m7
    });

    it("filters accurately by CRITICAL, HIGH, MODERATE, LOW severities", () => {
      const emptyAck: Record<string, boolean> = {};

      const critical = filterAndSortMitigations(MITIGATIONS, emptyAck, {
        ...defaultOptions,
        severity: "CRITICAL",
      });
      assert.strictEqual(critical.length, 3);
      assert.ok(critical.every((m) => m.severity === "CRITICAL"));

      const high = filterAndSortMitigations(MITIGATIONS, emptyAck, {
        ...defaultOptions,
        severity: "HIGH",
      });
      assert.strictEqual(high.length, 2);
      assert.ok(high.every((m) => m.severity === "HIGH"));

      const moderate = filterAndSortMitigations(MITIGATIONS, emptyAck, {
        ...defaultOptions,
        severity: "MODERATE",
      });
      assert.strictEqual(moderate.length, 1);
      assert.strictEqual(moderate[0].id, "m6");

      const low = filterAndSortMitigations(MITIGATIONS, emptyAck, {
        ...defaultOptions,
        severity: "LOW",
      });
      assert.strictEqual(low.length, 1);
      assert.strictEqual(low[0].id, "m7");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Action Status & Acknowledgment Transitions
  // ──────────────────────────────────────────────────────────────────────────
  describe("3. Operational Action Status & Acknowledgment State", () => {
    it("dynamically transitions action status to 'Implemented' when acknowledged", () => {
      const m1 = MITIGATIONS.find((m) => m.id === "m1")!;
      assert.strictEqual(getEffectiveActionStatus(m1, false), "Critical");
      assert.strictEqual(getEffectiveActionStatus(m1, true), "Implemented");

      const m3 = MITIGATIONS.find((m) => m.id === "m3")!;
      assert.strictEqual(getEffectiveActionStatus(m3, false), "Active");
      assert.strictEqual(getEffectiveActionStatus(m3, true), "Implemented");
    });

    it("filters by status: Critical, Active, Pending, Implemented", () => {
      const acked: Record<string, boolean> = { m1: true, m4: true };

      // Implemented should match m1 and m4
      const implemented = filterAndSortMitigations(MITIGATIONS, acked, {
        ...defaultOptions,
        status: "Implemented",
      });
      assert.strictEqual(implemented.length, 2);
      assert.deepStrictEqual(implemented.map((m) => m.id).sort(), ["m1", "m4"]);

      // Critical should match m2 (unacknowledged critical)
      const critical = filterAndSortMitigations(MITIGATIONS, acked, {
        ...defaultOptions,
        status: "Critical",
      });
      assert.strictEqual(critical.length, 1);
      assert.strictEqual(critical[0].id, "m2");

      // Active should match m3 and m6 (m4 is acknowledged)
      const active = filterAndSortMitigations(MITIGATIONS, acked, {
        ...defaultOptions,
        status: "Active",
      });
      assert.strictEqual(active.length, 2);
      assert.deepStrictEqual(active.map((m) => m.id).sort(), ["m3", "m6"]);
    });

    it("filters by acknowledgment state: ALL, ACKNOWLEDGED, ACTION_REQUIRED", () => {
      const acked: Record<string, boolean> = { m1: true, m2: true, m3: true };

      const all = filterAndSortMitigations(MITIGATIONS, acked, {
        ...defaultOptions,
        ackState: "ALL",
      });
      assert.strictEqual(all.length, 7);

      const acknowledged = filterAndSortMitigations(MITIGATIONS, acked, {
        ...defaultOptions,
        ackState: "ACKNOWLEDGED",
      });
      assert.strictEqual(acknowledged.length, 3);
      assert.deepStrictEqual(acknowledged.map((m) => m.id).sort(), ["m1", "m2", "m3"]);

      const actionRequired = filterAndSortMitigations(MITIGATIONS, acked, {
        ...defaultOptions,
        ackState: "ACTION_REQUIRED",
      });
      assert.strictEqual(actionRequired.length, 4);
      assert.deepStrictEqual(actionRequired.map((m) => m.id).sort(), ["m4", "m5", "m6", "m7"]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Text Search Across Multiple Semantic Dimensions
  // ──────────────────────────────────────────────────────────────────────────
  describe("4. Full-Text Search Filtering", () => {
    it("searches case-insensitively by title", () => {
      const res = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        searchQuery: "ICEBERG",
      });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, "m2");
    });

    it("searches by hazard description keywords", () => {
      const res = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        searchQuery: "katabatic",
      });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, "m7");
    });

    it("searches by SOP procedure identifier", () => {
      const res = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        searchQuery: "SOP-ICE-04",
      });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, "m1");
    });

    it("searches by Polar Code regulatory clause", () => {
      const res = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        searchQuery: "§6.3",
      });
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, "m1");
    });

    it("handles regex characters and special punctuation safely without throwing", () => {
      const safeSearch = () =>
        filterAndSortMitigations(MITIGATIONS, {}, {
          ...defaultOptions,
          searchQuery: "[.*+?^${}()|/]",
        });
      assert.doesNotThrow(safeSearch);
      assert.strictEqual(safeSearch().length, 0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Multi-Field Sorting Verification
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. Multi-Field Sorting", () => {
    it("sorts by Risk Score descending and ascending", () => {
      const desc = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        sortField: "riskScore",
        sortDirection: "desc",
      });
      for (let i = 0; i < desc.length - 1; i++) {
        assert.ok(desc[i].riskScore >= desc[i + 1].riskScore);
      }
      assert.strictEqual(desc[0].id, "m2"); // 92
      assert.strictEqual(desc[desc.length - 1].id, "m7"); // 32

      const asc = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        sortField: "riskScore",
        sortDirection: "asc",
      });
      for (let i = 0; i < asc.length - 1; i++) {
        assert.ok(asc[i].riskScore <= asc[i + 1].riskScore);
      }
      assert.strictEqual(asc[0].id, "m7");
      assert.strictEqual(asc[asc.length - 1].id, "m2");
    });

    it("sorts by Priority rank (P1 -> P4)", () => {
      const asc = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        sortField: "priority",
        sortDirection: "asc",
      });
      for (let i = 0; i < asc.length - 1; i++) {
        assert.ok(asc[i].priority <= asc[i + 1].priority);
      }
      assert.strictEqual(asc[0].priority, 1);
      assert.strictEqual(asc[asc.length - 1].priority, 4);
    });

    it("sorts by Cost ($K) descending", () => {
      const desc = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        sortField: "costK",
        sortDirection: "desc",
      });
      assert.strictEqual(desc[0].id, "m5"); // $85K
      assert.strictEqual(desc[desc.length - 1].id, "m7"); // $4K
      for (let i = 0; i < desc.length - 1; i++) {
        assert.ok(desc[i].costK >= desc[i + 1].costK);
      }
    });

    it("sorts by Polar Code Impact (CRITICAL > HIGH > MODERATE > LOW)", () => {
      const desc = filterAndSortMitigations(MITIGATIONS, {}, {
        ...defaultOptions,
        sortField: "polarCodeImpact",
        sortDirection: "desc",
      });
      assert.strictEqual(desc[0].polarCodeImpact, "CRITICAL");
      assert.strictEqual(desc[desc.length - 1].polarCodeImpact, "LOW");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. CSV Export RFC 4180 Compliance
  // ──────────────────────────────────────────────────────────────────────────
  describe("6. Telemetry CSV Generator (RFC 4180)", () => {
    it("escapes fields containing commas, quotes, and newlines properly", () => {
      assert.strictEqual(formatRFC4180CsvField("Normal Text"), "Normal Text");
      assert.strictEqual(formatRFC4180CsvField("Speed, 6 kn"), '"Speed, 6 kn"');
      assert.strictEqual(formatRFC4180CsvField('With "quotes"'), '"With ""quotes"""');
      assert.strictEqual(formatRFC4180CsvField("Line 1\nLine 2"), '"Line 1\nLine 2"');
    });

    it("generates fully RFC 4180 compliant CSV output with headers and correct row count", () => {
      const acked: Record<string, boolean> = { m1: true };
      const csv = generateRiskTelemetryCsv(MITIGATIONS, acked, {
        routeName: "Recommended Balanced",
        vesselName: "RRS Sir David Attenborough",
        vesselIceClass: "PC4",
      });

      // Split by CRLF
      const lines = csv.split("\r\n");
      assert.strictEqual(lines.length, 8); // 1 header + 7 items

      const headers = lines[0].split(",");
      assert.ok(headers.includes("Item ID"));
      assert.ok(headers.includes("Severity"));
      assert.ok(headers.includes("Risk Score"));
      assert.ok(headers.includes("Standard Operating Procedure (SOP)"));

      // Check m1 row
      const m1Row = lines[1];
      assert.ok(m1Row.includes("m1"));
      assert.ok(m1Row.includes("YES")); // acknowledged
      assert.ok(m1Row.includes("Implemented"));
    });

    it("generates correct timestamped filename for CSV", () => {
      const filename = getExportFilename("csv");
      const d = new Date();
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      assert.strictEqual(filename, `polar-risk-telemetry-${yyyy}${mm}${dd}.csv`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. JSON Export Schema & Formatting
  // ──────────────────────────────────────────────────────────────────────────
  describe("7. Telemetry JSON Generator", () => {
    it("produces valid JSON with 2-space indentation and complete metadata schema", () => {
      const acked: Record<string, boolean> = { m1: true, m2: true };
      const jsonStr = generateRiskTelemetryJson(MITIGATIONS, acked, {
        vessel: {
          name: "RRS Sir David Attenborough",
          iceClass: "PC4",
          loaM: 128,
          beamM: 24,
          draftM: 7.8,
          iceLimitKn: 6.5,
        },
        route: {
          name: "Recommended Balanced",
          distanceNm: 445,
          etaHours: 37.1,
          fuelTons: 42.9,
          averageRiskScore: 31,
          maxRiskScore: 42,
        },
        consequences: [
          { key: "besetment", label: "Besetment Risk", score: 35, value: "Moderate" },
        ],
      });

      // Verification of 2-space formatting
      assert.ok(jsonStr.includes('  "system":'));

      const parsed = JSON.parse(jsonStr);
      assert.strictEqual(parsed.system, "fordgeBurg Antarctic Maritime Decision Support System");
      assert.strictEqual(parsed.vessel.name, "RRS Sir David Attenborough");
      assert.strictEqual(parsed.route.name, "Recommended Balanced");
      assert.strictEqual(parsed.telemetrySummary.totalMitigations, 7);
      assert.strictEqual(parsed.telemetrySummary.acknowledgedCount, 2);
      assert.strictEqual(parsed.mitigations.length, 7);
      assert.strictEqual(parsed.mitigations[0].isAcknowledged, true);
      assert.strictEqual(parsed.mitigations[0].actionStatus, "Implemented");
    });

    it("generates correct timestamped filename for JSON", () => {
      const filename = getExportFilename("json");
      assert.ok(filename.endsWith(".json"));
      assert.ok(filename.startsWith("polar-risk-telemetry-"));
    });
  });
});
```

---

## 7. Next Steps for Implementation Worker

1. **Step 1:** Enrich `MITIGATIONS` in `lib/data.ts` with the 8 new properties while preserving `status: "mandatory" | "recommended" | "advisory"`.
2. **Step 2:** Create `lib/riskExport.ts` with all filtering, sorting, CSV RFC 4180, and JSON generator functions.
3. **Step 3:** Add `tests/risk_filtering_and_export.test.ts` and verify with `npm test`.
4. **Step 4:** Update `app/globals.css` with the complete `@media print` rules.
5. **Step 5:** Overhaul `app/risk/page.tsx` with the filtering toolbar, dynamic counts, export triggers, and responsive UI.
6. **Step 6:** Run `npx tsc --noEmit` and `npm run build` to confirm zero build regressions.
