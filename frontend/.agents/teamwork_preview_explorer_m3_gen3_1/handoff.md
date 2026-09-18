# Handoff Report: Native SVG Risk Data Visualizations & Charts Architecture (Milestone 3)

**Author**: `teamwork_preview_explorer_m3_gen3_1` (Risk Charts Explorer)  
**Target Milestone**: Milestone 3 (Requirement R2: Risk Tab Functionality)  
**Parent Conversation ID**: `49650037-4209-4e6a-af88-63e25a17dc99`  
**Date**: 2026-09-18  

---

## 1. Observation

Direct examination of the frontend repository revealed the following baseline state and structural assets:

1. **Current Risk Page (`app/risk/page.tsx:1-170`)**:
   - Lines 36–41 define a static 4-item consequence array (`besetment`, `delay`, `fuel`, `disruption`).
   - Lines 62–75 render basic percentage bars (`h-1.5 rounded-full`) inside cards.
   - Lines 78–159 render a 7-item mitigation checklist with a basic 36×36 SVG progress ring (`lines 87-96`).
   - **Critical Gap**: No charts or data visualizations exist on `app/risk/page.tsx`. There is no waypoint risk curve, no multi-factor radar/spider diagram, no comparative route alternatives visualization, no interactive tooltip scrubber, and no filtering/export capabilities.

2. **Core Data Models & Defaults (`lib/data.ts:28-85`)**:
   - Lines 28–38 define `RouteAlternative` with `distanceNm`, `etaHours`, `fuelTons`, `averageRiskScore`, `maxRiskScore`, and `compatibility`.
   - Lines 54–59 define 4 baseline routes:
     - `balanced` ("Recommended Balanced" / Route Alpha): 445 NM, 37.1 hrs, 42.9 MT, avg risk 31, max risk 42.
     - `safest` ("Safest" / Route Bravo): 528 NM, 44.0 hrs, 51.5 MT, avg risk 22, max risk 36.
     - `fuel_efficient` ("Fuel-Efficient" / Route Charlie): 458 NM, 41.6 hrs, 39.8 MT, avg risk 45, max risk 54.
     - `shortest` ("Shortest" / Route Delta): 412 NM, 38.5 hrs, 48.2 MT, avg risk 74, max risk 88.
   - Lines 61–76 define 7 tactical mitigations (`m1` to `m7`).
   - Interface contracts in `PROJECT.md:65-88` define `ConsequenceDetail` and `WaypointRiskPoint` (`id`, `name`, `lat`, `lon`, `distNm`, `iceConc`, `riskScore`, `besetmentRisk`).

3. **Styling & Design System (`app/globals.css:1-85`)**:
   - Configured via Tailwind CSS v4 `@theme`.
   - Navy palette: `--color-navy-950` (`#050d1a`), `--color-navy-900` (`#0a1930`), `--color-navy-800` (`#122040`), `--color-navy-700` (`#1a2e58`).
   - Accent Blues: `--color-blue-600` (`#1e6fd9`), `--color-blue-500` (`#2e86f5`), `--color-blue-400` (`#5aa3f7`), `--color-blue-100` (`#dbeafe`), `--color-blue-50` (`#eff6ff`).
   - Tri-color Risk tokens:
     - Low: `--color-risk-low` (`#1e8449`), `--color-risk-low-bg` (`#f0fdf4`)
     - Moderate: `--color-risk-med` (`#d4910a`), `--color-risk-med-bg` (`#fffbeb`)
     - High: `--color-risk-high` (`#c0392b`), `--color-risk-high-bg` (`#fef2f2`)
   - Fonts: Inter (`--font-sans`), JetBrains Mono (`--font-mono`).

4. **Reference SVG Patterns (`components/map/SimpleMap.tsx` and `components/mission/SimulationPreviewMap.tsx`)**:
   - Pure native SVG implementations with `viewBox`, `<defs>` patterns, linear and radial gradients, `<text font-mono>`, interactive coordinate tracking, and responsive layout wrappers (`h-auto w-full` and `h-full w-full`).
   - Zero external charting libraries (e.g. no recharts, chart.js, or d3-bundle), satisfying React 19 compatibility and zero-dependency constraints.

---

## 2. Logic Chain

From the observations and Milestone 3 specifications, the design logic flows as follows:

