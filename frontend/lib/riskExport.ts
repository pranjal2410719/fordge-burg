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
 * Any field containing comma, double-quote, or newline is wrapped in double quotes,
 * and internal double quotes are escaped as two double quotes ("").
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
  lines.push("# FORDBERG ANTARCTIC MARITIME DSS - RISK TELEMETRY EXPORT");
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
    system: "fordberg Antarctic Maritime Decision Support System",
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
  if (typeof window === "undefined") return;
  const csv = generateRiskCsv(payload);
  const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  const filename = `fordberg-risk-telemetry-${payload.selectedRoute.id}-${new Date().toISOString().slice(0, 10)}.csv`;
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
  if (typeof window === "undefined") return;
  const json = generateRiskJson(payload);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  const filename = `fordberg-risk-telemetry-${payload.selectedRoute.id}-${new Date().toISOString().slice(0, 10)}.json`;
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
