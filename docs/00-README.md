# fordgeBurg Documentation Index

This directory documents the **current, observed functionality** of `/home/dev/Desktop/projects/fordge-burg`. It is written for an AI or engineer who needs to recreate the prototype faithfully, including its limitations and defects.

Excluded as authorities: `design.md`, `PROJECT.md`, `ORIGINAL_REQUEST.md`, `TEST_READY.md`, `TEST_INFRA.md`, and stale `.agents` material. Test files are cited only as executable/observable contracts, not as design authority.

## Identity

- Display brand: `fordgeBurg`
- npm package: `fordge-burg`, version `0.1.0`, private
- Stack: Next.js 16.3.4 App Router, React 19.2.8, TypeScript 5, Tailwind CSS v4
- Nature: client-rendered prototype with deterministic local simulation
- No observed backend, database, API, authentication, persistence, live satellite/AIS/metocean feed, or ML model

## Reading order

1. `01-project-overview.md` — product identity, boundaries, and current blocker
2. `02-feature-specification.md` — routes, features, workflows, inputs/outputs, limitations
3. `03-prd.md` — product requirements for implemented behavior
4. `04-ard.md` — architecture and state/data flow
5. `05-trd.md` — technical recreation specification
6. `06-recreation-guide.md` — empty-folder rebuild procedure
7. `07-source-map.md` — file inventory and responsibilities
8. `08-verification-matrix.md` — test scope, commands, and results

## Current runnable status

`components/layout/AppShell.tsx:12` imports `Sidebar` from `./Sidebar`, but `components/layout/Sidebar.tsx` does not exist. `components/navigation/` exists but is empty. This is a module-resolution build/runtime blocker.

## Test-count reconciliation

- `npm test` runs `node scripts/e2e-audit.mjs`
- Runner scope: 9 inline AC checks plus 6 test files: tier 1–5 and automated code verification
- Runner excludes: `tests/m2_shell_navigation_state.test.mjs` and `tests/m5_routes_risk_reports_settings.test.mjs`
- Observed `npm test`: **117 checks/tests, 98 passed, 19 failed**
- Direct all-on-disk inventory across all 8 `.test.mjs` files: **136 tests, 116 passed, 20 failed**
- Both totals are consistent once runner scope is accounted for.

## Fixed domain counts

- Routes/pages: 11
- Vessels: 5 — two PC2, one PC4, one PC5, one OpenWater
- Missions: 3
- Icebergs: 8
- Hazard zones: 6
- Baseline route alternatives: 4
- Mitigations: 7
- Engine: eight labeled sequential blocks in `src/simulations/engine.ts`
- Map: equirectangular linear mapping onto a 1000×650 SVG viewBox