```
[Requirement R2: Risk Tab Visualizations]
   │
   ├─► 1. Waypoint Risk Exposure Profile
   │      │
   │      ├─► 8 Waypoints (WP-01 Departure to WP-08 Destination)
   │      ├─► Dual Series: Overall Risk Score (0-100) + Besetment Probability (0-100%)
   │      ├─► Smooth cubic Bezier spline interpolation with area fill gradient
   │      ├─► Tri-color threshold bands (0-35 Low, 35-65 Moderate, 65-100 High)
   │      ├─► View Switcher: "Smooth Area Curve" vs "Stepped Segment Bars"
   │      └─► Interactive hover scrubber vertical rule + floating telemetry tooltip
   │
   ├─► 2. Multi-Factor Risk Radar / Spider Diagram
   │      │
   │      ├─► 6 Antarctic Polar Risk Axes:
   │      │    [Hull Stress, Machinery Cold, Metocean/Wind, Ice Besetment, Crew Fatigue, Navigation Error]
   │      ├─► Concentric equilateral hexagon grid at 20%, 40%, 60%, 80%, 100%
   │      ├─► 65% Critical Threshold ring highlighted in amber/red dash
   │      ├─► Route- and Vessel-sensitive factor scoring (e.g. OpenWater vs PC2 hull stress)
   │      ├─► Glowing accent strokes (drop shadow filter + semi-transparent fill)
   │      └─► Hover vertex inspection showing contributory variables & Polar Code clauses
   │
   ├─► 3. Route Alternatives Risk Comparison
   │      │
   │      ├─► 4 Baseline Routes (Alpha: Balanced, Bravo: Safest, Charlie: Fuel, Delta: Shortest)
   │      ├─► Horizontal dumbbell range visual: [Average Risk ──── Peak Waypoint Risk]
   │      ├─► POLARIS RIO index compliance pills (+24.2 Safest, +16.8 Balanced, +11.5 Charlie, -3.2 Delta)
   │      ├─► Multi-metric comparison: Distance (NM), Duration (hrs), Fuel (MT), Risk Spread
   │      └─► Direct click-to-activate route selector connected to useMission()
   │
   └─► 4. Modular Component Architecture
          │
          ├─► `components/risk/RiskCharts.tsx` (Tabbed container & controller)
          ├─► `components/risk/WaypointRiskChart.tsx` (SVG Profile Area/Bar chart)
          ├─► `components/risk/RiskRadarChart.tsx` (6-axis SVG Radar chart)
          ├─► `components/risk/RouteRiskComparison.tsx` (4-route matrix & dumbbell visual)
          └─► `lib/riskData.ts` (Structured waypoint telemetry & radar factor matrices)
```

---

## 3. Caveats

1. **No External Charting Libraries**: The project uses React 19 (`react@19.0.0`). Many third-party charting packages (e.g., older versions of Recharts) fail during React 19 hydration or peer dependency resolution. Pure SVG rendering guarantees 100% hydration safety, zero bundle bloat, and complete design-token alignment.
2. **Fixed Antarctic Bounding Box**: Waypoints must map to real geographic points between Maxwell Bay (`-62.2°S, -58.95°W`) and Weddell Outpost Alpha (`-65.5°S, -56.0°W`) to remain coherent with `coordToSvg` and `SimpleMap`.
3. **Bezier Curve Overshoot Prevention**: Standard Catmull-Rom or cubic splines can mathematically overshoot above 100 or below 0 on steep gradients. The interpolation algorithm must clamp control points strictly between the chart's upper and lower pixel limits.
4. **Mobile & Viewport Responsiveness**: All SVG containers must use responsive `viewBox` coordinates with `vectorEffect="non-scaling-stroke"` and relative CSS flex/grid wrappers to render crisply on both desktop and mobile viewports.

---

## 4. Conclusion

Milestone 3 should implement a dedicated, modular suite in `components/risk/` that elevates `app/risk/page.tsx` into a mission-grade Polar Navigation Risk Operations Center. 

The three primary native SVG visualizations will provide:
1. **Longitudinal Voyage Insight**: Waypoint-by-waypoint risk and ice besetment curves.
2. **Multi-Dimensional Operational Awareness**: 6-axis Polar Code consequence radar.
3. **Strategic Route Trade-off Analysis**: 4-route comparison with POLARIS RIO regulatory ratings.

---

## 5. Detailed Specifications & Implementation Plan

### A. Mathematical Formulations

#### 1. Waypoint Risk Exposure Profile (Area & Line Math)
- **ViewBox**: `0 0 800 280`
- **Padding**: `top = 35`, `bottom = 45`, `left = 55`, `right = 35`
- **Plot Dimensions**: 
  - $\text{plotW} = 800 - 55 - 35 = 710$
  - $\text{plotH} = 280 - 35 - 45 = 200$
- **X Coordinate Transformation** (for waypoint index $i \in [0, 7]$):
  $$x_i = \text{left} + i \cdot \frac{\text{plotW}}{N - 1} = 55 + i \cdot \frac{710}{7} \approx 55 + i \cdot 101.43$$
