## 2026-09-18T13:03:03Z

You are a teamwork_preview_worker implementing Milestone 1: Dynamic Route Overview Across Pathways (Requirement R1).

Working Directory: /home/dev/Desktop/projects/fb/frontend/.agents/teamwork_preview_worker_r2_m1
Project Root: /home/dev/Desktop/projects/fb/frontend
Original User Request: /home/dev/Desktop/projects/fb/frontend/.agents/ORIGINAL_REQUEST.md
Project Specifications & Interface Contracts: /home/dev/Desktop/projects/fb/frontend/.agents/PROJECT.md
Explorer Survey Handoff: /home/dev/Desktop/projects/fb/frontend/.agents/teamwork_preview_explorer_survey_r2_1/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your File Ownership (you exclusively own and may edit these files):
- `lib/data.ts`
- `components/session/MissionContext.tsx`
- `app/routes/page.tsx`
- `app/dashboard/page.tsx`
- `app/reports/page.tsx`
- `components/mission/SimulationTelemetryHud.tsx`
- `tests/route_overview_pathways.test.ts`

Your Mission & Specific Tasks:
1. Review `ORIGINAL_REQUEST.md`, `PROJECT.md`, and the Explorer survey report in `.agents/teamwork_preview_explorer_survey_r2_1/handoff.md`.
2. In `lib/data.ts`:
   - Define interfaces: `RouteWaypoint`, `PolarisRioProfile`, `IceExposureBreakdown`.
   - Extend `RouteAlternative` non-destructively to include `rio: PolarisRioProfile`, `iceExposure: IceExposureBreakdown`, `waypoints: RouteWaypoint[]`, `pathCoordinates: { x: number; y: number }[]`, and `aiRationale: { algorithm: string; heuristics: string; tradeOff: string }`.
   - Populate `BASELINE_ROUTES` with full telemetry for all 4 corridors (`shortest`, `safest`, `fuel_efficient`, `balanced`):
     - Shortest: 412 NM, 38.5h, 48.2 MT, avg risk 74, max risk 88, RIO -3.2 (MARGINAL, IMO Polar Code MSC.1/Circ.1519), peak ice 8/10 (Antarctic Sound), 36% heavy ridge pack, 145 NM multi-year ice, 4 waypoints.
     - Safest: 528 NM, 44.0h, 51.5 MT, avg risk 22, max risk 36, RIO +24.2 (PASS, Maximum Ice Standoff), peak ice 3/10, 0% heavy pack, 0 NM multi-year ice, 5 waypoints.
     - Fuel-Efficient: 458 NM, 41.6h, 39.8 MT, avg risk 45, max risk 54, RIO +11.5 (PASS, Optimized Bunker Profile), peak ice 5/10, 0% heavy pack, 38 NM multi-year ice, 4 waypoints.
     - Balanced: 445 NM, 37.1h, 42.9 MT, avg risk 31, max risk 42, RIO +16.8 (PASS, Authorized Polar Transit), peak ice 4/10, 0% heavy pack, 18 NM multi-year ice, 6 waypoints.
   - Keep existing exports backwards-compatible so existing tests continue to pass.
3. In `components/session/MissionContext.tsx`:
   - Ensure `selectedRouteId` is backed by `sessionStorage` (with SSR-safe hydration check) so active pathway selection is preserved and reflected across navigation tabs and reloads.
   - Ensure `selectedRoute` cleanly exposes all the enriched telemetry.
4. In `app/routes/page.tsx`:
   - Update "Route Comparison Matrix" table to include POLARIS RIO Score and Peak Ice Exposure rows.
   - Add a comprehensive "Selected Pathway Telemetry & Waypoints Breakdown" section:
     - Waypoint schedule table: Waypoint ID, Name, Coordinates (Lat/Lon), Leg Distance, Cumulative Distance, Ice Concentration, Speed Limit, Risk Score, and Hazard Note.
     - Ice Exposure Regime breakdown cards/progress bars (Open Water %, Light Ice %, Medium Pack %, Heavy/Pressure Ridge Ice %, Multi-Year Ice exposure).
     - POLARIS RIO Certification badge/card (score, PASS/MARGINAL status, IMO compliance notes).
   - Make the "Decision Explanation" card dynamic to compare selected pathway telemetry against alternatives.
5. In `app/dashboard/page.tsx`:
   - Update "Route Overview" section to display POLARIS RIO badge, Ice Exposure breakdown (Peak Ice Conc, Pack Ice %), and waypoints summary.
   - Dynamically update "AI Pathfinding Rationale" based on `selectedRoute.aiRationale` or `selectedRoute.id`.
6. In `components/mission/SimulationTelemetryHud.tsx`:
   - Synchronize the HUD's real-time readout (`rioScore`, `icePeak`, `besetmentPct`) with `selectedRoute` so selecting a pathway updates the HUD.
7. In `app/reports/page.tsx`:
   - Update the Waypoints schedule table to display `selectedRoute.waypoints` dynamically.
8. In `tests/route_overview_pathways.test.ts`:
   - Create a comprehensive unit and integration test suite using `tsx --test` verifying:
     - All 4 corridors have complete telemetry, valid waypoints, valid RIO scores and statuses, and ice exposure breakdowns.
     - Changing `selectedRouteId` dynamically updates waypoints, RIO, ice exposure, fuel, and ETA.
     - Physical and regulatory consistency across corridors.
     - Session storage persistence helper logic.
9. Verification:
   - Run `npx tsc --noEmit` and ensure 0 errors.
   - Run `npm test` and ensure all tests pass (including new and existing suites).
   - Document commands and results in your handoff report.
