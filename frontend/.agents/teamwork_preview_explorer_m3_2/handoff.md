# Handoff Report: Advanced Filtering, Sorting, and Telemetry Data Export (Milestone 3 / R2)

**Author**: teamwork_preview_explorer (m3_2)  
**Date**: 2026-09-18T00:52:00Z  
**Scope**: Milestone 3 — R2: Risk Tab Functionality (Filtering, Sorting, and Telemetry Data Export)  
**Status**: Ready for implementation by M3 Worker  

---

## 1. Observation

### 1.1 Existing Implementation Baseline
- **`app/risk/page.tsx`**:
  - Currently 170 lines (`app/risk/page.tsx:1-170`).
  - State consists solely of `acked: Record<string, boolean>` (`app/risk/page.tsx:31`).
  - Mitigations are rendered via a static `.map()` over `MITIGATIONS` (`app/risk/page.tsx:114-158`) with zero search, filter, or sort capability.
  - "Acknowledge all" button (`app/risk/page.tsx:98-109`) batch-sets all IDs to `true`.
  - There is no CSV or JSON data export functionality.
  - Print trigger exists only on `app/reports/page.tsx:30` (`window.print()`), not on `app/risk/page.tsx`.
- **`lib/data.ts`**:
  - Defines `MITIGATIONS: Mitigation[]` (`lib/data.ts:68-76`) with exactly 7 items:
    - 2 Mandatory: `m1` ("Reduce speed in pack ice"), `m2` ("Maintain 5.0 NM iceberg standoff").
    - 3 Recommended: `m3` ("Daylight transit of chokepoints"), `m4` ("Extra lookout / ice watch"), `m6` ("Fuel reserve margin check").
    - 2 Advisory: `m5` ("Escort on standby for OpenWater hulls"), `m7` ("Contingency anchorage identified").
  - Defines `BASELINE_ROUTES: RouteAlternative[]` (`lib/data.ts:54-59`) with 4 routes: `shortest`, `safest`, `fuel_efficient`, `balanced`.
  - Defines `VESSELS: Vessel[]` (`lib/data.ts:40-46`) and `MISSIONS: Mission[]` (`lib/data.ts:48-52`).
- **`app/globals.css`**:
  - Configures Tailwind CSS v4 `@theme` design tokens (`app/globals.css:3-48`).
  - Print styles (`app/globals.css:81-84`):
    ```css
    @media print {
      .no-print { display: none !important; }
      body { background: white; }
    }
    ```
- **`package.json`**:
  - Test command: `"test": "tsx --test tests/**/*.test.ts"` (`package.json:10`).
  - All existing 50 tests in 3 test suites (`tests/data_and_utils.test.ts`, `tests/mission_planner_interactive.test.ts`, `tests/adversarial_challenge.test.ts`) currently pass with 0 errors.

### 1.2 Empirical Baseline Verification
Executed runtime checks on `lib/data.ts` and mock state:
- Static Category Counts: `{ all: 7, mandatory: 2, recommended: 3, advisory: 2 }`.
- Acknowledgment Counts with 2 acked: `{ all: 7, pending: 5, acknowledged: 2 }`.
- Keyword Search for `"ice"`: successfully matches 3 items (`m1`, `m2`, `m4`).
- CSV and JSON generation executed cleanly, producing valid RFC 4180 CSV and valid JSON parseable by `JSON.parse()`.

---

## 2. Logic Chain

### 2.1 State Architecture & Mathematical Filtering Composition
To deliver responsive filtering and sorting without race conditions, the filtering state is managed either in `app/risk/page.tsx` or encapsulated in a custom hook `useMitigationFilter`:

```typescript
export type MitigationStatusFilter = "all" | "mandatory" | "recommended" | "advisory";
export type MitigationAckFilter = "all" | "pending" | "acknowledged";
export type MitigationSortOption = "priority" | "name" | "impact";

export interface FilterState {
  statusFilter: MitigationStatusFilter;
  ackFilter: MitigationAckFilter;
  searchQuery: string;
  sortBy: MitigationSortOption;
}
```

The filtered and sorted dataset is computed via `useMemo` with a 4-stage sequential predicate pipeline:
1. **Status Predicate**:
   `statusFilter === "all" || m.status === statusFilter`