- **Y Coordinate Transformation** (for score $s \in [0, 100]$):
  $$y(s) = \text{top} + \text{plotH} \cdot \left(1 - \frac{s}{100}\right) = 35 + 200 \cdot (1 - 0.01 \cdot s) = 235 - 2 \cdot s$$
  - Score $0 \implies y = 235$ (Baseline axis)
  - Score $35$ (Low threshold) $\implies y = 165$
  - Score $65$ (Moderate threshold) $\implies y = 105$
  - Score $100$ (Maximum risk) $\implies y = 35$
- **Monotone Cubic Spline Path Generation**:
  For consecutive points $P_i(x_i, y_i)$ and $P_{i+1}(x_{i+1}, y_{i+1})$:
  $$\Delta x = x_{i+1} - x_i$$
  Control points:
  $$C_{1, i} = \left(x_i + \frac{\Delta x}{2.5}, \ \text{clamp}(y_i + m_i \cdot \frac{\Delta x}{3}, 35, 235)\right)$$
  $$C_{2, i} = \left(x_{i+1} - \frac{\Delta x}{2.5}, \ \text{clamp}(y_{i+1} - m_{i+1} \cdot \frac{\Delta x}{3}, 35, 235)\right)$$
  Where $m_i = \frac{y_{i+1} - y_{i-1}}{x_{i+1} - x_{i-1}}$ (central difference, $m_0 = \frac{y_1 - y_0}{x_1 - x_0}$, $m_7 = \frac{y_7 - y_6}{x_7 - x_6}$).
  - Curve Path: `d="M x0,y0 C cp1x,cp1y cp2x,cp2y x1,y1 ..."`
  - Shaded Area Path: `d="M x0,235 L x0,y0 [curves to x7,y7] L x7,235 Z"`

#### 2. Multi-Factor Risk Radar Diagram (Hexagonal Spider Math)
- **ViewBox**: `0 0 360 360`
- **Center**: $(cx, cy) = (180, 180)$
- **Max Radius**: $R = 120$ px
- **Label Radius**: $R_{\text{label}} = 146$ px
- **Number of Factors**: $K = 6$
- **Angles** (starting at top apex $-90^\circ$ and moving clockwise by $60^\circ$ / $\frac{\pi}{3}$ rad):
  $$\theta_k = -\frac{\pi}{2} + k \cdot \frac{\pi}{3}, \quad k \in \{0, 1, 2, 3, 4, 5\}$$
  Exact Trigonometric Values:
  | Axis ($k$) | Factor Label | Angle $\theta_k$ | $\cos\theta_k$ | $\sin\theta_k$ | Vertex Coord for Radius $r$ | Text Anchor |
  |---|---|---|---|---|---|---|
  | 0 | Hull Stress | $-90^\circ$ | $0$ | $-1$ | $(cx, cy - r)$ | `middle` |
  | 1 | Machinery Cold | $-30^\circ$ | $+\frac{\sqrt{3}}{2} \approx 0.866$ | $-0.5$ | $(cx + 0.866r, cy - 0.5r)$ | `start` |
  | 2 | Metocean / Wind | $+30^\circ$ | $+\frac{\sqrt{3}}{2} \approx 0.866$ | $+0.5$ | $(cx + 0.866r, cy + 0.5r)$ | `start` |
  | 3 | Ice Besetment | $+90^\circ$ | $0$ | $+1$ | $(cx, cy + r)$ | `middle` |
  | 4 | Crew Fatigue | $+150^\circ$ | $-\frac{\sqrt{3}}{2} \approx -0.866$ | $+0.5$ | $(cx - 0.866r, cy + 0.5r)$ | `end` |
  | 5 | Navigation Error | $+210^\circ$ | $-\frac{\sqrt{3}}{2} \approx -0.866$ | $-0.5$ | $(cx - 0.866r, cy - 0.5r)$ | `end` |

- **Concentric Grid Polygons**:
  For levels $L \in \{0.20, 0.40, 0.60, 0.80, 1.00\}$:
  $r_L = R \cdot L$
  Vertices: $V_{k, L} = (cx + r_L \cos\theta_k, cy + r_L \sin\theta_k)$
- **Warning Ring**:
  $L = 0.65 \implies r_{0.65} = 120 \cdot 0.65 = 78$ px. Rendered with `stroke="#c0392b"` and `strokeDasharray="3 3"` to denote the IMO Polar Code elevated consequence threshold.
