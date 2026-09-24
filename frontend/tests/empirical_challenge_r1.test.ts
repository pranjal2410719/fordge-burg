import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASELINE_ROUTES,
  ROUTES,
  DEFAULTS,
  type RouteAlternative,
  type RouteId,
  type RouteWaypoint,
} from '../lib/data';
import {
  ROUTE_STORAGE_KEY,
  getPersistedRouteId,
  setPersistedRouteId,
} from '../components/session/MissionContext';

describe('Adversarial & Empirical Stress Verification: Milestone 1 (R1)', () => {
  // ==========================================================================
  // Suite 1: Data Invariant Stress Testing Across All 4 Corridors
  // ==========================================================================
  describe('Suite 1: Data Invariants Across Corridors', () => {
    const corridors: RouteId[] = ['shortest', 'safest', 'fuel_efficient', 'balanced'];

    it('EMPIRICAL: Monotonic cumulative waypoint distances strictly match total route distance', () => {
      for (const routeId of corridors) {
        const route = BASELINE_ROUTES.find((r) => r.id === routeId);
        assert.ok(route, `Route ${routeId} must exist`);
        assert.ok(route.waypoints.length >= 4, `Route ${routeId} must have at least 4 waypoints`);

        // Waypoint 0 invariant
        const wp0 = route.waypoints[0];
        assert.strictEqual(wp0.distNm, 0, `${routeId}: First waypoint distNm must be 0`);
        assert.strictEqual(wp0.cumulativeNm, 0, `${routeId}: First waypoint cumulativeNm must be 0`);

        let computedRunningCumulative = 0;

        for (let i = 0; i < route.waypoints.length; i++) {
          const wp: (typeof route.waypoints)[number] = route.waypoints[i];

          // Waypoint coordinate validation
          assert.match(wp.lat, /^\d+(\.\d+)?°S$/, `${routeId} WP${i} lat format valid`);
          assert.match(wp.lon, /^\d+(\.\d+)?°W$/, `${routeId} WP${i} lon format valid`);

          // Waypoint physical attributes
          assert.ok(wp.iceConcTenths >= 0 && wp.iceConcTenths <= 10, `${routeId} WP${i} iceConc in [0, 10]`);
          assert.ok(wp.speedLimitKn >= 1 && wp.speedLimitKn <= 25, `${routeId} WP${i} speed limit realistic [1, 25]`);
          assert.ok(wp.riskScore >= 0 && wp.riskScore <= 100, `${routeId} WP${i} riskScore in [0, 100]`);
          assert.ok(wp.hazardNote.length > 5, `${routeId} WP${i} hazard note has substance`);

          computedRunningCumulative += wp.distNm;

          // Invariant: cumulativeNm must exactly equal running sum of leg distances
          assert.strictEqual(
            wp.cumulativeNm,
            computedRunningCumulative,
            `${routeId} WP${i} cumulativeNm (${wp.cumulativeNm}) must equal computed sum (${computedRunningCumulative})`
          );

          // Monotonicity check
          if (i > 0) {
            assert.ok(
              wp.cumulativeNm > route.waypoints[i - 1].cumulativeNm,
              `${routeId} WP${i} cumulativeNm must be strictly greater than WP${i - 1} cumulativeNm`
            );
            assert.ok(
              wp.distNm > 0,
              `${routeId} WP${i} leg distNm must be strictly positive`
            );
          }
        }

        // Final waypoint cumulative distance must match route.distanceNm exactly
        const finalWp = route.waypoints[route.waypoints.length - 1];
        assert.strictEqual(
          finalWp.cumulativeNm,
          route.distanceNm,
          `${routeId} final WP cumulativeNm (${finalWp.cumulativeNm}) must equal route.distanceNm (${route.distanceNm})`
        );
        assert.strictEqual(
          computedRunningCumulative,
          route.distanceNm,
          `${routeId} sum of all leg distances (${computedRunningCumulative}) must equal route.distanceNm (${route.distanceNm})`
        );
      }
    });

    it('EMPIRICAL: Ice exposure percentage sums equal exactly 100% with no floating-point rounding drift', () => {
      for (const routeId of corridors) {
        const route = BASELINE_ROUTES.find((r) => r.id === routeId)!;
        const { openWaterPct, lightIcePct, mediumPackPct, heavyRidgePct } = route.iceExposure;

        // Individual percentage boundaries
        assert.ok(openWaterPct >= 0 && openWaterPct <= 100, `${routeId} openWaterPct in [0, 100]`);
        assert.ok(lightIcePct >= 0 && lightIcePct <= 100, `${routeId} lightIcePct in [0, 100]`);
        assert.ok(mediumPackPct >= 0 && mediumPackPct <= 100, `${routeId} mediumPackPct in [0, 100]`);
        assert.ok(heavyRidgePct >= 0 && heavyRidgePct <= 100, `${routeId} heavyRidgePct in [0, 100]`);

        // Exact integer summation test
        const exactSum = openWaterPct + lightIcePct + mediumPackPct + heavyRidgePct;
        assert.strictEqual(
          exactSum,
          100,
          `${routeId} ice exposure percentages (${openWaterPct} + ${lightIcePct} + ${mediumPackPct} + ${heavyRidgePct}) must equal exactly 100`
        );

        // Check multi-year ice NM is realistic and bounded by route distance
        assert.ok(
          route.iceExposure.multiYearIceNm >= 0,
          `${routeId} multiYearIceNm must be non-negative`
        );
        assert.ok(
          route.iceExposure.multiYearIceNm <= route.distanceNm,
          `${routeId} multiYearIceNm (${route.iceExposure.multiYearIceNm}) cannot exceed total route distance (${route.distanceNm})`
        );

        // Peak ice concentration bounds
        assert.ok(
          route.iceExposure.peakIceConcTenths >= 0 && route.iceExposure.peakIceConcTenths <= 10,
          `${routeId} peakIceConcTenths in [0, 10]`
        );
        assert.ok(route.iceExposure.peakLocation.length > 0, `${routeId} peakLocation specified`);
      }
    });

    it('EMPIRICAL: Physical & regulatory invariants across all 4 corridors', () => {
      const shortest = BASELINE_ROUTES.find((r) => r.id === 'shortest')!;
      const safest = BASELINE_ROUTES.find((r) => r.id === 'safest')!;
      const fuelEff = BASELINE_ROUTES.find((r) => r.id === 'fuel_efficient')!;
      const balanced = BASELINE_ROUTES.find((r) => r.id === 'balanced')!;

      // 1. Shortest: shortest distance, highest risk, negative RIO
      assert.strictEqual(shortest.distanceNm, 412);
      assert.ok(
        shortest.distanceNm < balanced.distanceNm &&
        shortest.distanceNm < fuelEff.distanceNm &&
        shortest.distanceNm < safest.distanceNm,
        'Shortest route must have lowest distanceNm among all 4 corridors'
      );
      assert.ok(
        shortest.averageRiskScore > balanced.averageRiskScore &&
        shortest.averageRiskScore > fuelEff.averageRiskScore &&
        shortest.averageRiskScore > safest.averageRiskScore,
        'Shortest route must have strictly highest averageRiskScore among all 4 corridors'
      );
      assert.ok(
        shortest.maxRiskScore > balanced.maxRiskScore &&
        shortest.maxRiskScore > fuelEff.maxRiskScore &&
        shortest.maxRiskScore > safest.maxRiskScore,
        'Shortest route must have strictly highest maxRiskScore among all 4 corridors'
      );
      assert.ok(
        shortest.rio.score < 0,
        `Shortest route RIO must be negative (got ${shortest.rio.score})`
      );
      assert.strictEqual(shortest.rio.status, 'MARGINAL');
      assert.strictEqual(shortest.compatibility, 'marginal');

      // 2. Safest: lowest risk, highest positive RIO, longest distance
      assert.strictEqual(safest.distanceNm, 528);
      assert.ok(
        safest.distanceNm > balanced.distanceNm &&
        safest.distanceNm > fuelEff.distanceNm &&
        safest.distanceNm > shortest.distanceNm,
        'Safest route must have strictly longest distance among all 4 corridors'
      );
      assert.ok(
        safest.averageRiskScore < balanced.averageRiskScore &&
        safest.averageRiskScore < fuelEff.averageRiskScore &&
        safest.averageRiskScore < shortest.averageRiskScore,
        'Safest route must have strictly lowest averageRiskScore among all 4 corridors'
      );
      assert.ok(
        safest.maxRiskScore < balanced.maxRiskScore &&
        safest.maxRiskScore < fuelEff.maxRiskScore &&
        safest.maxRiskScore < shortest.maxRiskScore,
        'Safest route must have strictly lowest maxRiskScore among all 4 corridors'
      );
      assert.ok(
        safest.rio.score > 0,
        `Safest route RIO must be positive (got ${safest.rio.score})`
      );
      assert.ok(
        safest.rio.score > balanced.rio.score &&
        safest.rio.score > fuelEff.rio.score &&
        safest.rio.score > shortest.rio.score,
        'Safest route must have strictly highest RIO score among all 4 corridors'
      );
      assert.strictEqual(safest.rio.status, 'PASS');
      assert.strictEqual(safest.compatibility, 'high');
      assert.strictEqual(safest.iceExposure.heavyRidgePct, 0, 'Safest must have 0% heavy ridges');
      assert.strictEqual(safest.iceExposure.multiYearIceNm, 0, 'Safest must have 0 NM multi-year ice');

      // 3. Fuel-efficient: lowest bunker burn
      assert.strictEqual(fuelEff.fuelTons, 39.8);
      assert.ok(
        fuelEff.fuelTons < balanced.fuelTons &&
        fuelEff.fuelTons < shortest.fuelTons &&
        fuelEff.fuelTons < safest.fuelTons,
        'Fuel-efficient route must have strictly lowest fuelTons among all 4 corridors'
      );
      assert.ok(fuelEff.rio.score > 0, 'Fuel-efficient RIO must be positive');
      assert.strictEqual(fuelEff.rio.status, 'PASS');
      assert.strictEqual(fuelEff.compatibility, 'high');

      // 4. Balanced: fastest voyage ETA
      assert.strictEqual(balanced.etaHours, 37.1);
      assert.ok(
        balanced.etaHours < shortest.etaHours &&
        balanced.etaHours < fuelEff.etaHours &&
        balanced.etaHours < safest.etaHours,
        'Balanced route must deliver fastest ETA duration among all 4 corridors'
      );
      assert.ok(balanced.rio.score > 0, 'Balanced RIO must be positive');
      assert.strictEqual(balanced.rio.status, 'PASS');
      assert.strictEqual(balanced.compatibility, 'high');
    });

    it('EMPIRICAL: SVG Path Coordinates continuity and bounding bounds', () => {
      for (const routeId of corridors) {
        const route = BASELINE_ROUTES.find((r) => r.id === routeId)!;
        assert.ok(Array.isArray(route.pathCoordinates), `${routeId} pathCoordinates is array`);
        assert.ok(route.pathCoordinates.length >= 4, `${routeId} pathCoordinates has at least 4 points`);

        // Common start origin and terminal destination
        const firstPt = route.pathCoordinates[0];
        const lastPt = route.pathCoordinates[route.pathCoordinates.length - 1];

        // All routes depart from Maxwell Bay and terminate at Weddell Outpost Alpha
        assert.strictEqual(firstPt.x, 505, `${routeId} departure coord X is 505`);
        assert.strictEqual(firstPt.y, 28.9, `${routeId} departure coord Y is 28.9`);
        assert.strictEqual(lastPt.x, 800, `${routeId} terminal coord X is 800`);
        assert.strictEqual(lastPt.y, 505.6, `${routeId} terminal coord Y is 505.6`);

        // Coordinate bounding box validation
        for (let i = 0; i < route.pathCoordinates.length; i++) {
          const pt = route.pathCoordinates[i];
          assert.ok(pt.x >= 0 && pt.x <= 1000, `${routeId} pt[${i}].x ${pt.x} within [0, 1000]`);
          assert.ok(pt.y >= 0 && pt.y <= 650, `${routeId} pt[${i}].y ${pt.y} within [0, 650]`);
        }
      }
    });
  });

  // ==========================================================================
  // Suite 2: Storage Persistence & Adversarial Inputs Stress Testing
  // ==========================================================================
  describe('Suite 2: Storage Persistence & Adversarial Input Stress', () => {
    it('STRESS: Rejects corrupted, unknown, empty, and malicious sessionStorage values', () => {
      const mockStorage: Record<string, string> = {};

      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        sessionStorage: {
          getItem: (key: string) => mockStorage[key] ?? null,
          setItem: (key: string, val: string) => {
            mockStorage[key] = val;
          },
          removeItem: (key: string) => {
            delete mockStorage[key];
          },
        },
      };

      try {
        // Battery of adversarial and corrupted storage values
        const adversarialValues = [
          '',                                                // empty string
          '   ',                                             // whitespace only
          'shortest ',                                       // trailing whitespace
          ' shortest',                                       // leading whitespace
          'SHORTEST',                                        // uppercase
          'Safest',                                          // PascalCase
          'unknown_corridor_xyz',                            // unknown identifier
          'null',                                            // string null
          'undefined',                                       // string undefined
          'NaN',                                             // string NaN
          '0',                                               // zero string
          '-1',                                              // negative string
          '{"id": "shortest"}',                              // valid JSON object string
          '{"__proto__": {"admin": true}}',                  // prototype pollution attack
          '{"constructor": {"prototype": {"x": 1}}}',        // constructor pollution
          '<script>alert("xss")</script>',                   // XSS script payload
          'javascript:alert(1)',                             // pseudo-protocol payload
          '"><img src=x onerror=alert(1)>',                  // HTML injection
          '1; DROP TABLE corridors; --',                     // SQL injection payload
          'balanced\0injection',                             // null byte injection
          'balanced\nnewline',                               // newline injection
          '🚀❄️🌊',                                         // emoji / multi-byte utf-8
          'A'.repeat(10000),                                 // oversized buffer payload
        ];

        for (const badValue of adversarialValues) {
          mockStorage[ROUTE_STORAGE_KEY] = badValue;
          const result = getPersistedRouteId();
          assert.strictEqual(
            result,
            null,
            `Adversarial input "${badValue.slice(0, 30)}" must be safely rejected (returned ${result})`
          );
        }

        // Verify valid corridors are properly accepted
        const validCorridors: RouteId[] = ['shortest', 'safest', 'fuel_efficient', 'balanced'];
        for (const validId of validCorridors) {
          setPersistedRouteId(validId);
          assert.strictEqual(mockStorage[ROUTE_STORAGE_KEY], validId);
          assert.strictEqual(getPersistedRouteId(), validId, `Valid route ${validId} must be hydrated`);
        }
      } finally {
        if (originalWindow === undefined) {
          delete (globalThis as any).window;
        } else {
          (globalThis as any).window = originalWindow;
        }
      }
    });

    it('STRESS: SSR Fallback when window or window.sessionStorage is undefined', () => {
      const originalWindow = (globalThis as any).window;

      try {
        // Case 1: window is completely undefined (pure SSR / Node.js)
        delete (globalThis as any).window;
        assert.strictEqual(typeof (globalThis as any).window, 'undefined');
        assert.strictEqual(getPersistedRouteId(), null, 'Must return null when window is undefined');
        assert.doesNotThrow(() => setPersistedRouteId('shortest'), 'Must not throw when window is undefined');

        // Case 2: window exists, but sessionStorage is undefined (restricted environment)
        (globalThis as any).window = {};
        assert.strictEqual(getPersistedRouteId(), null, 'Must return null when sessionStorage is undefined');
        assert.doesNotThrow(() => setPersistedRouteId('safest'), 'Must not throw when sessionStorage is undefined');

        // Case 3: window exists, but sessionStorage is null
        (globalThis as any).window = { sessionStorage: null };
        assert.strictEqual(getPersistedRouteId(), null, 'Must return null when sessionStorage is null');

        // Case 4: window exists, but sessionStorage is a plain empty object (missing getItem/setItem)
        (globalThis as any).window = { sessionStorage: {} };
        assert.strictEqual(getPersistedRouteId(), null, 'Must catch missing getItem and return null safely');
        assert.doesNotThrow(() => setPersistedRouteId('balanced'), 'Must catch missing setItem safely');
      } finally {
        if (originalWindow === undefined) {
          delete (globalThis as any).window;
        } else {
          (globalThis as any).window = originalWindow;
        }
      }
    });

    it('STRESS: Exception resilience against DOMException, SecurityError, and QuotaExceeded', () => {
      const originalWindow = (globalThis as any).window;

      try {
        // Simulate SecurityError (e.g. cookies/local storage blocked in strict private browsing)
        (globalThis as any).window = {
          sessionStorage: {
            getItem: () => {
              const err = new Error('The operation is insecure.');
              err.name = 'SecurityError';
              throw err;
            },
            setItem: () => {
              const err = new Error('QuotaExceededError');
              err.name = 'QuotaExceededError';
              throw err;
            },
            removeItem: () => {},
          },
        };

        assert.strictEqual(getPersistedRouteId(), null, 'SecurityError on getItem returns null');
        assert.doesNotThrow(() => setPersistedRouteId('shortest'), 'QuotaExceeded on setItem is silently caught');

        // Simulate non-Error throws (e.g. throw "string" or throw null)
        (globalThis as any).window.sessionStorage.getItem = () => {
          throw 'Arbitrary non-error string throw';
        };
        assert.strictEqual(getPersistedRouteId(), null, 'Non-error throw returns null safely');

        (globalThis as any).window.sessionStorage.setItem = () => {
          throw 42;
        };
        assert.doesNotThrow(() => setPersistedRouteId('balanced'), 'Non-error throw on setItem is caught');
      } finally {
        if (originalWindow === undefined) {
          delete (globalThis as any).window;
        } else {
          (globalThis as any).window = originalWindow;
        }
      }
    });

    it('EMPIRICAL: Fallback safety in UI route resolution when active selection is missing/invalid', () => {
      // Test the exact fallback logic used in MissionContext:
      // const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? routes[3];
      const invalidIds = ['unknown', '', null, undefined, 'corrupted_id'] as unknown as RouteId[];

      for (const invalidId of invalidIds) {
        const resolved = BASELINE_ROUTES.find((r) => r.id === invalidId) ?? BASELINE_ROUTES[3];
        assert.ok(resolved, 'Fallback route must not be undefined');
        assert.strictEqual(resolved.id, 'balanced', 'Fallback route must be recommended balanced route');
        assert.strictEqual(resolved.name, 'Recommended Balanced');
        assert.strictEqual(resolved.distanceNm, 445);
        assert.strictEqual(resolved.fuelTons, 42.9);
        assert.strictEqual(resolved.rio.scoreFormatted, '+16.8');
        assert.strictEqual(resolved.waypoints.length, 6);
      }
    });
  });
});
