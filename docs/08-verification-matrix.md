# 08 — Verification Matrix

## Test command

- Declared command: `npm test`
- Executed command: `node scripts/e2e-audit.mjs`
- Framework: Node.js native `node:test`
- No external test dependencies observed

## Runner scope

`scripts/e2e-audit.mjs` executes:

1. Nine inline AC source audits
2. Six test files:
   - `tests/tier1_feature_coverage.test.mjs`
   - `tests/tier2_boundary_corner.test.mjs`
   - `tests/tier3_cross_feature.test.mjs`
   - `tests/tier4_application_scenarios.test.mjs`
   - `tests/tier5_adversarial_coverage.test.mjs`
   - `tests/automated_code_verification.test.mjs`

It does not execute:

- `tests/m2_shell_navigation_state.test.mjs`
- `tests/m5_routes_risk_reports_settings.test.mjs`

## Observed `npm test` result

- Total checks/tests: **117**
- Passed: **98**
- Failed: **19**
- Verdict: **FAILED**

Inline AC outcome:

- Passed: AC4, AC5, AC7, AC8, AC9
- Failed: AC1, AC2, AC3, AC6

Tier outcome:

| Suite | Result |
|---|---|
| Tier 1 | 34/43 passed, 9 failed |
| Tier 2 | 29/29 passed |
| Tier 3 | 15/15 passed |
| Tier 4 | 5/5 passed |
| Tier 5 | 5/7 passed, 2 failed |
| Automated code verification | 5/9 passed, 4 failed |

Tier 1 failures:

- Features 2.1–2.6: navigation groups, active-route highlight, and mobile-collapse support
- Feature 6.1: token expectations
- Feature 6.4: `rounded-full` restriction
- Feature 6.6: typography contract

Tier 5 failures:

- 5.1b: root-layout fonts/provider expectation
- 5.4: micro data-density/border expectation

## Direct all-on-disk inventory

Running `node --test tests/*.test.mjs` covers all eight suites:

- Total: **136**
- Passed: **116**
- Failed: **20**

Additional failures beyond `npm test`:

- M2.5, M2.6, M2.7, M2.8
- M5.18

Reconciliation:

```text
136 on-disk tests
- 9 M2 tests not run by npm test
- 19 M5 tests not run by npm test
+ 9 inline AC checks run only by npm test
= 117 npm-test checks/tests
```

## Static versus behavioral coverage

Static source audits:

- Route-file existence
- Sidebar-file and navigation-group presence
- Token, color-class, shadow, radius, image, gradient, terminology, unit, and input/output-order checks

Behavioral simulation coverage:

- Horizon boundaries and fallback behavior
- Vessel-class boundaries
- Route invariants
- Cross-feature state consistency
- Application workflows
- Adversarial route and component checks

Static audits verify source text and structure; they do not prove rendered behavior.

## Manual checks still required

- Successful `next dev` startup after supplying the missing Sidebar module
- Successful `next build`
- All 11 routes rendering without errors
- End-to-end timed simulation behavior
- Map selection, layer, horizon, cursor, legend, and telemetry behavior
- Browser-print output
- Responsive desktop/mobile shell behavior
- Session-state reset on reload

## Traceability

| Check | Primary source |
|---|---|
| Package scripts | `package.json:5-11` |
| Runner scope | `scripts/e2e-audit.mjs:229-236` |
| Overall totals | `scripts/e2e-audit.mjs:309-312` |
| Sidebar remediation expectation | `scripts/e2e-audit.mjs:317` |
| Audit helpers | `tests/helpers/audit_engine.mjs` |
| Route-file contract | `tests/helpers/audit_engine.mjs:24-36` |
| Sidebar contract | `tests/helpers/audit_engine.mjs:42-83` |
| Missing shell module | `components/layout/AppShell.tsx:12` |
| Empty navigation directory | `components/navigation/` |
| Simulation functions | `src/simulations/*` |
| Domain datasets | `src/data/*` |

## Known blockers

1. Missing `components/layout/Sidebar.tsx` blocks module resolution and sidebar-related tests.
2. Empty `components/navigation/` leaves the runner’s first sidebar candidate absent.
3. Token, class, font, hardcoded-color, and styling-contract audits fail under the existing test expectations.
4. `npm test` alone does not verify `m2` or `m5`; those suites must be run directly for full on-disk coverage.