- **Factor Score Mapping**:
  For factor score $s_k \in [0, 100]$:
  $$r_k = R \cdot \left(\frac{s_k}{100}\right)$$
  $$P_k = \left(cx + R \cdot \frac{s_k}{100} \cdot \cos\theta_k, \ cy + R \cdot \frac{s_k}{100} \cdot \sin\theta_k\right)$$

---

### B. Proposed Data Structures (`lib/riskData.ts`)

```typescript
import { RouteId } from "@/lib/data";

export interface WaypointRiskPoint {
  id: string;
  name: string;
  lat: string;
  lon: string;
  distNm: number;
  iceConc: number;       // Tenths: 0 to 10
  riskScore: number;     // 0 to 100
  besetmentRisk: number; // 0 to 100%
  iceThicknessM: number;
  ridgeFrequency: string; // e.g. "Low", "Moderate", "Severe"
}

export interface RadarFactor {
  key: string;
  name: string;
  code: string;
  polarCodeClause: string;
  description: string;
}

export const RADAR_FACTORS: RadarFactor[] = [
  { key: "hullStress", name: "Hull Stress", code: "HUL-01", polarCodeClause: "Part I-A §3.2 (Structural Integrity)", description: "Dynamic compression and collision energy on ice belt" },
  { key: "machineryCold", name: "Machinery Cold", code: "ENG-02", polarCodeClause: "Part I-A §6.3 (Cold Temperature Systems)", description: "Sea chest freezing, ballast valve icing, lubricant viscosity" },
  { key: "metocean", name: "Metocean / Wind", code: "MET-03", polarCodeClause: "Part I-A §11.3 (Severe Weather)", description: "Gale force katabatic winds, freezing spray, superstructure icing" },
  { key: "besetment", name: "Ice Besetment", code: "ICE-04", polarCodeClause: "Part I-A §4.1 (Safe Navigation in Ice)", description: "Convergent ice drift pressure trapping vessel in pack" },
  { key: "crewFatigue", name: "Crew Fatigue", code: "HUM-05", polarCodeClause: "STCW Section A-VIII/1 (Fatigue Management)", description: "Sub-zero continuous radar watch and high-concentration navigation" },
  { key: "navigationError", name: "Navigation Error", code: "NAV-06", polarCodeClause: "Part I-A §9.2 (Navigational Equipment)", description: "Magnetic compass degradation and uncharted bathymetric shoals" },
];

export const WAYPOINT_RISK_DATA: Record<RouteId, WaypointRiskPoint[]> = {
  balanced: [
    { id: "WP-01", name: "Maxwell Bay Dep.", lat: "62.20°S", lon: "58.95°W", distNm: 0, iceConc: 1, riskScore: 12, besetmentRisk: 8, iceThicknessM: 0.3, ridgeFrequency: "None" },
    { id: "WP-02", name: "Bransfield Strait", lat: "63.00°S", lon: "58.70°W", distNm: 58, iceConc: 2, riskScore: 18, besetmentRisk: 14, iceThicknessM: 0.5, ridgeFrequency: "Low" },
    { id: "WP-03", name: "Gustav Channel App.", lat: "63.40°S", lon: "58.50°W", distNm: 122, iceConc: 4, riskScore: 28, besetmentRisk: 22, iceThicknessM: 0.8, ridgeFrequency: "Moderate" },
    { id: "WP-04", name: "Erebus Gulf Ridge", lat: "64.20°S", lon: "57.50°W", distNm: 198, iceConc: 6, riskScore: 42, besetmentRisk: 38, iceThicknessM: 1.2, ridgeFrequency: "High" },
    { id: "WP-05", name: "James Ross Passage", lat: "64.60°S", lon: "57.00°W", distNm: 264, iceConc: 5, riskScore: 35, besetmentRisk: 30, iceThicknessM: 1.0, ridgeFrequency: "Moderate" },
    { id: "WP-06", name: "Larsen Inlet North", lat: "65.00°S", lon: "56.60°W", distNm: 332, iceConc: 4, riskScore: 29, besetmentRisk: 24, iceThicknessM: 0.9, ridgeFrequency: "Moderate" },
    { id: "WP-07", name: "Seal Nunataks Run", lat: "65.30°S", lon: "56.30°W", distNm: 395, iceConc: 3, riskScore: 22, besetmentRisk: 16, iceThicknessM: 0.6, ridgeFrequency: "Low" },
    { id: "WP-08", name: "Outpost Alpha Arr.", lat: "65.50°S", lon: "56.00°W", distNm: 445, iceConc: 2, riskScore: 15, besetmentRisk: 10, iceThicknessM: 0.4, ridgeFrequency: "Low" },
  ],
  safest: [
    { id: "WP-01", name: "Maxwell Bay Dep.", lat: "62.20°S", lon: "58.95°W", distNm: 0, iceConc: 1, riskScore: 8, besetmentRisk: 5, iceThicknessM: 0.2, ridgeFrequency: "None" },
    { id: "WP-02", name: "Westward Arc Pt 1", lat: "62.80°S", lon: "60.20°W", distNm: 74, iceConc: 1, riskScore: 12, besetmentRisk: 8, iceThicknessM: 0.3, ridgeFrequency: "None" },
    { id: "WP-03", name: "Boyd Strait Passage", lat: "63.00°S", lon: "61.00°W", distNm: 156, iceConc: 2, riskScore: 18, besetmentRisk: 12, iceThicknessM: 0.4, ridgeFrequency: "Low" },
    { id: "WP-04", name: "Gerlache Clearing", lat: "63.80°S", lon: "60.30°W", distNm: 242, iceConc: 3, riskScore: 24, besetmentRisk: 16, iceThicknessM: 0.5, ridgeFrequency: "Low" },
    { id: "WP-05", name: "Antarctic Sound Flank", lat: "64.50°S", lon: "59.50°W", distNm: 328, iceConc: 4, riskScore: 36, besetmentRisk: 28, iceThicknessM: 0.8, ridgeFrequency: "Moderate" },
    { id: "WP-06", name: "Shelf Standoff 15NM", lat: "65.00°S", lon: "58.00°W", distNm: 405, iceConc: 3, riskScore: 28, besetmentRisk: 20, iceThicknessM: 0.6, ridgeFrequency: "Low" },
    { id: "WP-07", name: "Eastward Approach", lat: "65.30°S", lon: "57.00°W", distNm: 472, iceConc: 2, riskScore: 18, besetmentRisk: 12, iceThicknessM: 0.5, ridgeFrequency: "Low" },
    { id: "WP-08", name: "Outpost Alpha Arr.", lat: "65.50°S", lon: "56.00°W", distNm: 528, iceConc: 1, riskScore: 12, besetmentRisk: 8, iceThicknessM: 0.3, ridgeFrequency: "None" },
  ],
  fuel_efficient: [
    { id: "WP-01", name: "Maxwell Bay Dep.", lat: "62.20°S", lon: "58.95°W", distNm: 0, iceConc: 1, riskScore: 10, besetmentRisk: 8, iceThicknessM: 0.3, ridgeFrequency: "None" },
    { id: "WP-02", name: "Strait Midline", lat: "62.90°S", lon: "58.40°W", distNm: 62, iceConc: 2, riskScore: 22, besetmentRisk: 16, iceThicknessM: 0.5, ridgeFrequency: "Low" },
    { id: "WP-03", name: "Trinity Chokepoint", lat: "63.50°S", lon: "58.20°W", distNm: 135, iceConc: 4, riskScore: 38, besetmentRisk: 28, iceThicknessM: 0.8, ridgeFrequency: "Moderate" },
    { id: "WP-04", name: "Prince Gustav Drift", lat: "63.90°S", lon: "57.60°W", distNm: 204, iceConc: 5, riskScore: 50, besetmentRisk: 42, iceThicknessM: 1.1, ridgeFrequency: "High" },
    { id: "WP-05", name: "Robertson Bay Arc", lat: "64.20°S", lon: "57.00°W", distNm: 275, iceConc: 6, riskScore: 54, besetmentRisk: 46, iceThicknessM: 1.3, ridgeFrequency: "High" },
    { id: "WP-06", name: "Larsen Boundary", lat: "64.80°S", lon: "56.60°W", distNm: 348, iceConc: 5, riskScore: 46, besetmentRisk: 38, iceThicknessM: 1.0, ridgeFrequency: "Moderate" },
    { id: "WP-07", name: "Fast Ice Transition", lat: "65.20°S", lon: "56.20°W", distNm: 410, iceConc: 4, riskScore: 32, besetmentRisk: 24, iceThicknessM: 0.7, ridgeFrequency: "Low" },
    { id: "WP-08", name: "Outpost Alpha Arr.", lat: "65.50°S", lon: "56.00°W", distNm: 458, iceConc: 2, riskScore: 20, besetmentRisk: 14, iceThicknessM: 0.4, ridgeFrequency: "Low" },
  ],
  shortest: [
    { id: "WP-01", name: "Maxwell Bay Dep.", lat: "62.20°S", lon: "58.95°W", distNm: 0, iceConc: 2, riskScore: 15, besetmentRisk: 10, iceThicknessM: 0.4, ridgeFrequency: "Low" },
    { id: "WP-02", name: "Nelson Strait Cut", lat: "62.70°S", lon: "58.30°W", distNm: 52, iceConc: 4, riskScore: 38, besetmentRisk: 30, iceThicknessM: 0.8, ridgeFrequency: "Moderate" },
    { id: "WP-03", name: "Antarctic Sound Core", lat: "63.10°S", lon: "57.80°W", distNm: 114, iceConc: 7, riskScore: 68, besetmentRisk: 58, iceThicknessM: 1.5, ridgeFrequency: "Severe" },
    { id: "WP-04", name: "Heavy Pressure Ridge", lat: "63.50°S", lon: "57.50°W", distNm: 180, iceConc: 9, riskScore: 88, besetmentRisk: 82, iceThicknessM: 2.2, ridgeFrequency: "Severe" },
    { id: "WP-05", name: "Weddell Pack Interior", lat: "64.10°S", lon: "57.00°W", distNm: 248, iceConc: 8, riskScore: 84, besetmentRisk: 78, iceThicknessM: 1.9, ridgeFrequency: "Severe" },
    { id: "WP-06", name: "Larsen Compression Zone", lat: "64.70°S", lon: "56.60°W", distNm: 312, iceConc: 8, riskScore: 78, besetmentRisk: 72, iceThicknessM: 1.7, ridgeFrequency: "Severe" },
    { id: "WP-07", name: "Consolidated Floes", lat: "65.10°S", lon: "56.30°W", distNm: 368, iceConc: 6, riskScore: 62, besetmentRisk: 54, iceThicknessM: 1.3, ridgeFrequency: "High" },
    { id: "WP-08", name: "Outpost Alpha Arr.", lat: "65.50°S", lon: "56.00°W", distNm: 412, iceConc: 4, riskScore: 45, besetmentRisk: 36, iceThicknessM: 0.9, ridgeFrequency: "Moderate" },
  ],
};

export const ROUTE_RADAR_PROFILES: Record<RouteId, Record<string, number>> = {
  balanced: {
    hullStress: 38,
    machineryCold: 32,
    metocean: 40,
    besetment: 35,
    crewFatigue: 28,
    navigationError: 25,
  },
  safest: {
    hullStress: 20,
    machineryCold: 25,
    metocean: 28,
    besetment: 18,
    crewFatigue: 36, // Slightly elevated due to 44hr duration
    navigationError: 18,
  },
  fuel_efficient: {
    hullStress: 48,
    machineryCold: 38,
    metocean: 45,
    besetment: 46,
    crewFatigue: 34,
    navigationError: 30,
  },
  shortest: {
    hullStress: 86,
    machineryCold: 72,
    metocean: 68,
    besetment: 84,
    crewFatigue: 58,
    navigationError: 52,
  },
};

export const ROUTE_COMPARISONS = [
  {
    id: "balanced" as RouteId,
    name: "Route Alpha (Balanced)",
    badge: "Recommended",
    avgRisk: 31,
    maxRisk: 42,
    distanceNm: 445,
    etaHours: 37.1,
    fuelTons: 42.9,
    rioIndex: "+16.8",
    rioStatus: "PASS",
    polarCodeDecision: "Authorized Polar Transit",
    riskCategory: "LOW",
    accentColor: "#1e6fd9",
  },
  {
    id: "safest" as RouteId,
    name: "Route Bravo (Safest)",
    badge: "Max Safety",
    avgRisk: 22,
    maxRisk: 36,
    distanceNm: 528,
    etaHours: 44.0,
    fuelTons: 51.5,
    rioIndex: "+24.2",
    rioStatus: "PASS",
    polarCodeDecision: "Maximum Standoff Clearance",
    riskCategory: "LOW",
    accentColor: "#1e8449",
  },
  {
    id: "fuel_efficient" as RouteId,
    name: "Route Charlie (Fast/Fuel)",
    badge: "Bunker Saver",
    avgRisk: 45,
    maxRisk: 54,
    distanceNm: 458,
    etaHours: 41.6,
    fuelTons: 39.8,
    rioIndex: "+11.5",
    rioStatus: "PASS",
    polarCodeDecision: "Speed Restricted Transit",
    riskCategory: "MODERATE",
    accentColor: "#d4910a",
  },
  {
    id: "shortest" as RouteId,
    name: "Route Delta (Direct/Short)",
    badge: "High Hazard",
    avgRisk: 74,
    maxRisk: 88,
    distanceNm: 412,
    etaHours: 38.5,
    fuelTons: 48.2,
    rioIndex: "-3.2",
    rioStatus: "MARGINAL",
    polarCodeDecision: "Icebreaker Escort Required",
    riskCategory: "HIGH",
    accentColor: "#c0392b",
  },
];
```

