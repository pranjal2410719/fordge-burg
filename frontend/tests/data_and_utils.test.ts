import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VESSELS,
  MISSIONS,
  BASELINE_ROUTES,
  MITIGATIONS,
  DEFAULTS,
  type Vessel,
  type Mission,
  type RouteAlternative,
  type Mitigation,
} from '../lib/data';
import {
  cn,
  formatNauticalMiles,
  formatKnots,
  formatHours,
  formatFuelTons,
  formatMeters,
  formatPercent,
  riskLabel,
  riskBadge,
  riskBar,
  coordToSvg,
} from '../lib/utils';

// Conforming aliases as specified in test requirements
const ROUTES = BASELINE_ROUTES;

describe('Data Models (lib/data.ts)', () => {
  describe('VESSELS Model', () => {
    it('should contain exactly 5 vessels with valid schemas', () => {
      assert.strictEqual(VESSELS.length, 5);
      const validIceClasses = ['PC2', 'PC4', 'PC5', 'OpenWater'];
      const ids = new Set<string>();

      for (const vessel of VESSELS) {
        assert.ok(vessel.id && typeof vessel.id === 'string', 'Vessel must have an id');
        assert.ok(vessel.name && typeof vessel.name === 'string', 'Vessel must have a name');
        assert.ok(validIceClasses.includes(vessel.iceClass), `Invalid ice class: ${vessel.iceClass}`);
        assert.ok(vessel.loaM > 0, 'loaM must be positive');
        assert.ok(vessel.beamM > 0, 'beamM must be positive');
        assert.ok(vessel.draftM > 0, 'draftM must be positive');
        assert.ok(vessel.openWaterKn > 0, 'openWaterKn must be positive');
        assert.ok(vessel.iceLimitKn > 0, 'iceLimitKn must be positive');
        assert.ok(vessel.fuelTonsPerDay > 0, 'fuelTonsPerDay must be positive');

        // Physical plausibility: beam should be narrower than length
        assert.ok(vessel.beamM < vessel.loaM, 'Beam should be smaller than LOA');
        // Open water speed should exceed or equal ice speed limit
        assert.ok(vessel.openWaterKn >= vessel.iceLimitKn, 'Open water speed should exceed ice speed');

        assert.ok(!ids.has(vessel.id), `Duplicate vessel id: ${vessel.id}`);
        ids.add(vessel.id);
      }
    });

    it('should include the primary mission vessel Le Commandant Charcot and Sir David Attenborough', () => {
      const charcot = VESSELS.find(v => v.id === 'vessel-charcot-pc2');
      assert.ok(charcot, 'Le Commandant Charcot must exist');
      assert.strictEqual(charcot?.iceClass, 'PC2');

      const attenborough = VESSELS.find(v => v.id === 'vessel-attenborough-pc4');
      assert.ok(attenborough, 'Sir David Attenborough must exist');
      assert.strictEqual(attenborough?.iceClass, 'PC4');
    });
  });

  describe('MISSIONS Model', () => {
    it('should contain exactly 3 missions with valid origins, destinations, and distances', () => {
      assert.strictEqual(MISSIONS.length, 3);
      const ids = new Set<string>();

      for (const mission of MISSIONS) {
        assert.ok(mission.id && typeof mission.id === 'string');
        assert.ok(mission.name && typeof mission.name === 'string');
        assert.ok(mission.origin && typeof mission.origin === 'string');
        assert.ok(mission.destination && typeof mission.destination === 'string');
        assert.ok(mission.distanceNm > 0, 'Mission distance must be positive');

        assert.ok(!ids.has(mission.id), `Duplicate mission id: ${mission.id}`);
        ids.add(mission.id);
      }
    });

    it('should include Weddell Sea Science Transect as default mission', () => {
      const weddell = MISSIONS.find(m => m.id === 'mission-weddell-transect');
      assert.ok(weddell, 'Weddell mission must exist');
      assert.strictEqual(weddell?.origin, 'Maxwell Bay');
      assert.strictEqual(weddell?.destination, 'Weddell Outpost Alpha');
    });
  });

  describe('ROUTES / BASELINE_ROUTES Model', () => {
    it('should contain 4 baseline route alternatives with required attributes', () => {
      assert.strictEqual(ROUTES.length, 4);
      const expectedIds = ['shortest', 'safest', 'fuel_efficient', 'balanced'];
      const routeIds = ROUTES.map(r => r.id);

      assert.deepStrictEqual(routeIds.sort(), expectedIds.sort());

      for (const route of ROUTES) {
        assert.ok(route.name && typeof route.name === 'string');
        assert.ok(route.tradeOff && typeof route.tradeOff === 'string');
        assert.ok(route.distanceNm > 0, 'Route distance must be positive');
        assert.ok(route.etaHours > 0, 'ETA hours must be positive');
        assert.ok(route.fuelTons > 0, 'Fuel consumption must be positive');
        assert.ok(route.averageRiskScore >= 0 && route.averageRiskScore <= 100, 'Average risk score must be 0-100');
        assert.ok(route.maxRiskScore >= 0 && route.maxRiskScore <= 100, 'Max risk score must be 0-100');
        assert.ok(route.maxRiskScore >= route.averageRiskScore, 'Max risk must be >= average risk');
        assert.ok(['high', 'marginal', 'low'].includes(route.compatibility), `Invalid compatibility: ${route.compatibility}`);
      }
    });

    it('safest route should have lowest average risk and shortest route highest risk', () => {
      const safest = ROUTES.find(r => r.id === 'safest');
      const shortest = ROUTES.find(r => r.id === 'shortest');
      assert.ok(safest && shortest);
      assert.ok(safest.averageRiskScore < shortest.averageRiskScore, 'Safest route should have lower risk than shortest route');
    });
  });

  describe('MITIGATIONS Model', () => {
    it('should contain 7 actionable polar mitigations with valid statuses', () => {
      assert.strictEqual(MITIGATIONS.length, 7);
      const validStatuses = ['mandatory', 'recommended', 'advisory'];
      const ids = new Set<string>();

      for (const m of MITIGATIONS) {
        assert.ok(m.id && typeof m.id === 'string');
        assert.ok(m.title && typeof m.title === 'string');
        assert.ok(m.detail && typeof m.detail === 'string');
        assert.ok(validStatuses.includes(m.status), `Invalid mitigation status: ${m.status}`);

        assert.ok(!ids.has(m.id), `Duplicate mitigation id: ${m.id}`);
        ids.add(m.id);
      }
    });

    it('should include critical iceberg standoff and speed throttle mitigations', () => {
      const speedMitigation = MITIGATIONS.find(m => m.id === 'm1');
      assert.ok(speedMitigation);
      assert.strictEqual(speedMitigation.status, 'mandatory');

      const standoffMitigation = MITIGATIONS.find(m => m.id === 'm2');
      assert.ok(standoffMitigation);
      assert.strictEqual(standoffMitigation.status, 'mandatory');
    });
  });

  describe('DEFAULTS Configuration', () => {
    it('should reference valid foreign keys in VESSELS, MISSIONS, and ROUTES', () => {
      assert.ok(MISSIONS.some(m => m.id === DEFAULTS.missionId), 'Default missionId must exist');
      assert.ok(VESSELS.some(v => v.id === DEFAULTS.vesselId), 'Default vesselId must exist');
      assert.ok(ROUTES.some(r => r.id === DEFAULTS.routeId), 'Default routeId must exist');
      assert.ok([1, 3, 7].includes(DEFAULTS.horizon), 'Default horizon must be 1, 3, or 7');
      assert.ok(['balanced', 'safety', 'fuel', 'time'].includes(DEFAULTS.preference), 'Default preference must be valid');
    });
  });
});

