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

// ─── Consequence Details Map ──────────────────────────────────────────────────

export const CONSEQUENCE_DETAILS_MAP: Record<string, ConsequenceDetailData> = {
  besetment: {
    key: "besetment",
    label: "Besetment Risk Analysis",
    shortDesc: "Decomposition of pack ice compressive forces, lead closure rates, and hull entrapment mechanics.",
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
      "Step down speed to vessel ice limit ceiling 2 NM prior to entering pack boundary to prevent wedging.",
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

// ─── Mitigation SOPs Map ──────────────────────────────────────────────────────

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