---

### C. Modular Component Architecture

```
components/risk/
├── RiskCharts.tsx               # Primary tabbed container & controls
├── WaypointRiskChart.tsx        # 8-waypoint SVG Area/Bar chart with hover scrubber
├── RiskRadarChart.tsx           # 6-axis SVG Spider/Radar chart with concentric rings
├── RouteRiskComparison.tsx      # 4-route matrix with dumbbell range bars & RIO index
├── RiskExportModal.tsx          # Export handlers for CSV, JSON, and Print summary
└── ConsequenceModal.tsx         # Detailed factor decomposition dialog
```

#### 1. `components/risk/RiskCharts.tsx`
- **Responsibilities**:
  - Acts as the main visual deck at the top of `app/risk/page.tsx`.
  - Provides a 4-mode view switcher:
    - `"all"`: Comprehensive 2-column layout showing the Waypoint Profile and Radar side-by-side, with Route Comparison below.
    - `"profile"`: Focused full-width Waypoint Risk Exposure Profile.
    - `"radar"`: Focused Multi-Factor Consequence Radar with interactive factor inspector.
    - `"comparison"`: Focused 4-Route Alternative Matrix.
  - Connects to `useMission()` to retrieve `selectedRouteId` and `vessel`.

#### 2. `components/risk/WaypointRiskChart.tsx`
- **Features**:
  - View switcher: Smooth Area Curve vs Stepped Segment Bars.
  - Series toggle checkboxes:
    - `[x] Overall Risk (0–100)` (Emerald/Amber/Crimson gradient area fill).
    - `[x] Besetment Risk (%)` (Violet/Blue dotted line with circular markers).
  - SVG Gridlines with Y-axis markers at `0`, `20`, `35` (Low/Mod line), `65` (Mod/High line), and `100`.
  - Zone watermark labels: `LOW (<35)`, `MODERATE (35-65)`, `HIGH (>65)`.
  - Interactive hover state:
    - Moving mouse over SVG calculates nearest waypoint index $i = \text{round}\left(\frac{x - 55}{101.43}\right)$.
    - Snaps vertical scrubber guideline at $x_i$.
    - Renders floating telemetry tooltip card detailing:
      - Waypoint ID & Name (e.g. `WP-04: Erebus Gulf Ridge`)
      - Coordinates: `64.20°S, 57.50°W`
      - Cumulative Distance: `198 NM`
      - Sea Ice Concentration: `6/10 tenths`
      - Ice Thickness: `1.2 m`
      - Overall Risk: `42/100` (Moderate)
      - Besetment Probability: `38%`
      - Ridge Frequency: `High`

