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

export interface RouteWaypoint {
  id: string;
  name: string;
  lat: string;
  lon: string;
  distNm: number;
  cumulativeNm: number;
  iceConcTenths: number;
  speedLimitKn: number;
  riskScore: number;
  hazardNote: string;
}

export interface PolarisRioProfile {
  score: number;
  scoreFormatted: string;
  status: "PASS" | "MARGINAL";
  regulatoryClause: string;
  description: string;
}

export interface IceExposureBreakdown {
  openWaterPct: number;
  lightIcePct: number;
  mediumPackPct: number;
  heavyRidgePct: number;
  peakIceConcTenths: number;
  peakLocation: string;
  multiYearIceNm: number;
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
  rio: PolarisRioProfile;
  iceExposure: IceExposureBreakdown;
  waypoints: RouteWaypoint[];
  pathCoordinates: { x: number; y: number }[];
  aiRationale: {
    algorithm: string;
    heuristics: string;
    tradeOff: string;
  };
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
  {
    id: "shortest",
    name: "Shortest",
    tradeOff: "Fastest distance, highest ice exposure",
    distanceNm: 412,
    etaHours: 38.5,
    fuelTons: 48.2,
    averageRiskScore: 74,
    maxRiskScore: 88,
    compatibility: "marginal",
    rio: {
      score: -3.2,
      scoreFormatted: "-3.2",
      status: "MARGINAL",
      regulatoryClause: "IMO Polar Code MSC.1/Circ.1519 §3.2 (Elevated Risk Assessment)",
      description: "MARGINAL — Elevated pressure ice in Antarctic Sound requires ice pilot concurrence and daylight transit only.",
    },
    iceExposure: {
      openWaterPct: 18,
      lightIcePct: 22,
      mediumPackPct: 24,
      heavyRidgePct: 36,
      peakIceConcTenths: 8,
      peakLocation: "Antarctic Sound",
      multiYearIceNm: 145,
    },
    waypoints: [
      { id: "wp-s1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, cumulativeNm: 0, iceConcTenths: 2, speedLimitKn: 12, riskScore: 32, hazardNote: "Open lead egress; radar lookout active" },
      { id: "wp-s2", name: "Antarctic Sound Chokepoint", lat: "63.1°S", lon: "57.80°W", distNm: 125, cumulativeNm: 125, iceConcTenths: 8, speedLimitKn: 4, riskScore: 88, hazardNote: "Heavy pressure ridges PR-01, severe besetment risk" },
      { id: "wp-s3", name: "Erebus & Terror Gulf", lat: "63.5°S", lon: "57.50°W", distNm: 90, cumulativeNm: 215, iceConcTenths: 7, speedLimitKn: 5, riskScore: 85, hazardNote: "Multi-year floes and compressive rafting pack" },
      { id: "wp-s4", name: "Weddell Outpost Alpha", lat: "65.5°S", lon: "56.00°W", distNm: 197, cumulativeNm: 412, iceConcTenths: 5, speedLimitKn: 7, riskScore: 71, hazardNote: "Terminal ice apron approach; slow maneuvering" },
    ],
    pathCoordinates: [
      { x: 505, y: 28.9 },
      { x: 620, y: 158.9 },
      { x: 650, y: 216.7 },
      { x: 800, y: 505.6 },
    ],
    aiRationale: {
      algorithm: "Multi-objective A* (Min-Distance Greedy Lead)",
      heuristics: "Prioritizes minimum geographic track distance traversing direct coastal straits despite compressive ice hazards.",
      tradeOff: "Saves 116 NM vs Safest route but incurs high besetment probability (36% heavy ridge exposure) and negative POLARIS RIO (-3.2).",
    },
  },
  {
    id: "safest",
    name: "Safest",
    tradeOff: "Lowest risk, longest detour",
    distanceNm: 528,
    etaHours: 44.0,
    fuelTons: 51.5,
    averageRiskScore: 22,
    maxRiskScore: 36,
    compatibility: "high",
    rio: {
      score: 24.2,
      scoreFormatted: "+24.2",
      status: "PASS",
      regulatoryClause: "IMO Polar Code MSC.1/Circ.1519 §2.1 (Unrestricted Polar Transit)",
      description: "PASS — Maximum ice standoff maintaining open water leads and avoiding compressive pack.",
    },
    iceExposure: {
      openWaterPct: 68,
      lightIcePct: 24,
      mediumPackPct: 8,
      heavyRidgePct: 0,
      peakIceConcTenths: 3,
      peakLocation: "Trinity Lead",
      multiYearIceNm: 0,
    },
    waypoints: [
      { id: "wp-sf1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, cumulativeNm: 0, iceConcTenths: 1, speedLimitKn: 13, riskScore: 16, hazardNote: "Clear departure channel with minor brash ice" },
      { id: "wp-sf2", name: "West Bransfield Bypass", lat: "62.8°S", lon: "60.20°W", distNm: 115, cumulativeNm: 115, iceConcTenths: 2, speedLimitKn: 11, riskScore: 22, hazardNote: "Deep wide oceanic lead avoiding coastal icefields" },
      { id: "wp-sf3", name: "Low Island Deep Channel", lat: "63.0°S", lon: "61.00°W", distNm: 80, cumulativeNm: 195, iceConcTenths: 1, speedLimitKn: 12, riskScore: 18, hazardNote: "Maximum open water standoff; unrestricted visibility" },
      { id: "wp-sf4", name: "Trinity Seaward Lead", lat: "64.5°S", lon: "59.50°W", distNm: 165, cumulativeNm: 360, iceConcTenths: 3, speedLimitKn: 9, riskScore: 36, hazardNote: "Dispersed first-year floes; low compressive risk" },
      { id: "wp-sf5", name: "Weddell Outpost Approach", lat: "65.5°S", lon: "56.00°W", distNm: 168, cumulativeNm: 528, iceConcTenths: 2, speedLimitKn: 10, riskScore: 20, hazardNote: "Wide approach corridor avoiding fast ice tongue" },
    ],
    pathCoordinates: [
      { x: 505, y: 28.9 },
      { x: 380, y: 115.6 },
      { x: 300, y: 144.4 },
      { x: 450, y: 361.1 },
      { x: 800, y: 505.6 },
    ],
    aiRationale: {
      algorithm: "Multi-objective A* (Max-Standoff Conservative)",
      heuristics: "Maximizes seaward clearance from pressure ridges and tabular bergs, constraining hull stress to lowest tier.",
      tradeOff: "Accepts +83 NM distance penalty vs Balanced route to guarantee zero multi-year ice exposure and superior safety index (22/100).",
    },
  },
  {
    id: "fuel_efficient",
    name: "Fuel-Efficient",
    tradeOff: "Lowest fuel burn",
    distanceNm: 458,
    etaHours: 41.6,
    fuelTons: 39.8,
    averageRiskScore: 45,
    maxRiskScore: 54,
    compatibility: "high",
    rio: {
      score: 11.5,
      scoreFormatted: "+11.5",
      status: "PASS",
      regulatoryClause: "IMO Polar Code MSC.1/Circ.1519 §2.3 (Authorized Polar Operation)",
      description: "PASS — Optimized bunker profile along moderate ice channels with positive structural safety margin.",
    },
    iceExposure: {
      openWaterPct: 34,
      lightIcePct: 42,
      mediumPackPct: 24,
      heavyRidgePct: 0,
      peakIceConcTenths: 5,
      peakLocation: "Prince Gustav Channel",
      multiYearIceNm: 38,
    },
    waypoints: [
      { id: "wp-fe1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, cumulativeNm: 0, iceConcTenths: 2, speedLimitKn: 12, riskScore: 28, hazardNote: "Favorable tidal stream exit; low initial consumption" },
      { id: "wp-fe2", name: "Prince Gustav Channel", lat: "63.5°S", lon: "58.20°W", distNm: 155, cumulativeNm: 155, iceConcTenths: 5, speedLimitKn: 8, riskScore: 54, hazardNote: "Sheltered passage; moderate drift ice with current assist" },
      { id: "wp-fe3", name: "Larsen Ice Shelf Margin", lat: "64.2°S", lon: "57.00°W", distNm: 140, cumulativeNm: 295, iceConcTenths: 4, speedLimitKn: 8, riskScore: 48, hazardNote: "Skirt along Larsen edge; steady hydrodynamic lead" },
      { id: "wp-fe4", name: "Weddell Outpost Alpha", lat: "65.5°S", lon: "56.00°W", distNm: 163, cumulativeNm: 458, iceConcTenths: 4, speedLimitKn: 9, riskScore: 42, hazardNote: "Direct transit to destination mooring" },
    ],
    pathCoordinates: [
      { x: 505, y: 28.9 },
      { x: 580, y: 216.7 },
      { x: 700, y: 317.8 },
      { x: 800, y: 505.6 },
    ],
    aiRationale: {
      algorithm: "Multi-objective A* (Hydrodynamic Eco-Glide)",
      heuristics: "Optimizes vessel speed and hydrodynamic drag through sheltered leads, utilizing Antarctic surface drift.",
      tradeOff: "Achieves lowest bunker burn (39.8 MT, saving 3.1 MT vs Balanced) with moderate ice transit and comfortable RIO (+11.5).",
    },
  },
  {
    id: "balanced",
    name: "Recommended Balanced",
    tradeOff: "Best trade-off of risk, fuel and time",
    distanceNm: 445,
    etaHours: 37.1,
    fuelTons: 42.9,
    averageRiskScore: 31,
    maxRiskScore: 42,
    compatibility: "high",
    rio: {
      score: 16.8,
      scoreFormatted: "+16.8",
      status: "PASS",
      regulatoryClause: "IMO Polar Code MSC.1/Circ.1519 §2.2 (Authorized Polar Operation)",
      description: "PASS — Authorized polar transit balancing risk avoidance, transit speed, and bunker efficiency.",
    },
    iceExposure: {
      openWaterPct: 48,
      lightIcePct: 34,
      mediumPackPct: 18,
      heavyRidgePct: 0,
      peakIceConcTenths: 4,
      peakLocation: "Joinville Passage",
      multiYearIceNm: 18,
    },
    waypoints: [
      { id: "wp-b1", name: "Maxwell Bay Departure", lat: "62.2°S", lon: "58.95°W", distNm: 0, cumulativeNm: 0, iceConcTenths: 2, speedLimitKn: 12, riskScore: 20, hazardNote: "Standard port departure along surveyed lead" },
      { id: "wp-b2", name: "South Shetland Strait", lat: "63.0°S", lon: "58.70°W", distNm: 85, cumulativeNm: 85, iceConcTenths: 3, speedLimitKn: 10, riskScore: 28, hazardNote: "Light pack with high maneuverability" },
      { id: "wp-b3", name: "Joinville Island Passage", lat: "63.4°S", lon: "58.50°W", distNm: 60, cumulativeNm: 145, iceConcTenths: 4, speedLimitKn: 9, riskScore: 42, hazardNote: "Chokepoint transit with active radar iceberg watch" },
      { id: "wp-b4", name: "Prince Gustav Margin", lat: "64.2°S", lon: "57.50°W", distNm: 115, cumulativeNm: 260, iceConcTenths: 3, speedLimitKn: 9, riskScore: 34, hazardNote: "Stable first-year ice leads along channel boundary" },
      { id: "wp-b5", name: "Snow Hill Island Corridor", lat: "64.6°S", lon: "57.00°W", distNm: 80, cumulativeNm: 340, iceConcTenths: 3, speedLimitKn: 10, riskScore: 32, hazardNote: "Wide navigable corridor skirting multi-year tongue" },
      { id: "wp-b6", name: "Weddell Outpost Alpha", lat: "65.5°S", lon: "56.00°W", distNm: 105, cumulativeNm: 445, iceConcTenths: 3, speedLimitKn: 11, riskScore: 24, hazardNote: "Final approach to outpost offloading zone" },
    ],
    pathCoordinates: [
      { x: 505, y: 28.9 },
      { x: 530, y: 144.4 },
      { x: 550, y: 202.2 },
      { x: 650, y: 317.8 },
      { x: 700, y: 375.6 },
      { x: 800, y: 505.6 },
    ],
    aiRationale: {
      algorithm: "Multi-objective A* (Pareto Frontier Compromise)",
      heuristics: "Balances ice concentration avoidance against transit duration and bunker consumption across PC4 vessel limits.",
      tradeOff: "Recommended default: delivers fastest ETA (37.1 hrs), high POLARIS RIO safety (+16.8), and low risk (31/100).",
    },
  },
];

export const ROUTES = BASELINE_ROUTES;

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