describe('Utility Functions (lib/utils.ts)', () => {
  describe('cn (Class Names Concatenation)', () => {
    it('should correctly join class strings and ignore conditional falsy values', () => {
      assert.strictEqual(cn('base', 'extra'), 'base extra');
      assert.strictEqual(cn('base', false && 'hidden', undefined, null, 'active'), 'base active');
      assert.strictEqual(cn({ 'bg-blue-500': true, 'text-white': false }), 'bg-blue-500');
    });
  });

  describe('formatNumber & Formatting Utilities', () => {
    it('formatNauticalMiles formats values with 0 decimals and NM unit', () => {
      assert.strictEqual(formatNauticalMiles(445), '445 NM');
      assert.strictEqual(formatNauticalMiles(319.8), '320 NM');
      assert.strictEqual(formatNauticalMiles(0), '0 NM');
    });

    it('formatKnots formats values with 1 decimal and kn unit', () => {
      assert.strictEqual(formatKnots(14.5), '14.5 kn');
      assert.strictEqual(formatKnots(12), '12.0 kn');
      assert.strictEqual(formatKnots(8.55), '8.6 kn');
      assert.ok(formatKnots(8.55).endsWith(' kn'));
    });

    it('formatHours formats hours with 1 decimal and hrs unit', () => {
      assert.strictEqual(formatHours(37.1), '37.1 hrs');
      assert.strictEqual(formatHours(44), '44.0 hrs');
    });

    it('formatFuelTons formats fuel consumption with 1 decimal and MT unit', () => {
      assert.strictEqual(formatFuelTons(42.9), '42.9 MT');
      assert.strictEqual(formatFuelTons(50), '50.0 MT');
    });

    it('formatMeters formats raw integer or float with m unit', () => {
      assert.strictEqual(formatMeters(150), '150 m');
      assert.strictEqual(formatMeters(28), '28 m');
    });

    it('formatPercent formats percentage values with 0 decimals and % sign', () => {
      assert.strictEqual(formatPercent(45), '45%');
      assert.strictEqual(formatPercent(87.6), '88%');
      assert.strictEqual(formatPercent(0), '0%');
    });
  });

  describe('Risk Classification (riskLevel / riskColor / riskBgColor)', () => {
    it('riskLabel correctly assigns LOW, MODERATE, HIGH across threshold boundaries', () => {
      // Low risk: score < 35
      assert.strictEqual(riskLabel(0), 'LOW');
      assert.strictEqual(riskLabel(20), 'LOW');
      assert.strictEqual(riskLabel(34.9), 'LOW');

      // Moderate risk: 35 <= score < 65
      assert.strictEqual(riskLabel(35), 'MODERATE');
      assert.strictEqual(riskLabel(50), 'MODERATE');
      assert.strictEqual(riskLabel(64.9), 'MODERATE');

      // High risk: score >= 65
      assert.strictEqual(riskLabel(65), 'HIGH');
      assert.strictEqual(riskLabel(88), 'HIGH');
      assert.strictEqual(riskLabel(100), 'HIGH');
    });

    it('riskBadge returns correct background, text, and border classes', () => {
      // LOW: < 35
      const lowBadge = riskBadge(25);
      assert.ok(lowBadge.includes('bg-risk-low-bg'), 'LOW badge should have bg-risk-low-bg');
      assert.ok(lowBadge.includes('text-risk-low'), 'LOW badge should have text-risk-low');

      // MODERATE: 35 <= score < 65
      const medBadge = riskBadge(45);
      assert.ok(medBadge.includes('bg-risk-med-bg'), 'MODERATE badge should have bg-risk-med-bg');
      assert.ok(medBadge.includes('text-risk-med'), 'MODERATE badge should have text-risk-med');

      // HIGH: >= 65
      const highBadge = riskBadge(75);
      assert.ok(highBadge.includes('bg-risk-high-bg'), 'HIGH badge should have bg-risk-high-bg');
      assert.ok(highBadge.includes('text-risk-high'), 'HIGH badge should have text-risk-high');
    });

    it('riskBar returns matching risk background bar classes', () => {
      assert.strictEqual(riskBar(15), 'bg-risk-low');
      assert.strictEqual(riskBar(34.9), 'bg-risk-low');
      assert.strictEqual(riskBar(35), 'bg-risk-med');
      assert.strictEqual(riskBar(60), 'bg-risk-med');
      assert.strictEqual(riskBar(65), 'bg-risk-high');
      assert.strictEqual(riskBar(95), 'bg-risk-high');
    });
  });

  describe('Coordinate Conversions (coordToSvg)', () => {
    // Antarctic sector: 62.0°S – 66.5°S × 54.0°W – 64.0°W → 1000 × 650 SVG
    it('correctly maps the top-left boundary (-62.0°S, -64.0°W) to (0, 0)', () => {
      const { x, y } = coordToSvg(-62.0, -64.0, 1000, 650);
      assert.strictEqual(Math.round(x), 0);
      assert.strictEqual(Math.round(y), 0);
    });

    it('correctly maps the bottom-right boundary (-66.5°S, -54.0°W) to (1000, 650)', () => {
      const { x, y } = coordToSvg(-66.5, -54.0, 1000, 650);
      assert.strictEqual(Math.round(x), 1000);
      assert.strictEqual(Math.round(y), 650);
    });

    it('correctly maps the sector midpoint (-64.25°S, -59.0°W) to (500, 325)', () => {
      const { x, y } = coordToSvg(-64.25, -59.0, 1000, 650);
      assert.strictEqual(Math.round(x), 500);
      assert.strictEqual(Math.round(y), 325);
    });

    it('supports custom SVG dimensions', () => {
      const { x, y } = coordToSvg(-66.5, -54.0, 800, 400);
      assert.strictEqual(Math.round(x), 800);
      assert.strictEqual(Math.round(y), 400);
    });

    it('clamps coordinates that fall outside the sector bounding box', () => {
      // Far north-west out of bounds
      const nwClamped = coordToSvg(-60.0, -70.0, 1000, 650);
      assert.strictEqual(nwClamped.x, 0);
      assert.strictEqual(nwClamped.y, 0);

      // Far south-east out of bounds
      const seClamped = coordToSvg(-70.0, -50.0, 1000, 650);
      assert.strictEqual(seClamped.x, 1000);
      assert.strictEqual(seClamped.y, 650);
    });

    it('calculates linear interpolation correctly for intermediate coordinates', () => {
      // Lat: -63.5, Lon: -59.0
      // x: ((-59 + 64) / 10) * 1000 = 500
      // y: ((-62 - (-63.5)) / 4.5) * 650 = (1.5 / 4.5) * 650 = 216.666...
      const result = coordToSvg(-63.5, -59.0, 1000, 650);
      assert.strictEqual(Math.round(result.x), 500);
      assert.strictEqual(Math.round(result.y), Math.round((1.5 / 4.5) * 650));
    });
  });

  describe('Risk Classification Boundary Extremes', () => {
    it('handles negative or overflow scores gracefully', () => {
      assert.strictEqual(riskLabel(-100), 'LOW');
      assert.strictEqual(riskLabel(999), 'HIGH');
      assert.ok(riskBadge(-5).includes('bg-risk-low-bg'));
      assert.ok(riskBadge(200).includes('bg-risk-high-bg'));
      assert.strictEqual(riskBar(-1), 'bg-risk-low');
      assert.strictEqual(riskBar(500), 'bg-risk-high');
    });
  });
});
