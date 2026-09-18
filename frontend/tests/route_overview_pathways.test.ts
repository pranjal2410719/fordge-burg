import { describe, it } from 'node:test';
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

describe('Milestone 1: Dynamic Route Overview Across Pathways (Requirement R1)', () => {
  // --------------------------------------------------------------------------
  // 1. Data Model Completeness & Schema Validation
  // --------------------------------------------------------------------------
  describe('1. Data Model Completeness & Schema Validation', () => {
    it('should export BASELINE_ROUTES and ROUTES with exactly 4 distinct corridors', () => {
      assert.strictEqual(BASELINE_ROUTES.length, 4, 'Must have exactly 4 corridors');
      assert.strictEqual(ROUTES.length, 4, 'ROUTES alias must have 4 corridors');
      assert.strictEqual(BASELINE_ROUTES, ROUTES, 'ROUTES and BASELINE_ROUTES must be identical');

      const ids = BASELINE_ROUTES.map((r) => r.id);
      const expectedIds: RouteId[] = ['shortest', 'safest', 'fuel_efficient', 'balanced'];
      assert.deepStrictEqual(ids.sort(), expectedIds.sort(), 'Must include all 4 corridor IDs');
    });

    it('each corridor must have complete and well-formed telemetry fields', () => {
      for (const route of BASELINE_ROUTES) {
        // Scalar stats
        assert.ok(route.id, 'Route must have id');
        assert.ok(route.name, 'Route must have name');
        assert.ok(route.tradeOff, 'Route must have tradeOff');
        assert.ok(route.distanceNm > 0, `${route.id} distanceNm must be positive`);
        assert.ok(route.etaHours > 0, `${route.id} etaHours must be positive`);
        assert.ok(route.fuelTons > 0, `${route.id} fuelTons must be positive`);
        assert.ok(route.averageRiskScore >= 0 && route.averageRiskScore <= 100, `${route.id} averageRiskScore in [0..100]`);
        assert.ok(route.maxRiskScore >= route.averageRiskScore, `${route.id} maxRiskScore >= averageRiskScore`);
        assert.ok(['high', 'marginal', 'low'].includes(route.compatibility), `${route.id} valid compatibility`);

        // POLARIS RIO Profile
        assert.ok(route.rio, `${route.id} must have rio profile`);
        assert.strictEqual(typeof route.rio.score, 'number', `${route.id} rio.score must be number`);
        assert.strictEqual(typeof route.rio.scoreFormatted, 'string', `${route.id} rio.scoreFormatted must be string`);
        assert.ok(['PASS', 'MARGINAL'].includes(route.rio.status), `${route.id} rio.status must be PASS or MARGINAL`);
        assert.ok(route.rio.regulatoryClause.includes('IMO Polar Code'), `${route.id} regulatoryClause references IMO`);
        assert.ok(route.rio.description.length > 10, `${route.id} description must be detailed`);

        // Ice Exposure Breakdown
        const ice = route.iceExposure;
        assert.ok(ice, `${route.id} must have iceExposure`);
        assert.ok(ice.openWaterPct >= 0, `${route.id} openWaterPct >= 0`);
        assert.ok(ice.lightIcePct >= 0, `${route.id} lightIcePct >= 0`);
        assert.ok(ice.mediumPackPct >= 0, `${route.id} mediumPackPct >= 0`);
        assert.ok(ice.heavyRidgePct >= 0, `${route.id} heavyRidgePct >= 0`);
        const pctSum = ice.openWaterPct + ice.lightIcePct + ice.mediumPackPct + ice.heavyRidgePct;
        assert.strictEqual(pctSum, 100, `${route.id} ice exposure percentages must sum exactly to 100%`);
        assert.ok(ice.peakIceConcTenths >= 0 && ice.peakIceConcTenths <= 10, `${route.id} peakIceConcTenths in [0..10]`);
        assert.ok(ice.peakLocation.length > 0, `${route.id} peakLocation must be specified`);
        assert.ok(ice.multiYearIceNm >= 0, `${route.id} multiYearIceNm must be non-negative`);

        // AI Rationale
        assert.ok(route.aiRationale, `${route.id} must have aiRationale`);
        assert.ok(route.aiRationale.algorithm.length > 0, `${route.id} algorithm must be non-empty`);
        assert.ok(route.aiRationale.heuristics.length > 0, `${route.id} heuristics must be non-empty`);
        assert.ok(route.aiRationale.tradeOff.length > 0, `${route.id} aiRationale tradeOff must be non-empty`);

        // Path Coordinates
        assert.ok(Array.isArray(route.pathCoordinates) && route.pathCoordinates.length >= 4, `${route.id} pathCoordinates >= 4`);
        for (const pt of route.pathCoordinates) {
          assert.ok(pt.x >= 0 && pt.x <= 1000, `${route.id} coord x in [0..1000]`);
          assert.ok(pt.y >= 0 && pt.y <= 650, `${route.id} coord y in [0..650]`);
        }
      }
    });

    it('each corridor must have valid waypoints summing to total leg distance', () => {
      const expectedWaypointCounts: Record<RouteId, number> = {
        shortest: 4,
        safest: 5,
        fuel_efficient: 4,
        balanced: 6,
      };

      for (const route of BASELINE_ROUTES) {
        assert.strictEqual(
          route.waypoints.length,
          expectedWaypointCounts[route.id],
          `${route.id} must have exactly ${expectedWaypointCounts[route.id]} waypoints`
        );

        // First waypoint starts at 0
        assert.strictEqual(route.waypoints[0].distNm, 0, `${route.id} WP0 distNm is 0`);
        assert.strictEqual(route.waypoints[0].cumulativeNm, 0, `${route.id} WP0 cumulativeNm is 0`);

        let runningSum = 0;
        let lastCumulative = 0;

        for (let i = 0; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          assert.ok(wp.id, `${route.id} WP${i} must have id`);
          assert.ok(wp.name, `${route.id} WP${i} must have name`);
          assert.ok(wp.lat.includes('°S'), `${route.id} WP${i} lat has °S`);
          assert.ok(wp.lon.includes('°W'), `${route.id} WP${i} lon has °W`);
          assert.ok(wp.iceConcTenths >= 0 && wp.iceConcTenths <= 10, `${route.id} WP${i} iceConc in [0..10]`);
          assert.ok(wp.speedLimitKn > 0, `${route.id} WP${i} speed limit > 0`);
          assert.ok(wp.riskScore >= 0 && wp.riskScore <= 100, `${route.id} WP${i} risk score in [0..100]`);
          assert.ok(wp.hazardNote.length > 0, `${route.id} WP${i} hazard note must be present`);

          runningSum += wp.distNm;
          assert.strictEqual(
            wp.cumulativeNm,
            runningSum,
            `${route.id} WP${i} cumulativeNm (${wp.cumulativeNm}) must match running sum (${runningSum})`
          );

          assert.ok(
            wp.cumulativeNm >= lastCumulative,
            `${route.id} WP${i} cumulative distance must be monotonically increasing`
          );
          lastCumulative = wp.cumulativeNm;
        }

        // Final waypoint distance must equal route.distanceNm
        assert.strictEqual(
          runningSum,
          route.distanceNm,
          `${route.id} sum of leg distances (${runningSum}) must equal route.distanceNm (${route.distanceNm})`
        );
        assert.strictEqual(
          route.waypoints[route.waypoints.length - 1].cumulativeNm,
          route.distanceNm,
          `${route.id} last waypoint cumulative distance must equal route.distanceNm`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. Physical & Regulatory Hierarchy & Corridor Coherence
  // --------------------------------------------------------------------------
  describe('2. Physical & Regulatory Coherence Across Corridors', () => {
    it('verifies Shortest corridor matches specific dispatch parameters', () => {
      const route = BASELINE_ROUTES.find((r) => r.id === 'shortest')!;
      assert.strictEqual(route.distanceNm, 412, 'Shortest distance is 412 NM');
      assert.strictEqual(route.etaHours, 38.5, 'Shortest ETA is 38.5h');
      assert.strictEqual(route.fuelTons, 48.2, 'Shortest fuel is 48.2 MT');
      assert.strictEqual(route.averageRiskScore, 74, 'Shortest avg risk is 74');
      assert.strictEqual(route.maxRiskScore, 88, 'Shortest max risk is 88');
      assert.strictEqual(route.compatibility, 'marginal');

      // POLARIS
      assert.strictEqual(route.rio.score, -3.2, 'Shortest RIO score is -3.2');
      assert.strictEqual(route.rio.scoreFormatted, '-3.2');
      assert.strictEqual(route.rio.status, 'MARGINAL');
      assert.ok(route.rio.regulatoryClause.includes('MSC.1/Circ.1519'));

      // Ice Exposure
      assert.strictEqual(route.iceExposure.peakIceConcTenths, 8, 'Shortest peak ice is 8/10');
      assert.strictEqual(route.iceExposure.peakLocation, 'Antarctic Sound');
      assert.strictEqual(route.iceExposure.heavyRidgePct, 36, 'Shortest has 36% heavy ridge pack');
      assert.strictEqual(route.iceExposure.multiYearIceNm, 145, 'Shortest has 145 NM multi-year ice');
      assert.strictEqual(route.waypoints.length, 4, 'Shortest has 4 waypoints');
    });

    it('verifies Safest corridor matches specific dispatch parameters', () => {
      const route = BASELINE_ROUTES.find((r) => r.id === 'safest')!;
      assert.strictEqual(route.distanceNm, 528, 'Safest distance is 528 NM');
      assert.strictEqual(route.etaHours, 44.0, 'Safest ETA is 44.0h');
      assert.strictEqual(route.fuelTons, 51.5, 'Safest fuel is 51.5 MT');
      assert.strictEqual(route.averageRiskScore, 22, 'Safest avg risk is 22');
      assert.strictEqual(route.maxRiskScore, 36, 'Safest max risk is 36');
      assert.strictEqual(route.compatibility, 'high');

      // POLARIS
      assert.strictEqual(route.rio.score, 24.2, 'Safest RIO score is +24.2');
      assert.strictEqual(route.rio.scoreFormatted, '+24.2');
      assert.strictEqual(route.rio.status, 'PASS');

      // Ice Exposure
      assert.strictEqual(route.iceExposure.peakIceConcTenths, 3, 'Safest peak ice is 3/10');
      assert.strictEqual(route.iceExposure.heavyRidgePct, 0, 'Safest has 0% heavy ridge pack');
      assert.strictEqual(route.iceExposure.multiYearIceNm, 0, 'Safest has 0 NM multi-year ice');
      assert.strictEqual(route.waypoints.length, 5, 'Safest has 5 waypoints');
    });

    it('verifies Fuel-Efficient corridor matches specific dispatch parameters', () => {
      const route = BASELINE_ROUTES.find((r) => r.id === 'fuel_efficient')!;
      assert.strictEqual(route.distanceNm, 458, 'Fuel-efficient distance is 458 NM');
      assert.strictEqual(route.etaHours, 41.6, 'Fuel-efficient ETA is 41.6h');
      assert.strictEqual(route.fuelTons, 39.8, 'Fuel-efficient fuel is 39.8 MT');
      assert.strictEqual(route.averageRiskScore, 45, 'Fuel-efficient avg risk is 45');
      assert.strictEqual(route.maxRiskScore, 54, 'Fuel-efficient max risk is 54');
      assert.strictEqual(route.compatibility, 'high');

      // POLARIS
      assert.strictEqual(route.rio.score, 11.5, 'Fuel-efficient RIO score is +11.5');
      assert.strictEqual(route.rio.scoreFormatted, '+11.5');
      assert.strictEqual(route.rio.status, 'PASS');

      // Ice Exposure
      assert.strictEqual(route.iceExposure.peakIceConcTenths, 5, 'Fuel-efficient peak ice is 5/10');
      assert.strictEqual(route.iceExposure.heavyRidgePct, 0, 'Fuel-efficient has 0% heavy ridge pack');
      assert.strictEqual(route.iceExposure.multiYearIceNm, 38, 'Fuel-efficient has 38 NM multi-year ice');
      assert.strictEqual(route.waypoints.length, 4, 'Fuel-efficient has 4 waypoints');
    });

    it('verifies Recommended Balanced corridor matches specific dispatch parameters', () => {
      const route = BASELINE_ROUTES.find((r) => r.id === 'balanced')!;
      assert.strictEqual(route.distanceNm, 445, 'Balanced distance is 445 NM');
      assert.strictEqual(route.etaHours, 37.1, 'Balanced ETA is 37.1h (fastest)');
      assert.strictEqual(route.fuelTons, 42.9, 'Balanced fuel is 42.9 MT');
      assert.strictEqual(route.averageRiskScore, 31, 'Balanced avg risk is 31');
      assert.strictEqual(route.maxRiskScore, 42, 'Balanced max risk is 42');
      assert.strictEqual(route.compatibility, 'high');

      // POLARIS
      assert.strictEqual(route.rio.score, 16.8, 'Balanced RIO score is +16.8');
      assert.strictEqual(route.rio.scoreFormatted, '+16.8');
      assert.strictEqual(route.rio.status, 'PASS');

      // Ice Exposure
      assert.strictEqual(route.iceExposure.peakIceConcTenths, 4, 'Balanced peak ice is 4/10');
      assert.strictEqual(route.iceExposure.heavyRidgePct, 0, 'Balanced has 0% heavy ridge pack');
      assert.strictEqual(route.iceExposure.multiYearIceNm, 18, 'Balanced has 18 NM multi-year ice');
      assert.strictEqual(route.waypoints.length, 6, 'Balanced has 6 waypoints');
    });

    it('enforces strict physical and regulatory hierarchies across all corridors', () => {
      const shortest = BASELINE_ROUTES.find((r) => r.id === 'shortest')!;
      const safest = BASELINE_ROUTES.find((r) => r.id === 'safest')!;
      const fuelEff = BASELINE_ROUTES.find((r) => r.id === 'fuel_efficient')!;
      const balanced = BASELINE_ROUTES.find((r) => r.id === 'balanced')!;

      // Distance hierarchy: Safest > Fuel-Efficient > Balanced > Shortest
      assert.ok(safest.distanceNm > fuelEff.distanceNm, 'Safest > Fuel-Efficient distance');
      assert.ok(fuelEff.distanceNm > balanced.distanceNm, 'Fuel-Efficient > Balanced distance');
      assert.ok(balanced.distanceNm > shortest.distanceNm, 'Balanced > Shortest distance');

      // RIO hierarchy: Safest (+24.2) > Balanced (+16.8) > Fuel-Efficient (+11.5) > Shortest (-3.2)
      assert.ok(safest.rio.score > balanced.rio.score, 'Safest RIO > Balanced RIO');
      assert.ok(balanced.rio.score > fuelEff.rio.score, 'Balanced RIO > Fuel-Efficient RIO');
      assert.ok(fuelEff.rio.score > shortest.rio.score, 'Fuel-Efficient RIO > Shortest RIO');

      // Risk hierarchy: Shortest (74) > Fuel-Efficient (45) > Balanced (31) > Safest (22)
      assert.ok(shortest.averageRiskScore > fuelEff.averageRiskScore, 'Shortest risk > Fuel-Efficient risk');
      assert.ok(fuelEff.averageRiskScore > balanced.averageRiskScore, 'Fuel-Efficient risk > Balanced risk');
      assert.ok(balanced.averageRiskScore > safest.averageRiskScore, 'Balanced risk > Safest risk');

      // Bunker consumption: Fuel-Efficient must be strictly lowest
      assert.ok(fuelEff.fuelTons < balanced.fuelTons, 'Fuel-Efficient burns less than Balanced');
      assert.ok(fuelEff.fuelTons < shortest.fuelTons, 'Fuel-Efficient burns less than Shortest');
      assert.ok(fuelEff.fuelTons < safest.fuelTons, 'Fuel-Efficient burns less than Safest');

      // ETA: Balanced must deliver fastest voyage duration
      assert.ok(balanced.etaHours < shortest.etaHours, 'Balanced faster than Shortest');
      assert.ok(balanced.etaHours < fuelEff.etaHours, 'Balanced faster than Fuel-Efficient');
      assert.ok(balanced.etaHours < safest.etaHours, 'Balanced faster than Safest');

      // Status partitioning: Only Shortest is MARGINAL
      assert.strictEqual(shortest.rio.status, 'MARGINAL');
      assert.strictEqual(safest.rio.status, 'PASS');
      assert.strictEqual(fuelEff.rio.status, 'PASS');
      assert.strictEqual(balanced.rio.status, 'PASS');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Dynamic Pathway State Transition & Telemetry Reactivity
  // --------------------------------------------------------------------------
  describe('3. Dynamic Pathway State Transition & Telemetry Reactivity', () => {
    it('dynamically resolves all enriched telemetry when active pathway changes', () => {
      const corridors: RouteId[] = ['shortest', 'safest', 'fuel_efficient', 'balanced'];

      for (const targetId of corridors) {
        const resolved = BASELINE_ROUTES.find((r) => r.id === targetId) ?? BASELINE_ROUTES[3];
        assert.strictEqual(resolved.id, targetId);

        // Verify waypoints react
        assert.ok(resolved.waypoints.length >= 4);
        assert.strictEqual(resolved.waypoints[0].name, 'Maxwell Bay Departure');
        assert.strictEqual(resolved.waypoints[resolved.waypoints.length - 1].cumulativeNm, resolved.distanceNm);

        // Verify RIO reacts
        assert.ok(typeof resolved.rio.score === 'number');
        assert.ok(resolved.rio.scoreFormatted.length > 0);

        // Verify ice breakdown reacts
        assert.ok(resolved.iceExposure.peakLocation.length > 0);
        assert.ok(resolved.iceExposure.openWaterPct > 0);

        // Verify AI rationale reacts
        assert.ok(resolved.aiRationale.algorithm.length > 0);
      }
    });

    it('safely falls back to recommended balanced route when an invalid ID is provided', () => {
      const fallback = BASELINE_ROUTES.find((r) => r.id === ('invalid_corridor_xyz' as RouteId)) ?? BASELINE_ROUTES[3];
      assert.strictEqual(fallback.id, 'balanced');
      assert.strictEqual(fallback.name, 'Recommended Balanced');
      assert.strictEqual(fallback.distanceNm, 445);
      assert.strictEqual(fallback.rio.scoreFormatted, '+16.8');
    });
  });

  // --------------------------------------------------------------------------
  // 4. SessionStorage Persistence & SSR Hydration Guard
  // --------------------------------------------------------------------------
  describe('4. SessionStorage Persistence & SSR Hydration Guard', () => {
    it('getPersistedRouteId returns null in SSR environment without window', () => {
      // In node environment, window is undefined
      const id = getPersistedRouteId();
      assert.strictEqual(id, null, 'SSR environment must return null safely');
    });

    it('persists and hydrates active route in mock browser sessionStorage', () => {
      const mockStorage: Record<string, string> = {};

      // Mock browser window.sessionStorage
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
        // Initial state before persistence
        assert.strictEqual(getPersistedRouteId(), null);

        // Set safest
        setPersistedRouteId('safest');
        assert.strictEqual(mockStorage[ROUTE_STORAGE_KEY], 'safest');
        assert.strictEqual(getPersistedRouteId(), 'safest');

        // Set shortest
        setPersistedRouteId('shortest');
        assert.strictEqual(mockStorage[ROUTE_STORAGE_KEY], 'shortest');
        assert.strictEqual(getPersistedRouteId(), 'shortest');

        // Set fuel_efficient
        setPersistedRouteId('fuel_efficient');
        assert.strictEqual(getPersistedRouteId(), 'fuel_efficient');

        // Set balanced
        setPersistedRouteId('balanced');
        assert.strictEqual(getPersistedRouteId(), 'balanced');

        // Invalid corridor injected in sessionStorage should be rejected safely
        mockStorage[ROUTE_STORAGE_KEY] = 'rogue_route_hack';
        assert.strictEqual(getPersistedRouteId(), null, 'Invalid corridor in storage must return null');

        // Gracefully handles throwing sessionStorage (e.g. QuotaExceeded or security exception)
        (globalThis as any).window.sessionStorage.getItem = () => {
          throw new Error('AccessDenied');
        };
        assert.strictEqual(getPersistedRouteId(), null, 'Should catch storage exceptions and return null');

        (globalThis as any).window.sessionStorage.setItem = () => {
          throw new Error('QuotaExceeded');
        };
        // Should not throw
        assert.doesNotThrow(() => setPersistedRouteId('safest'));
      } finally {
        if (originalWindow === undefined) {
          delete (globalThis as any).window;
        } else {
          (globalThis as any).window = originalWindow;
        }
      }
    });
  });
});