2. **Acknowledgment Predicate**:
   - If `ackFilter === "acknowledged"`: `!!acked[m.id]`
   - If `ackFilter === "pending"`: `!acked[m.id]`
   - If `ackFilter === "all"`: `true`
3. **Live Search Predicate**:
   - `searchQuery.trim() === ""` returns `true`.
   - Otherwise, case-insensitive substring match:
     `m.title.toLowerCase().includes(q) || m.detail.toLowerCase().includes(q)`.
   - Uses `includes()` instead of regex to prevent ReDoS or syntax crashes on user inputs containing regex special tokens (`*`, `+`, `(`, `[`).
4. **Multi-Criteria Comparator**:
   - `"name"`: Alphabetical sorting by `a.title.localeCompare(b.title)`.
   - `"priority"`: Weighted status sorting (`mandatory: 3`, `recommended: 2`, `advisory: 1`), breaking ties by natural array order.
   - `"impact"`: Risk reduction / consequence severity impact ranking:
     * `m1` (Throttle pack ice speed — prevents catastrophic hull structural damage): Weight 95
     * `m2` (5.0 NM iceberg standoff — prevents berg collision): Weight 90
     * `m4` (Extra lookout / ice watch — visual detection of growlers/bergy bits): Weight 75
     * `m3` (Daylight transit — navigation in high-risk chokepoints): Weight 70
     * `m6` (Fuel reserve check — besetment endurance): Weight 65
     * `m5` (Escort standby — hull protection for non-ice-class hulls): Weight 50
     * `m7` (Contingency anchorage — emergency shelter holding): Weight 40
     Breaking ties alphabetically by title.

### 2.2 Dynamic Count Badges
- **Mitigation Status Counts** (reflecting total inventory per category):
  - `all`: `MITIGATIONS.length` (7)
  - `mandatory`: `MITIGATIONS.filter(m => m.status === "mandatory").length` (2)
  - `recommended`: `MITIGATIONS.filter(m => m.status === "recommended").length` (3)
  - `advisory`: `MITIGATIONS.filter(m => m.status === "advisory").length` (2)
- **Acknowledgment Counts** (reactively updating on `acked` state change):
  - `all`: `MITIGATIONS.length` (7)
  - `acknowledged`: `Object.values(acked).filter(Boolean).length`
  - `pending`: `MITIGATIONS.length - Object.values(acked).filter(Boolean).length`
- **Active Results Counter**:
  Header displays: `Showing ${filteredMitigations.length} of ${MITIGATIONS.length} mitigations`.

### 2.3 Telemetry Data Export Implementation Architecture

#### A. CSV Export (`lib/riskExport.ts`)
The prompt requires:
> "client-side formatted CSV download (`data:text/csv;charset=utf-8,...`) containing route risk summary, consequence metrics, and mitigation items with status."

- RFC 4180 compliance requires escaping: any cell containing commas, quotes, or newlines must be enclosed in quotes with embedded quotes escaped as `""`.
- Helper function `escapeCsv(value)`:
  ```typescript
  export function escapeCsv(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
  ```
- Structure:
  1. Section 1: `# FORGEBURG ANTARCTIC MARITIME DSS - RISK TELEMETRY EXPORT` (Timestamp, Document Reference, Classification Advisory).
  2. Section 2: `# MISSION & VESSEL PROFILE` (Mission name, Corridor, Distance, Vessel name, Ice class, LOA, Beam, Draft, Speed limits).
  3. Section 3: `# SELECTED ROUTE RISK SUMMARY` (Route ID, Name, Trade-off, Distance, ETA, Fuel, Average Risk Score, Max Risk Score, Compatibility).
  4. Section 4: `# CONSEQUENCE ANALYSIS METRICS` (Metric key, Label, Assessed score, Value, Level).
  5. Section 5: `# OPERATIONAL MITIGATION CHECKLIST` (ID, Title, Requirement status, Acknowledgment status, Detail description).
  6. Section 6: `# ROUTE ALTERNATIVES COMPARISON` (All 4 routes: Shortest, Safest, Fuel-Efficient, Balanced).
