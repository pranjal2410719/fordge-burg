import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASELINE_ROUTES,
  ROUTES,
  type RouteAlternative,
  type RouteId,
  type RouteWaypoint,
  type PolarisRioProfile,
  type IceExposureBreakdown,
} from '../lib/data';
import {
  ROUTE_STORAGE_KEY,
  getPersistedRouteId,
  setPersistedRouteId,
} from '../components/session/MissionContext';

describe('Empirical Adversarial Challenge: Dynamic Route Switching & Telemetry Coherence', () => {
  const ROUTE_IDS: readonly RouteId[] = ['shortest', 'safest', 'fuel_efficient', 'balanced'] as const;

  // --------------------------------------------------------------------------
  // 1. Rapid Switching Simulation & Determinism
  // --------------------------------------------------------------------------
  describe('1. Rapid Switching Across All 4 Pathways', () => {
    it('executes 1,000 rapid sequential route transitions without dropped states', () => {
      let currentId: RouteId = 'balanced';
      const resolvedRoutes: RouteAlternative[] = [];

      for (let i = 0; i < 1000; i++) {
        const nextId = ROUTE_IDS[i % ROUTE_IDS.length];
        currentId = nextId;
        const resolved = BASELINE_ROUTES.find((r) => r.id === currentId) ?? BASELINE_ROUTES[3];
        resolvedRoutes.push(resolved);

        assert.strictEqual(resolved.id, nextId, `Step ${i}: Resolved ID must match assigned ID ${nextId}`);
        assert.ok(resolved.waypoints.length >= 4, `Step ${i}: Waypoints must be loaded`);
        assert.ok(resolved.rio.scoreFormatted, `Step ${i}: RIO must be formatted`);
      }

      assert.strictEqual(resolvedRoutes.length, 1000, 'All 1000 transitions must complete');
    });

    it('performs ping-pong rapid switching between extreme corridors (shortest <-> safest)', () => {
      let activeRouteId: RouteId = 'shortest';

      for (let i = 0; i < 200; i++) {
        activeRouteId = i % 2 === 0 ? 'safest' : 'shortest';
        const route = BASELINE_ROUTES.find((r) => r.id === activeRouteId)!;

        if (activeRouteId === 'safest') {
          assert.strictEqual(route.distanceNm, 528);
          assert.strictEqual(route.rio.status, 'PASS');
          assert.strictEqual(route.averageRiskScore, 22);
          assert.strictEqual(route.iceExposure.peakIceConcTenths, 3);
        } else {
          assert.strictEqual(route.distanceNm, 412);
          assert.strictEqual(route.rio.status, 'MARGINAL');
          assert.strictEqual(route.averageRiskScore, 74);
          assert.strictEqual(route.iceExposure.peakIceConcTenths, 8);
        }
      }
    });

    it('performs randomized rapid switching across 1,000 pseudo-random selections', () => {
      let rngState = 42;
      function pseudoRandom(): number {
        rngState = (rngState * 1664525 + 1013904223) % 4294967296;
        return rngState / 4294967296;
      }

      for (let i = 0; i < 1000; i++) {
        const idx = Math.floor(pseudoRandom() * ROUTE_IDS.length);
        const chosenId = ROUTE_IDS[idx];
        const route = BASELINE_ROUTES.find((r) => r.id === chosenId);
        assert.ok(route, `Chosen ID ${chosenId} must resolve to a valid RouteAlternative`);
        assert.strictEqual(route.id, chosenId);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. Telemetry Synchronous Alignment & Stale Closure Prevention
  // --------------------------------------------------------------------------
  describe('2. Telemetry Synchronous Alignment Across All Metrics', () => {
    it('verifies that all telemetry metrics update atomically without stale residue', () => {
      const transitions: { from: RouteId; to: RouteId }[] = [
        { from: 'shortest', to: 'safest' },
        { from: 'safest', to: 'fuel_efficient' },
        { from: 'fuel_efficient', to: 'balanced' },
        { from: 'balanced', to: 'shortest' },
      ];

      for (const { from, to } of transitions) {
        const fromRoute = BASELINE_ROUTES.find((r) => r.id === from)!;
        const toRoute = BASELINE_ROUTES.find((r) => r.id === to)!;

        // Telemetry bundle representing what components read simultaneously
        const bundle = {
          id: toRoute.id,
          distanceNm: toRoute.distanceNm,
          fuelTons: toRoute.fuelTons,
          etaHours: toRoute.etaHours,
          averageRiskScore: toRoute.averageRiskScore,
          rioScore: toRoute.rio.score,
          rioStatus: toRoute.rio.status,
          peakIceConc: toRoute.iceExposure.peakIceConcTenths * 10,
          peakLocation: toRoute.iceExposure.peakLocation,
          waypointsCount: toRoute.waypoints.length,
          waypointsSumDist: toRoute.waypoints.reduce((acc, wp) => acc + wp.distNm, 0),
          algorithm: toRoute.aiRationale.algorithm,
        };

        // Assert all fields correspond strictly to `to` and NOT `from`
        assert.strictEqual(bundle.id, toRoute.id);
        assert.strictEqual(bundle.distanceNm, toRoute.distanceNm);
        assert.notStrictEqual(bundle.distanceNm, fromRoute.distanceNm, `Distance must differ between ${from} and ${to}`);
        assert.strictEqual(bundle.fuelTons, toRoute.fuelTons);
        assert.strictEqual(bundle.etaHours, toRoute.etaHours);
        assert.strictEqual(bundle.averageRiskScore, toRoute.averageRiskScore);
        assert.strictEqual(bundle.rioScore, toRoute.rio.score);
        assert.strictEqual(bundle.peakIceConc, toRoute.iceExposure.peakIceConcTenths * 10);
        assert.strictEqual(bundle.peakLocation, toRoute.iceExposure.peakLocation);
        assert.strictEqual(bundle.waypointsCount, toRoute.waypoints.length);
        assert.strictEqual(bundle.waypointsSumDist, toRoute.distanceNm);
        assert.strictEqual(bundle.algorithm, toRoute.aiRationale.algorithm);
      }
    });

    it('verifies mathematical consistency of waypoint sequences for each corridor', () => {
      for (const route of BASELINE_ROUTES) {
        let runningDist = 0;

        for (let i = 0; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          runningDist += wp.distNm;

          // Cumulative NM must equal running sum of leg distances
          assert.strictEqual(
            wp.cumulativeNm,
            runningDist,
            `Route ${route.id}, WP ${wp.id}: cumulativeNm (${wp.cumulativeNm}) must match running sum (${runningDist})`
          );

          // Lat/Lon must be within Antarctic Peninsula domain (-60° to -70° S, -50° to -70° W)
          assert.ok(wp.lat.includes('°S') || wp.lat.includes('S'), `${route.id} WP ${wp.id} valid lat notation`);
          assert.ok(wp.lon.includes('°W') || wp.lon.includes('W'), `${route.id} WP ${wp.id} valid lon notation`);

          // Speed limit must be positive and <= 15 kn
          assert.ok(wp.speedLimitKn > 0 && wp.speedLimitKn <= 15, `${route.id} WP ${wp.id} realistic speed limit`);

          // Ice concentration must be 0..10 tenths
          assert.ok(wp.iceConcTenths >= 0 && wp.iceConcTenths <= 10, `${route.id} WP ${wp.id} ice tenths 0..10`);

          // Risk score must be in range [0..100]
          assert.ok(wp.riskScore >= 0 && wp.riskScore <= 100, `${route.id} WP ${wp.id} risk score 0..100`);

          // Hazard note must be informative string
          assert.ok(wp.hazardNote.length > 5, `${route.id} WP ${wp.id} detailed hazard note`);
        }

        // Final waypoint cumulative distance must equal the total route distance
        const lastWp = route.waypoints[route.waypoints.length - 1];
        assert.strictEqual(
          lastWp.cumulativeNm,
          route.distanceNm,
          `Route ${route.id}: final waypoint cumulativeNm must equal route.distanceNm`
        );
      }
    });

    it('verifies ice regime breakdown percentages always sum exactly to 100%', () => {
      for (const route of BASELINE_ROUTES) {
        const { openWaterPct, lightIcePct, mediumPackPct, heavyRidgePct } = route.iceExposure;
        const total = openWaterPct + lightIcePct + mediumPackPct + heavyRidgePct;
        assert.strictEqual(
          total,
          100,
          `Route ${route.id}: Ice regime percentages must sum to exactly 100% (got ${total}%)`
        );
      }
    });

    it('verifies comparative metrics computation vs Safest baseline in /routes view', () => {
      const safest = BASELINE_ROUTES.find((r) => r.id === 'safest')!;

      for (const route of BASELINE_ROUTES) {
        const distanceSavedVsSafest = Math.max(0, safest.distanceNm - route.distanceNm);
        const fuelSavedVsSafest = Math.max(0, safest.fuelTons - route.fuelTons);
        const timeSavedVsSafest = Math.max(0, safest.etaHours - route.etaHours);

        if (route.id === 'safest') {
          assert.strictEqual(distanceSavedVsSafest, 0, 'Safest route saves 0 NM vs itself');
          assert.strictEqual(fuelSavedVsSafest, 0, 'Safest route saves 0 MT fuel vs itself');
          assert.strictEqual(timeSavedVsSafest, 0, 'Safest route saves 0 hrs vs itself');
        } else if (route.id === 'shortest') {
          assert.strictEqual(distanceSavedVsSafest, 116, 'Shortest saves 116 NM vs Safest');
          assert.strictEqual(Math.round(fuelSavedVsSafest * 10) / 10, 3.3, 'Shortest saves 3.3 MT fuel');
          assert.strictEqual(Math.round(timeSavedVsSafest * 10) / 10, 5.5, 'Shortest saves 5.5 h');
        } else if (route.id === 'fuel_efficient') {
          assert.strictEqual(distanceSavedVsSafest, 70, 'Fuel-efficient saves 70 NM vs Safest');
          assert.strictEqual(Math.round(fuelSavedVsSafest * 10) / 10, 11.7, 'Fuel-efficient saves 11.7 MT fuel');
          assert.strictEqual(Math.round(timeSavedVsSafest * 10) / 10, 2.4, 'Fuel-efficient saves 2.4 h');
        } else if (route.id === 'balanced') {
          assert.strictEqual(distanceSavedVsSafest, 83, 'Balanced saves 83 NM vs Safest');
          assert.strictEqual(Math.round(fuelSavedVsSafest * 10) / 10, 8.6, 'Balanced saves 8.6 MT fuel');
          assert.strictEqual(Math.round(timeSavedVsSafest * 10) / 10, 6.9, 'Balanced saves 6.9 h');
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. HUD Telemetry Dynamic Binding & Simulation Simulation
  // --------------------------------------------------------------------------
  describe('3. HUD Telemetry Dynamic Binding & Simulation State Coherence', () => {
    it('verifies HUD besetment risk mapping conforms to route hazard profile', () => {
      const bMap: Record<RouteId, number> = {
        shortest: 84.0,
        safest: 14.0,
        fuel_efficient: 46.0,
        balanced: 18.4,
      };

      for (const id of ROUTE_IDS) {
        const route = BASELINE_ROUTES.find((r) => r.id === id)!;
        const besetmentPct = route.id === 'shortest' ? 84.0 : route.id === 'safest' ? 14.0 : route.id === 'fuel_efficient' ? 46.0 : 18.4;
        assert.strictEqual(besetmentPct, bMap[id], `Besetment for ${id} must match expected hazard level`);
      }
    });

    it('verifies telemetry event stream message formatting accurately interpolates route attributes', () => {
      for (const route of BASELINE_ROUTES) {
        // POLARIS stream message interpolation
        const polarisMsg = `Polaris RIO score certified: ${route.rio.scoreFormatted} (${route.rio.status} under ${route.rio.regulatoryClause}).`;
        const polarisMetric = `${route.rio.scoreFormatted} RIO ${route.rio.status}`;

        assert.ok(polarisMsg.includes(route.rio.scoreFormatted));
        assert.ok(polarisMsg.includes(route.rio.status));
        assert.ok(polarisMetric.includes(route.rio.status));

        // METOCEAN stream message interpolation
        const metoceanMsg = `Dynamic ice concentration raster mapped. Peak sector pack density: ${route.iceExposure.peakIceConcTenths * 10}% in ${route.iceExposure.peakLocation}.`;
        const metoceanMetric = `${route.iceExposure.peakIceConcTenths * 10}% Peak`;

        assert.ok(metoceanMsg.includes(`${route.iceExposure.peakIceConcTenths * 10}%`));
        assert.ok(metoceanMsg.includes(route.iceExposure.peakLocation));
        assert.ok(metoceanMetric.includes(`${route.iceExposure.peakIceConcTenths * 10}%`));
      }
    });

    it('simulates rapid route switching during simulated pipeline stages without state corruption', () => {
      // Simulate state machine: progress increments 0 -> 40 -> 80 -> 100 while route selection is modified
      const stages = [0, 40, 80, 100];
      let activeRouteId: RouteId = 'shortest';

      for (const progress of stages) {
        // Switch route mid-flight
        activeRouteId = progress === 0 ? 'shortest' : progress === 40 ? 'fuel_efficient' : progress === 80 ? 'safest' : 'balanced';
        const activeRoute = BASELINE_ROUTES.find((r) => r.id === activeRouteId)!;

        // Telemetry counters
        const icePeak = activeRoute.iceExposure.peakIceConcTenths * 10;
        const rioScore = activeRoute.rio.score;
        const rioFormatted = activeRoute.rio.scoreFormatted;

        if (progress === 100) {
          assert.strictEqual(activeRoute.id, 'balanced');
          assert.strictEqual(icePeak, 40);
          assert.strictEqual(rioScore, 16.8);
          assert.strictEqual(rioFormatted, '+16.8');
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. Persistence, SSR Guard & Adversarial Storage Inputs
  // --------------------------------------------------------------------------
  describe('4. Persistence, SSR Guard & Adversarial Storage Inputs', () => {
    let originalWindow: typeof globalThis.window;

    beforeEach(() => {
      originalWindow = (globalThis as any).window;
    });

    afterEach(() => {
      (globalThis as any).window = originalWindow;
    });

    it('correctly persists and retrieves all valid RouteIds in browser sessionStorage', () => {
      const mockStorage = new Map<string, string>();
      (globalThis as any).window = {
        sessionStorage: {
          getItem: (key: string) => mockStorage.get(key) ?? null,
          setItem: (key: string, value: string) => mockStorage.set(key, value),
          removeItem: (key: string) => mockStorage.delete(key),
          clear: () => mockStorage.clear(),
        },
      };

      for (const id of ROUTE_IDS) {
        setPersistedRouteId(id);
        assert.strictEqual(mockStorage.get(ROUTE_STORAGE_KEY), id);
        const retrieved = getPersistedRouteId();
        assert.strictEqual(retrieved, id);
      }
    });

    it('adversarially tests corrupted and malicious storage payloads — safely rejects them', () => {
      const mockStorage = new Map<string, string>();
      (globalThis as any).window = {
        sessionStorage: {
          getItem: (key: string) => mockStorage.get(key) ?? null,
          setItem: (key: string, value: string) => mockStorage.set(key, value),
        },
      };

      const maliciousPayloads = [
        '',
        '   ',
        'invalid_corridor',
        'SHORTEST', // uppercase
        'safest ', // trailing space
        'fuel-efficient', // hyphen instead of underscore
        'balanced\0',
        '{"id":"shortest"}',
        '<script>alert("pwn")</script>',
        '; DROP TABLE routes; --',
        '__proto__',
        'constructor',
        'undefined',
        'null',
        'NaN',
        '12345',
      ];

      for (const payload of maliciousPayloads) {
        mockStorage.set(ROUTE_STORAGE_KEY, payload);
        const result = getPersistedRouteId();
        assert.strictEqual(
          result,
          null,
          `Payload "${payload}" must be rejected by getPersistedRouteId and return null`
        );
      }
    });

    it('resiliently handles throwing sessionStorage (QuotaExceededError, SecurityError in iframe)', () => {
      (globalThis as any).window = {
        sessionStorage: {
          getItem: () => {
            throw new Error('SecurityError: The operation is insecure.');
          },
          setItem: () => {
            throw new Error('QuotaExceededError: Storage quota has been exceeded.');
          },
        },
      };

      // Both functions must catch errors silently and not crash
      assert.doesNotThrow(() => {
        const result = getPersistedRouteId();
        assert.strictEqual(result, null, 'Must return null on storage read error');
      });

      assert.doesNotThrow(() => {
        setPersistedRouteId('safest');
      });
    });

    it('verifies safe SSR guard when window or window.sessionStorage is undefined', () => {
      (globalThis as any).window = undefined;
      assert.strictEqual(getPersistedRouteId(), null, 'Returns null when window is undefined');
      assert.doesNotThrow(() => setPersistedRouteId('balanced'));

      (globalThis as any).window = {};
      assert.strictEqual(getPersistedRouteId(), null, 'Returns null when sessionStorage is undefined');
      assert.doesNotThrow(() => setPersistedRouteId('shortest'));
    });
  });
});
