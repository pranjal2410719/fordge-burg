# Original User Request

## Initial Request — 2026-09-17T17:24:47Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Standard team

Enhance the UI, UX, and animations of the frontend application (mission planner, risk tab, settings, and hazard pages) to create a highly polished demo with impressive visuals. 

Working directory: /home/dev/Desktop/projects/fb/frontend
Integrity mode: development

## Requirements

### R1. Mission Planner Enhancements
Enhance the mission planner page with new visual UX and animations during simulation runs.

### R2. Risk Tab Functionality
Add new charts, data visualizations, advanced filtering/sorting, export functionality, and detailed breakdown modals to the risk tab.

### R3. Settings Page Redesign
Redesign the settings page to include simulation configuration options and notification/alert preferences.

### R4. Hazard Page Redesign
Redesign the UI of the hazard page for better visual appeal and usability.

## Verification Resources
- Use the existing frontend test suites and scripts in the repository to verify the functionality of the updated components.

## Acceptance Criteria

### Visuals and UX
- [ ] Animations in the mission planner run smoothly during simulation.
- [ ] The hazard page layout matches the aesthetic of the rest of the updated application.

### Functionality
- [ ] Risk tab successfully renders new charts and allows filtering/exporting data.
- [ ] Settings page allows toggling simulation configurations and alert preferences.
- [ ] Existing test suites pass successfully for the modified components.

## Follow-up — 2026-09-18T12:52:41Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Standard team

Implement dynamic route overview functionality that reacts in real-time to selected pathways across the `/routes` page and mission overview components, restructure the mission planner to vanish the setup form and transition to a dedicated outcome view with unified triggers in 3 locations, and synchronize risk and mitigation calculations with the selected path.

Working directory: /home/dev/Desktop/projects/fb/frontend
Integrity mode: development

## Requirements

### R1. Dynamic Route Overview Across Pathways
Make the route overview dynamically recalculate, display, and synchronize all telemetry (waypoints, distance in NM, fuel consumption in MT, ETA hours, POLARIS RIO scores, and ice exposure breakdown) across both the dedicated `/routes` page and the in-app route overview components whenever any pathway corridor (Shortest, Safest, Fuel-Efficient, Balanced) is selected.

### R2. Mission Planner Unified Triggers & Vanishing Transition Flow
Implement a multi-stage UI/UX transition flow in `app/mission/page.tsx`:
- Provide unified primary action buttons ("Generate Plan & Run Simulation") in 3 strategic positions (top navigation bar, parameter stepper summary, and sticky bottom action bar) that perform the exact same plan generation and execution action.
- Upon clicking any of these action buttons, the initial configuration view (parameter inputs, scenario selectors) vanishes completely and transitions smoothly into the dedicated outcome view (simulation pipeline, preview map, real-time telemetry HUD, and route reveal cards).
- Include an intuitive "Back / Modify Parameters" control in the outcome view allowing the operator to return to the configuration step at any time.

### R3. Dynamic Risk & Mitigation Real-Time Alignment
Ensure consequence metrics (Besetment, Delay, Fuel Penalty, Route Disruption) and relevant mitigations update in real-time to reflect the specific hazards and geometry of the actively selected pathway.

## Verification Resources
- Use the existing frontend test suites (`npm test`), TypeScript verification (`npx tsc --noEmit`), and production build verification (`npm run build`).

## Acceptance Criteria

### Route Overview Dynamism
- [ ] Selecting any pathway on the `/routes` page or mission overview immediately updates all displayed waypoints, risk levels, fuel projections, and duration stats to match that pathway.
- [ ] Active pathway selection is preserved and reflected across navigation tabs.

### Mission Planner Multi-Stage Transition
- [ ] Three synchronized action buttons exist on the Mission Planner configuration view and trigger the plan execution.
- [ ] The configuration UI vanishes upon clicking the action button, rendering only the outcome and simulation results view.
- [ ] A "Back / Modify Parameters" button restores the configuration view with previously selected parameters intact.

### System Verification
- [ ] `npx tsc --noEmit` completes with 0 type errors.
- [ ] `npm test` passes 100% of test suites.
- [ ] `npm run build` succeeds cleanly generating static pages.