#### 3. `components/risk/RiskRadarChart.tsx`
- **Features**:
  - Pure SVG equilateral polygon rendering with 5 concentric threshold rings (20%, 40%, 60%, 80%, 100%).
  - Highlighted 65% warning boundary ring in dashed red stroke.
  - Dynamic hull factor penalty calculation:
    ```typescript
    const vesselPenalty = vessel.iceClass === "OpenWater" ? 1.4 : vessel.iceClass === "PC5" ? 1.15 : 1.0;
    ```
  - Glowing polygon outline with `filter="url(#radar-glow)"` and semi-transparent radial accent fill.
  - Axis labels with clickable / hoverable vertices:
    - Selecting a factor opens an inline inspector badge showing the contributing Polar Code regulation (e.g. `IMO Polar Code Part I-A §3.2`) and mitigation recommendation.
  - Optional benchmark overlay toggle: Compare selected route with `safest` route polygon as a dashed green reference.

#### 4. `components/risk/RouteRiskComparison.tsx`
- **Features**:
  - Renders all 4 baseline routes side-by-side in an operational comparison grid.
  - SVG Dumbbell / Range Bar for each route:
    - Horizontal scale from 0 to 100.
    - Shaded pill from $\text{avgRisk}$ to $\text{maxRisk}$.
    - Left circle marker for $\text{avgRisk}$ and right diamond marker for $\text{maxRisk}$.
  - POLARIS RIO (Risk Index Outcome) metric card:
    - Displays RIO score: $+24.2$ (Green / Authorized), $+16.8$ (Blue / Authorized), $+11.5$ (Amber / Speed-Restricted), $-3.2$ (Red / Escort Required).
  - Direct "Activate Route" button allowing the navigator to switch the entire application session to that route directly from the risk tab.

