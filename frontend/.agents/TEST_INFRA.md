# E2E Test Infra: Fordge-Burg Maritime Decision Support System

## Test Philosophy
- Requirement-driven verification covering R1, R2, R3, R4 and system stability.
- Methodology: Boundary value analysis, state transition tests, filtering/sorting verification, export payload structure validation, persistence validation, and production build typechecking.

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 (Smoke) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|-------------|:--------------:|:-----------------:|:----------------------:|
| 1 | Baseline Type Cleanliness & Test Runner | Pre-req | ✓ | ✓ | ✓ |
| 2 | R1: 8-Engine Simulation Animation & Telemetry | R1 | ✓ | ✓ | ✓ |
| 3 | R2: Risk Charts, Filter, Export & Modals | R2 | ✓ | ✓ | ✓ |
| 4 | R3: Settings Simulation Config & Alerts | R3 | ✓ | ✓ | ✓ |
| 5 | R4: Hazard Page Visuals, Map & Usability | R4 | ✓ | ✓ | ✓ |

## Test Architecture
- Runner: Node 22 native test runner or `tsx --test`
- Test files located in `tests/*.test.ts`
- Pass criteria: Zero errors, exit code 0, clean TypeScript type check (`npx tsc --noEmit`), and clean Next.js build (`npm run build`).
