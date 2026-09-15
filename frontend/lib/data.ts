// Static mock datasets — simplified from docs TRD §7
// Counts: 5 vessels, 3 missions, 4 baseline routes

export type ForecastHorizon = 1 | 3 | 7;
export type OptimizationPreference = "balanced" | "safety" | "fuel" | "time";
export type RouteId = "shortest" | "safest" | "fuel_efficient" | "balanced";

export interface Vessel {
  id: string;
  name: string;
  iceClass: string;
  loaM: number;
  beamM: number;
  draftM: number;
  openWaterKn: number;
  iceLimitKn: number;
  fuelTonsPerDay: number;
}

export interface Mission {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceNm: number;
}

export interface RouteAlternative {
  id: RouteId;
  name: string;
  tradeOff: string;
  distanceNm: number;
  etaHours: number;
  fuelTons: number;
  averageRiskScore: number;
  maxRiskScore: number;
  compatibility: string;
}

export const VESSELS: Vessel[] = [
  { id: "vessel-charcot-pc2", name: "Le Commandant Charcot", iceClass: "PC2", loaM: 150, beamM: 28, draftM: 10, openWaterKn: 15, iceLimitKn: 9, fuelTonsPerDay: 35 },
  { id: "vessel-polarstern2-pc2", name: "Polarstern II", iceClass: "PC2", loaM: 148, beamM: 27.5, draftM: 10.5, openWaterKn: 14.5, iceLimitKn: 8.5, fuelTonsPerDay: 38 },
  { id: "vessel-attenborough-pc4", name: "RRS Sir David Attenborough", iceClass: "PC4", loaM: 128, beamM: 24, draftM: 7.8, openWaterKn: 13, iceLimitKn: 6.5, fuelTonsPerDay: 28 },
  { id: "vessel-agulhas2-pc5", name: "SA Agulhas II", iceClass: "PC5", loaM: 134.2, beamM: 21.7, draftM: 7.65, openWaterKn: 14, iceLimitKn: 5, fuelTonsPerDay: 24 },
  { id: "vessel-navigator-openwater", name: "MV Antarctic Navigator", iceClass: "OpenWater", loaM: 105, beamM: 16.5, draftM: 5.4, openWaterKn: 12.5, iceLimitKn: 2, fuelTonsPerDay: 16 },
];

export const MISSIONS: Mission[] = [
  { id: "mission-weddell-transect", name: "Weddell Sea Science Transect", origin: "Maxwell Bay", destination: "Weddell Outpost Alpha", distanceNm: 445 },
  { id: "mission-palmer-supply", name: "Palmer Station Supply Run", origin: "Maxwell Bay", destination: "Palmer Station", distanceNm: 320 },
  { id: "mission-ross-survey", name: "Ross Sea Marine Survey", origin: "Cape Adare", destination: "Larsen Ice Shelf Margin", distanceNm: 390 },
];

export const BASELINE_ROUTES: RouteAlternative[] = [
  { id: "shortest", name: "Shortest", tradeOff: "Fastest distance, highest ice exposure", distanceNm: 412, etaHours: 38.5, fuelTons: 48.2, averageRiskScore: 74, maxRiskScore: 88, compatibility: "marginal" },
  { id: "safest", name: "Safest", tradeOff: "Lowest risk, longest detour", distanceNm: 528, etaHours: 44, fuelTons: 51.5, averageRiskScore: 22, maxRiskScore: 36, compatibility: "high" },
  { id: "fuel_efficient", name: "Fuel-Efficient", tradeOff: "Lowest fuel burn", distanceNm: 458, etaHours: 41.6, fuelTons: 39.8, averageRiskScore: 45, maxRiskScore: 54, compatibility: "high" },
  { id: "balanced", name: "Recommended Balanced", tradeOff: "Best trade-off of risk, fuel and time", distanceNm: 445, etaHours: 37.1, fuelTons: 42.9, averageRiskScore: 31, maxRiskScore: 42, compatibility: "high" },
];

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

export const DEFAULTS = {
  missionId: "mission-weddell-transect",
  vesselId: "vessel-attenborough-pc4",
  horizon: 1 as ForecastHorizon,
  preference: "balanced" as OptimizationPreference,
  routeId: "balanced" as RouteId,
};