---

### D. Verification Method & Test Specifications

To verify the charting components independently, the test suite `tests/risk_charts.test.ts` should be created with the following test cases:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WAYPOINT_RISK_DATA, ROUTE_RADAR_PROFILES, ROUTE_COMPARISONS } from '../lib/riskData';
import { BASELINE_ROUTES } from '../lib/data';

describe('Milestone 3: Native SVG Risk Visualizations Verification', () => {
  describe('Waypoint Risk Dataset Integrity', () => {
    it('contains exactly 8 waypoints for all 4 baseline routes', () => {
      const routes = ['balanced', 'safest', 'fuel_efficient', 'shortest'] as const;
      for (const rId of routes) {
        const wps = WAYPOINT_RISK_DATA[rId];
        assert.ok(wps, `Missing waypoints for route ${rId}`);
        assert.strictEqual(wps.length, 8, `Route ${rId} must have 8 waypoints`);

        // Monotonic distance increase
        for (let i = 1; i < wps.length; i++) {
          assert.ok(wps[i].distNm > wps[i-1].distNm, `Distance must monotonically increase at ${wps[i].id}`);
        }

        // Bounded risk scores [0..100]
        for (const wp of wps) {
          assert.ok(wp.riskScore >= 0 && wp.riskScore <= 100, `Risk score out of bounds: ${wp.riskScore}`);
          assert.ok(wp.besetmentRisk >= 0 && wp.besetmentRisk <= 100, `Besetment risk out of bounds: ${wp.besetmentRisk}`);
          assert.ok(wp.iceConc >= 0 && wp.iceConc <= 10, `Ice concentration tenths out of bounds: ${wp.iceConc}`);
        }
      }
    });

    it('peak waypoint risk score matches maxRiskScore in BASELINE_ROUTES', () => {
      for (const route of BASELINE_ROUTES) {
        const wps = WAYPOINT_RISK_DATA[route.id];
        const peakWpRisk = Math.max(...wps.map(w => w.riskScore));
        assert.strictEqual(peakWpRisk, route.maxRiskScore, `Peak WP risk must equal route maxRiskScore for ${route.id}`);
      }
    });
  });

  describe('Radar Diagram Geometry & Trigonometry', () => {
    it('verifies 6-axis equilateral symmetry and angle partitioning', () => {
      const cx = 180, cy = 180, R = 120;
      for (let k = 0; k < 6; k++) {
        const theta = -Math.PI / 2 + (k * Math.PI) / 3;
        const x = cx + R * Math.cos(theta);
        const y = cy + R * Math.sin(theta);

        // Distance from center must equal R exactly
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        assert.ok(Math.abs(dist - R) < 1e-6, `Radius distance deviation at axis ${k}`);
      }
    });

    it('verifies radar factor scores are bounded between 0 and 100 for all routes', () => {
      for (const [rId, factors] of Object.entries(ROUTE_RADAR_PROFILES)) {
        const factorKeys = ['hullStress', 'machineryCold', 'metocean', 'besetment', 'crewFatigue', 'navigationError'];
        for (const key of factorKeys) {
          assert.ok(typeof factors[key] === 'number', `Missing factor ${key} in ${rId}`);
          assert.ok(factors[key] >= 0 && factors[key] <= 100, `Factor ${key} out of range in ${rId}`);
        }
      }
    });
  });

  describe('Route Risk Comparison Matrix', () => {
    it('contains all 4 routes with valid POLARIS RIO ratings and dumbbell spans', () => {
      assert.strictEqual(ROUTE_COMPARISONS.length, 4);
      for (const rc of ROUTE_COMPARISONS) {
        assert.ok(rc.maxRisk >= rc.avgRisk, `Max risk must be >= average risk for ${rc.id}`);
        assert.ok(rc.rioIndex.startsWith('+') || rc.rioIndex.startsWith('-'), `RIO must have sign prefix: ${rc.rioIndex}`);
      }
    });
  });
});
```

---

## 6. Next Steps for Implementation Worker

1. **Step 1**: Create `lib/riskData.ts` with the complete typed mock telemetry and factor definitions documented in Section 5.B.
2. **Step 2**: Implement `components/risk/WaypointRiskChart.tsx` with dual series (Risk Area + Besetment line) and interactive hover tooltip.
3. **Step 3**: Implement `components/risk/RiskRadarChart.tsx` with 6-axis equilateral geometry, concentric threshold rings, and factor inspector.
4. **Step 4**: Implement `components/risk/RouteRiskComparison.tsx` with dumbbell range visual and POLARIS RIO indicators.
5. **Step 5**: Assemble `components/risk/RiskCharts.tsx` tabbed container and embed it into `app/risk/page.tsx`.
6. **Step 6**: Run `npm test` and `npm run build` to verify clean compilation and full test passage.