- Client Download Trigger:
  ```typescript
  export function exportRiskCsv(data: RiskTelemetryPayload): void {
    const csvContent = generateRiskCsvString(data);
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `fordgeburg-risk-telemetry-${data.selectedRoute.id}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  ```

#### B. JSON Export (`lib/riskExport.ts`)
The prompt requires:
> "formatted JSON download (`data:application/json;charset=utf-8,...`) containing complete telemetry dump."

- Comprehensive JSON schema containing:
  - `system`: `"fordgeBurg Antarctic Maritime Decision Support System"`
  - `documentRef`: `FB-RISK-${refId}`
  - `exportTimestamp`: ISO 8601 UTC timestamp
  - `classification`: `"ADVISORY - NOT FOR AUTONOMOUS NAVIGATION (SOLAS Ch. V / IMO Polar Code)"`
  - `mission`: Full Mission object
  - `vessel`: Full Vessel profile
  - `selectedRoute`: Full RouteAlternative object
  - `consequences`: Array of consequence assessment objects
  - `mitigations`: Array of Mitigations annotated with `acknowledged: boolean` and `acknowledgmentStatus: "Acknowledged" | "Pending"`
  - `allRoutes`: All 4 route alternatives for comparative analytics
- Client Download Trigger:
  ```typescript
  export function exportRiskJson(data: RiskTelemetryPayload): void {
    const jsonString = JSON.stringify(data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `fordgeburg-risk-telemetry-${data.selectedRoute.id}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  ```

#### C. Print Export
The prompt requires:
> "print trigger invoking `window.print()` with clean print-friendly layout."

- Trigger: `<button onClick={() => window.print()} ...>` with `<Printer size={15} />` icon.
- Print UX:
  1. Add `.no-print` class to interactive elements:
     - Search input bar, filter pill buttons, sort dropdown, export buttons.
     - Individual mitigation checkbox toggle buttons (replaced in print by clean printable checkboxes or badges).
  2. Printable Header section:
     - Visible in print view (`print:block hidden`), containing the official fordgeBurg DSS crest, Document Reference, Generation timestamp, Vessel profile, and Selected route summary.
  3. Printable Consequence Grid:
     - Maintains clean, bordered grid with high-contrast text and numerical risk scores.
  4. Printable Mitigations List:
     - Displays all 7 mitigations with clear status badges and `[✓] Acknowledged` / `[ ] Pending` indicators.
  5. Printable SOLAS / IMO Polar Code Advisory & Signature Block:
     - Command authority sign-off lines for Master, Ice Pilot, and Fleet Operations Desk.

---

## 3. Caveats
1. **Read-Only Explorer Constraint**: No source code was modified. Code proposals, file specifications, and component designs are provided for the M3 Worker to implement.
2. **Complementary Milestone 3 Components**:
   - Explorer m3_1 is designing the native SVG charts (`RiskCharts.tsx`).
   - Explorer m3_3 is designing the modal breakdown dialogs (`ConsequenceModal.tsx` and `MitigationModal.tsx`).
   - The filtering, sorting, and export components designed here are modularized into `components/risk/MitigationFilters.tsx`, `components/risk/TelemetryExportBar.tsx`, and `lib/riskExport.ts` so they integrate seamlessly without merge friction.
3. **Print Media in Next.js / Tailwind**: In `app/globals.css`, `@media print { .no-print { display: none !important; } }` exists. The Worker should ensure `aside` and `header` in `AppShell` are tagged with `.no-print` or that `globals.css` includes `@media print { aside, header, .no-print { display: none !important; } }` to avoid printing the navigation sidebar.

---

## 4. Conclusion & Concrete Design Specification

### 4.1 Component Inventory & File Locations
1. **`lib/riskExport.ts`** (New File):
   - Pure utility module for CSV generation, JSON serialization, escaping, and download triggers.
   - Fully unit-testable in Node.js test environment.
2. **`components/risk/MitigationFilters.tsx`** (New Component):
   - Houses the live search input, status filter pills with counts, acknowledgment pills with counts, multi-criteria sort selector, and active filter reset button.
3. **`components/risk/TelemetryExportBar.tsx`** (New Component):
   - Houses the CSV Export, JSON Export, and Print Export buttons with loading indicators / toast feedback.
4. **`app/risk/page.tsx`** (Updated Page Component):
   - Integrates `TelemetryExportBar` in the top action area.
   - Integrates `MitigationFilters` above the mitigation checklist.
   - Computes `filteredAndSortedMitigations` via `useMemo`.
   - Connects print layout with clean print-only document header and signature block.
5. **`tests/risk_filtering_export.test.ts`** (New Test Suite):
   - Comprehensive automated test suite validating filtering combinations, sorting comparators, CSV RFC 4180 escaping, and JSON telemetry integrity.

---

### 4.2 Exact Code Implementation Blueprints

#### Blueprint 1: `lib/riskExport.ts`
```typescript
import {
  type Mission,
  type Vessel,
  type RouteAlternative,
  type Mitigation,
  BASELINE_ROUTES,
} from "./data";

export interface ConsequenceItem {
  key: string;
  label: string;
  score: number;
  value: string;
  level?: "LOW" | "MODERATE" | "HIGH";
}

export interface RiskTelemetryPayload {
  exportTimestamp?: string;
  documentRef?: string;
  mission: Mission;
  vessel: Vessel;
  selectedRoute: RouteAlternative;
  consequences: ConsequenceItem[];
  mitigations: Mitigation[];
  acked: Record<string, boolean>;
  allRoutes?: RouteAlternative[];
}

/**
 * Escapes a cell value for RFC 4180 compliant CSV output.
 */
export function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates formatted CSV string containing route risk summary,
 * consequence metrics, and mitigation items with status.
 */
export function generateRiskCsv(payload: RiskTelemetryPayload): string {
  const ts = payload.exportTimestamp || new Date().toISOString();
  const docRef = payload.documentRef || `FB-RISK-${Math.floor(1000 + Math.random() * 9000)}`;
  const { mission, vessel, selectedRoute, consequences, mitigations, acked } = payload;
  const allRoutes = payload.allRoutes || BASELINE_ROUTES;

  const lines: string[] = [];

  // Section 1: Header Metadata
  lines.push("# FORGEBURG ANTARCTIC MARITIME DSS - RISK TELEMETRY EXPORT");
  lines.push(`Export Timestamp,${ts}`);
  lines.push(`Document Reference,${docRef}`);
  lines.push(`Classification,ADVISORY - NOT FOR AUTONOMOUS NAVIGATION (SOLAS Ch. V / IMO Polar Code)`);
  lines.push("");

  // Section 2: Mission & Vessel Profile
  lines.push("# MISSION & VESSEL PROFILE");
  lines.push(`Mission ID,${mission.id}`);
  lines.push(`Mission Name,${escapeCsv(mission.name)}`);
  lines.push(`Corridor,${escapeCsv(`${mission.origin} -> ${mission.destination}`)}`);
  lines.push(`Baseline Distance (NM),${mission.distanceNm}`);
  lines.push(`Vessel ID,${vessel.id}`);
  lines.push(`Vessel Name,${escapeCsv(vessel.name)}`);
  lines.push(`Ice Class,${vessel.iceClass}`);
  lines.push(`Dimensions (LOA x Beam x Draft),${vessel.loaM}m x ${vessel.beamM}m x ${vessel.draftM}m`);
  lines.push(`Speed Limits (Open / Ice),${vessel.openWaterKn} kn / ${vessel.iceLimitKn} kn`);
  lines.push(`Bunker Burn Rate,${vessel.fuelTonsPerDay} MT/day`);
  lines.push("");

  // Section 3: Selected Route Risk Summary
  lines.push("# SELECTED ROUTE RISK SUMMARY");
  lines.push("Route ID,Route Name,Trade-off,Distance (NM),ETA (hrs),Fuel (MT),Avg Risk Score,Max Risk Score,Compatibility");
  lines.push([
    selectedRoute.id,
    escapeCsv(selectedRoute.name),
    escapeCsv(selectedRoute.tradeOff),
    selectedRoute.distanceNm,
    selectedRoute.etaHours,
    selectedRoute.fuelTons,
    selectedRoute.averageRiskScore,
    selectedRoute.maxRiskScore,
    selectedRoute.compatibility,
  ].join(","));
  lines.push("");

  // Section 4: Consequence Analysis Metrics
  lines.push("# CONSEQUENCE ANALYSIS METRICS");
  lines.push("Metric Key,Metric Label,Risk Score,Assessed Value,Assessed Level");
  consequences.forEach((c) => {
    const level = c.level || (c.score < 35 ? "LOW" : c.score < 65 ? "MODERATE" : "HIGH");
    lines.push([
      c.key,
      escapeCsv(c.label),
      c.score,
      escapeCsv(c.value),
      level,
    ].join(","));
  });
  lines.push("");

  // Section 5: Operational Mitigation Checklist
  lines.push("# OPERATIONAL MITIGATION CHECKLIST");
  lines.push("Mitigation ID,Title,Requirement Level,Acknowledgment Status,Detail");
  mitigations.forEach((m) => {
    const isAcked = !!acked[m.id];
    lines.push([
      m.id,
      escapeCsv(m.title),
      m.status,
      isAcked ? "Acknowledged" : "Pending",
      escapeCsv(m.detail),
    ].join(","));
  });
  lines.push("");

  // Section 6: Route Alternatives Comparative Summary
  lines.push("# ROUTE ALTERNATIVES COMPARISON");
  lines.push("Route ID,Name,Distance (NM),ETA (hrs),Fuel (MT),Avg Risk,Max Risk,Compatibility");
  allRoutes.forEach((r) => {
    lines.push([
      r.id,
      escapeCsv(r.name),
      r.distanceNm,
      r.etaHours,
      r.fuelTons,
      r.averageRiskScore,
      r.maxRiskScore,
      r.compatibility,
    ].join(","));
  });

  return lines.join("\n");
}

/**
 * Generates formatted JSON string telemetry dump.
 */
export function generateRiskJson(payload: RiskTelemetryPayload): string {
  const ts = payload.exportTimestamp || new Date().toISOString();
  const docRef = payload.documentRef || `FB-RISK-${Math.floor(1000 + Math.random() * 9000)}`;
  const { mission, vessel, selectedRoute, consequences, mitigations, acked } = payload;
  const allRoutes = payload.allRoutes || BASELINE_ROUTES;

  const data = {
    system: "fordgeBurg Antarctic Maritime Decision Support System",
    documentRef: docRef,
    exportTimestamp: ts,
    classification: "ADVISORY - NOT FOR AUTONOMOUS NAVIGATION (SOLAS Ch. V / IMO Polar Code)",
    mission,
    vessel,
    selectedRoute,
    consequenceMetrics: consequences.map((c) => ({
      ...c,
      level: c.level || (c.score < 35 ? "LOW" : c.score < 65 ? "MODERATE" : "HIGH"),
    })),
    mitigations: mitigations.map((m) => ({
      ...m,
      acknowledged: !!acked[m.id],
      acknowledgmentStatus: acked[m.id] ? "Acknowledged" : "Pending",
    })),
    routeAlternatives: allRoutes,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Triggers client-side download of CSV telemetry via data URI.
 */
export function downloadRiskCsv(payload: RiskTelemetryPayload): void {
  const csv = generateRiskCsv(payload);
  const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  const filename = `fordgeburg-risk-telemetry-${payload.selectedRoute.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers client-side download of JSON telemetry via data URI.
 */
export function downloadRiskJson(payload: RiskTelemetryPayload): void {
  const json = generateRiskJson(payload);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  const filename = `fordgeburg-risk-telemetry-${payload.selectedRoute.id}-${new Date().toISOString().slice(0, 10)}.json`;
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

#### Blueprint 2: `components/risk/TelemetryExportBar.tsx`
```tsx
"use client";

import { useState } from "react";
import { Download, FileCode, Printer, Check } from "lucide-react";
import {
  type RiskTelemetryPayload,
  downloadRiskCsv,
  downloadRiskJson,
} from "@/lib/riskExport";

interface TelemetryExportBarProps {
  payload: RiskTelemetryPayload;
}

export function TelemetryExportBar({ payload }: TelemetryExportBarProps) {
  const [copiedType, setCopiedType] = useState<"csv" | "json" | null>(null);

  const handleCsvExport = () => {
    downloadRiskCsv(payload);
    setCopiedType("csv");
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handleJsonExport = () => {
    downloadRiskJson(payload);
    setCopiedType("json");
    setTimeout(() => setCopiedType(null), 1800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button
        onClick={handleCsvExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm transition-all hover:border-border-strong hover:bg-surface2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        title="Export telemetry and mitigations to CSV"
      >
        {copiedType === "csv" ? (
          <Check size={13} className="text-risk-low" />
        ) : (
          <Download size={13} className="text-text-muted" />
        )}
        <span>{copiedType === "csv" ? "CSV Downloaded" : "Export CSV"}</span>
      </button>

      <button
        onClick={handleJsonExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm transition-all hover:border-border-strong hover:bg-surface2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        title="Export full telemetry dataset to JSON"
      >
        {copiedType === "json" ? (
          <Check size={13} className="text-risk-low" />
        ) : (
          <FileCode size={13} className="text-text-muted" />
        )}
        <span>{copiedType === "json" ? "JSON Downloaded" : "Export JSON"}</span>
      </button>

      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-navy-900 bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-navy-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
        title="Print risk briefing document or save as PDF"
      >
        <Printer size={13} />
        <span>Print Briefing</span>
      </button>
    </div>
  );
}
```

---

#### Blueprint 3: `components/risk/MitigationFilters.tsx`
```tsx
"use client";

import { Search, X, ArrowUpDown, Filter } from "lucide-react";
import { type Mitigation } from "@/lib/data";
import { cn } from "@/lib/utils";

export type MitigationStatusFilter = "all" | "mandatory" | "recommended" | "advisory";
export type MitigationAckFilter = "all" | "pending" | "acknowledged";
export type MitigationSortOption = "priority" | "name" | "impact";

interface MitigationFiltersProps {
  mitigations: Mitigation[];
  acked: Record<string, boolean>;
  statusFilter: MitigationStatusFilter;
  onStatusFilterChange: (status: MitigationStatusFilter) => void;
  ackFilter: MitigationAckFilter;
  onAckFilterChange: (ack: MitigationAckFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: MitigationSortOption;
  onSortByChange: (sort: MitigationSortOption) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export function MitigationFilters({
  mitigations,
  acked,
  statusFilter,
  onStatusFilterChange,
  ackFilter,
  onAckFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  totalFilteredCount,
}: MitigationFiltersProps) {
  // Compute category counts
  const mandatoryCount = mitigations.filter((m) => m.status === "mandatory").length;
  const recommendedCount = mitigations.filter((m) => m.status === "recommended").length;
  const advisoryCount = mitigations.filter((m) => m.status === "advisory").length;

  const ackedCount = Object.values(acked).filter(Boolean).length;
  const pendingCount = mitigations.length - ackedCount;

  const isFiltered =
    statusFilter !== "all" ||
    ackFilter !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "priority";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface2/60 p-3.5 no-print">
      {/* Top row: Search input + Sorting selector */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search mitigations by title, guideline, SOP..."
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-9 pr-8 text-xs text-navy-900 placeholder:text-text-subtle transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-primary"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
            <ArrowUpDown size={12} className="text-text-subtle" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as MitigationSortOption)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-navy-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none"
          >
            <option value="priority">Priority Order</option>
            <option value="name">Name (A-Z)</option>
            <option value="impact">Risk Impact</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Status Pills + Acknowledgment Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-2.5">
        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
            Status:
          </span>
          {[
            { key: "all", label: "All", count: mitigations.length },
            { key: "mandatory", label: "Mandatory", count: mandatoryCount },
            { key: "recommended", label: "Recommended", count: recommendedCount },
            { key: "advisory", label: "Advisory", count: advisoryCount },
          ].map(({ key, label, count }) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => onStatusFilterChange(key as MitigationStatusFilter)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                  active
                    ? key === "mandatory"
                      ? "bg-risk-high text-white font-semibold shadow-xs"
                      : key === "recommended"
                      ? "bg-risk-med text-white font-semibold shadow-xs"
                      : "bg-navy-900 text-white font-semibold shadow-xs"
                    : "bg-surface border border-border text-text-secondary hover:bg-surface2 hover:text-navy-900"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-canvas text-text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Acknowledgment filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-text-subtle">
            Ack:
          </span>
          {[
            { key: "all", label: "All", count: mitigations.length },
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "acknowledged", label: "Acknowledged", count: ackedCount },
          ].map(({ key, label, count }) => {
            const active = ackFilter === key;
            return (
              <button
                key={key}
                onClick={() => onAckFilterChange(key as MitigationAckFilter)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                  active
                    ? "bg-navy-900 text-white font-semibold shadow-xs"
                    : "bg-surface border border-border text-text-secondary hover:bg-surface2 hover:text-navy-900"
                )}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-canvas text-text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Reset button when any filter active */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

#### Blueprint 4: Integrating into `app/risk/page.tsx`
```tsx
// Excerpt showing filtering, sorting, telemetry export bar, and print-ready markup:

const [statusFilter, setStatusFilter] = useState<MitigationStatusFilter>("all");
const [ackFilter, setAckFilter] = useState<MitigationAckFilter>("all");
const [searchQuery, setSearchQuery] = useState("");
const [sortBy, setSortBy] = useState<MitigationSortOption>("priority");

const impactWeights: Record<string, number> = {
  m1: 95, // speed in pack ice
  m2: 90, // iceberg standoff
  m4: 75, // extra lookout
  m3: 70, // daylight transit
  m6: 65, // fuel reserve
  m5: 50, // escort standby
  m7: 40, // contingency anchorage
};

const priorityWeights: Record<string, number> = {
  mandatory: 3,
  recommended: 2,
  advisory: 1,
};

const filteredMitigations = useMemo(() => {
  return MITIGATIONS
    .filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      const isAcked = !!acked[m.id];
      if (ackFilter === "acknowledged" && !isAcked) return false;
      if (ackFilter === "pending" && isAcked) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = m.title.toLowerCase().includes(q);
        const inDetail = m.detail.toLowerCase().includes(q);
        if (!inTitle && !inDetail) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "impact") {
        const diff = (impactWeights[b.id] || 0) - (impactWeights[a.id] || 0);
        if (diff !== 0) return diff;
        return a.title.localeCompare(b.title);
      }
      // "priority" order
      const diff = (priorityWeights[b.status] || 0) - (priorityWeights[a.status] || 0);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
}, [acked, statusFilter, ackFilter, searchQuery, sortBy]);

const telemetryPayload = useMemo(() => ({
  mission,
  vessel,
  selectedRoute,
  consequences,
  mitigations: MITIGATIONS,
  acked,
}), [mission, vessel, selectedRoute, consequences, acked]);
```

---

## 5. Verification Method

### 5.1 Automated Unit Tests (`tests/risk_filtering_export.test.ts`)
The M3 Worker or Tester can create `tests/risk_filtering_export.test.ts` to independently verify all aspects:

1. **Status Filter Counts**:
   Verify counts for All (7), Mandatory (2), Recommended (3), Advisory (2).
2. **Acknowledgment Filter Reactivity**:
   Verify when `acked = { m1: true, m2: true }`, `pending === 5` and `acknowledged === 2`.
3. **Keyword Search Predicate**:
   - Query `"standoff"` returns exactly `['m2']`.
   - Query `"ice"` returns `['m1', 'm2', 'm4']`.
   - Query with uppercase `"LOOKOUT"` matches `['m4']`.
   - Query with no match `"submarine"` returns `[]`.
4. **Sorting Comparators**:
   - `name`: Alphabetical order starting with `"Contingency anchorage identified"` and ending with `"Reduce speed in pack ice"`.
   - `impact`: Validates that `m1` (weight 95) and `m2` (weight 90) rank above advisory mitigations `m5` and `m7`.
   - `priority`: Validates all mandatory items precede recommended items, which precede advisory items.
5. **CSV RFC 4180 Escaping & Structure**:
   - Escapes commas, quotes, and line breaks properly.
   - Contains headers `# FORGEBURG ANTARCTIC MARITIME DSS`, `# SELECTED ROUTE RISK SUMMARY`, `# CONSEQUENCE ANALYSIS METRICS`, `# OPERATIONAL MITIGATION CHECKLIST`.
   - Verifies 7 mitigations present in CSV string.
6. **JSON Serialization**:
   - `generateRiskJson` output is parseable by `JSON.parse()`.
   - Validates presence of `system`, `selectedRoute.id`, `consequenceMetrics`, and `mitigations` with boolean `acknowledged` fields.

### 5.2 Test Execution Command
Run in terminal:
```bash
npm test
```
All existing tests plus the new tests must pass with exit code 0.

### 5.3 Invalidation Conditions
This analysis is invalidated if:
- `lib/data.ts` modifies the keys or statuses in `MITIGATIONS` or `BASELINE_ROUTES`.
- `useMission()` removes `selectedRoute`, `vessel`, or `mission`.
- External charting dependencies or canvas-based renderers are introduced contrary to `PROJECT.md`.
