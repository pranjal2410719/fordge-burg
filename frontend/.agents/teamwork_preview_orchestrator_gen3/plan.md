# Operational Plan: Frontend UI/UX Enhancements (Gen 3)

## Goal
Deliver remaining requirements R2 (Risk Tab), R3 (Settings Page), R4 (Hazard Page), and Milestone 6 (Full Verification & Hardening) to create a highly polished demo with impressive visuals and 100% verified test passing and production build.

## Milestones & Execution Strategy

### Milestone 3: R2 Risk Tab Functionality
- Features: Native SVG Risk Data Visualizations (Waypoint Risk Exposure Area/Bar chart, Multi-Factor Consequence Radar Diagram, Route Alternatives Risk Comparison), Advanced Filtering & Sorting (status pills, acknowledgment state, keyword search, priority sort), Telemetry Data Export (CSV, JSON, Print), Consequence & Mitigation Modals.
- Code Ownership: `app/risk/page.tsx`, `components/risk/*`
- Dispatch:
  1. Explorers (3) to investigate and design technical blueprints for charts, export/filter mechanisms, and modals.
  2. Worker M3 to implement the features and ensure unit test passing.
  3. Gate Verification: 2 Reviewers, 2 Challengers, 1 Forensic Auditor.

### Milestone 4: R3 Settings Page Redesign
- Features: Simulation configuration options (Monte Carlo iterations, time step speed, dynamic ice drift model, uncertainty margin, auto-resimulate), Alert & Notification preferences (Iceberg CPA standoff, besetment threshold, hazard warning, severe metocean alert, audio chimes), localStorage sync & SSR fallback, Reset Defaults.
- Code Ownership: `app/settings/page.tsx`, `lib/settings.ts`
- Dispatch: Worker M4, Reviewers (2), Challengers (2), Auditor (1).

### Milestone 5: R4 Hazard Page Redesign
- Features: Hero KPI metric strip, interactive spatial Antarctic hazard map, severity filtering & keyword search, Polar Code vessel impact indicators.
- Code Ownership: `app/hazards/page.tsx`, `lib/data.ts`
- Dispatch: Worker M5, Reviewers (2), Challengers (2), Auditor (1).

### Milestone 6: Full Verification, Test Suites Passing & Production Build
- Comprehensive test suite execution (`npm test`), Next.js production build (`npm run build`), Challenger stress verification, and final Forensic Audit.
