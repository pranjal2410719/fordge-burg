import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VESSELS,
  MISSIONS,
  BASELINE_ROUTES,
  MITIGATIONS,
  DEFAULTS,
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

describe('Adversarial Boundary & Integrity Verification', () => {
  describe('coordToSvg Projection Boundaries & Extreme Inputs', () => {
    it('verifies exact 4-corner coordinate mapping to SVG viewBox', () => {
      // Top-Left: Lat -62.0, Lon -64.0 -> (0, 0)
      const tl = coordToSvg(-62.0, -64.0, 1000, 650);
      assert.strictEqual(Math.round(tl.x), 0);
      assert.strictEqual(Math.round(tl.y), 0);

      // Top-Right: Lat -62.0, Lon -54.0 -> (1000, 0)
      const tr = coordToSvg(-62.0, -54.0, 1000, 650);
      assert.strictEqual(Math.round(tr.x), 1000);
      assert.strictEqual(Math.round(tr.y), 0);

      // Bottom-Left: Lat -66.5, Lon -64.0 -> (0, 650)
      const bl = coordToSvg(-66.5, -64.0, 1000, 650);
      assert.strictEqual(Math.round(bl.x), 0);
      assert.strictEqual(Math.round(bl.y), 650);

      // Bottom-Right: Lat -66.5, Lon -54.0 -> (1000, 650)
      const br = coordToSvg(-66.5, -54.0, 1000, 650);
      assert.strictEqual(Math.round(br.x), 1000);
      assert.strictEqual(Math.round(br.y), 650);
    });

    it('clamps 4-quadrant extreme out-of-bounds coordinates', () => {
      // North-East (+90, +180) -> clamped to (1000, 0)
      const ne = coordToSvg(90, 180, 1000, 650);
      assert.strictEqual(ne.x, 1000);
      assert.strictEqual(ne.y, 0);

      // South-West (-90, -180) -> clamped to (0, 650)
      const sw = coordToSvg(-90, -180, 1000, 650);
      assert.strictEqual(sw.x, 0);
      assert.strictEqual(sw.y, 650);

      // North-West (+90, -180) -> clamped to (0, 0)
      const nw = coordToSvg(90, -180, 1000, 650);
      assert.strictEqual(nw.x, 0);
      assert.strictEqual(nw.y, 0);

      // South-East (-90, +180) -> clamped to (1000, 650)
      const se = coordToSvg(-90, 180, 1000, 650);
      assert.strictEqual(se.x, 1000);
      assert.strictEqual(se.y, 650);
    });

    it('handles infinite inputs via math clamping without throwing', () => {
      const posInf = coordToSvg(Infinity, Infinity, 1000, 650);
      assert.strictEqual(posInf.x, 1000);
      assert.strictEqual(posInf.y, 0);

      const negInf = coordToSvg(-Infinity, -Infinity, 1000, 650);
      assert.strictEqual(negInf.x, 0);
      assert.strictEqual(negInf.y, 650);
    });

    it('sub-micro-degree boundary stability', () => {
      // Just inside northwest boundary
      const pIn = coordToSvg(-62.000001, -63.999999, 1000, 650);
      assert.ok(pIn.x >= 0 && pIn.x < 1);
      assert.ok(pIn.y >= 0 && pIn.y < 1);

      // Just outside northwest boundary
      const pOut = coordToSvg(-61.999999, -64.000001, 1000, 650);
      assert.strictEqual(pOut.x, 0);
      assert.strictEqual(pOut.y, 0);
    });
  });

  describe('Risk Classification Micro-Thresholds', () => {
    it('verifies strict epsilon boundary behavior around 35 and 65', () => {
      const eps = 1e-9;
      // Exactly at and around 35
      assert.strictEqual(riskLabel(35 - eps), 'LOW');
      assert.strictEqual(riskLabel(35), 'MODERATE');
      assert.strictEqual(riskLabel(35 + eps), 'MODERATE');

      // Exactly at and around 65
      assert.strictEqual(riskLabel(65 - eps), 'MODERATE');
      assert.strictEqual(riskLabel(65), 'HIGH');
      assert.strictEqual(riskLabel(65 + eps), 'HIGH');

      // Badges consistency
      assert.ok(riskBadge(34.9999).includes('bg-risk-low-bg'));
      assert.ok(riskBadge(35).includes('bg-risk-med-bg'));
      assert.ok(riskBadge(64.9999).includes('bg-risk-med-bg'));
      assert.ok(riskBadge(65).includes('bg-risk-high-bg'));

      // Bars consistency
      assert.strictEqual(riskBar(34.9999), 'bg-risk-low');
      assert.strictEqual(riskBar(35), 'bg-risk-med');
      assert.strictEqual(riskBar(64.9999), 'bg-risk-med');
      assert.strictEqual(riskBar(65), 'bg-risk-high');
    });
  });

  describe('Formatting Utilities with Boundary Numbers', () => {
    it('handles negative, zero, and extreme magnitudes', () => {
      // Nautical Miles
      assert.strictEqual(formatNauticalMiles(0), '0 NM');
      assert.strictEqual(formatNauticalMiles(10000), '10000 NM');
      assert.strictEqual(formatNauticalMiles(-15.4), '-15 NM');

      // Knots
      assert.strictEqual(formatKnots(0), '0.0 kn');
      assert.strictEqual(formatKnots(0.04), '0.0 kn');
      assert.strictEqual(formatKnots(0.06), '0.1 kn');

      // Hours
      assert.strictEqual(formatHours(0), '0.0 hrs');
      assert.strictEqual(formatHours(100.04), '100.0 hrs');

      // Fuel Tons
      assert.strictEqual(formatFuelTons(0), '0.0 MT');
      assert.strictEqual(formatFuelTons(999.95), '1000.0 MT');

      // Meters
      assert.strictEqual(formatMeters(0), '0 m');
      assert.strictEqual(formatMeters(300), '300 m');

      // Percent
      assert.strictEqual(formatPercent(0), '0%');
      assert.strictEqual(formatPercent(100), '100%');
      assert.strictEqual(formatPercent(99.4), '99%');
      assert.strictEqual(formatPercent(99.6), '100%');
    });
  });

  describe('cn Classname Combinator Edge Cases', () => {
    it('handles nested structures, falsy values, and complex objects', () => {
      const res = cn(
        'base',
        ['nested-1', ['nested-2']],
        null,
        undefined,
        false,
        '',
        0,
        { active: true, disabled: false, highlighted: 1 > 0 }
      );
      assert.strictEqual(res, 'base nested-1 nested-2 active highlighted');
    });
  });

  describe('Deep Data Integrity & Physical Coherence', () => {
    it('verifies speed & fuel physics across all baseline routes', () => {
      for (const route of BASELINE_ROUTES) {
        const impliedSpeedKn = route.distanceNm / route.etaHours;
        // Speeds in Antarctic waters should be realistic (8-16 knots)
        assert.ok(
          impliedSpeedKn >= 8 && impliedSpeedKn <= 16,
          `Implied speed ${impliedSpeedKn} kn for ${route.id} is unrealistic`
        );

        const durationDays = route.etaHours / 24;
        const dailyBurnMT = route.fuelTons / durationDays;
        // Daily fuel burn for polar vessels should be realistic (15-45 MT/day)
        assert.ok(
          dailyBurnMT >= 15 && dailyBurnMT <= 45,
          `Implied fuel burn ${dailyBurnMT} MT/day for ${route.id} is unrealistic`
        );
      }
    });

    it('verifies strict monotonic risk ordering between routes', () => {
      const safest = BASELINE_ROUTES.find(r => r.id === 'safest')!;
      const balanced = BASELINE_ROUTES.find(r => r.id === 'balanced')!;
      const fuel = BASELINE_ROUTES.find(r => r.id === 'fuel_efficient')!;
      const shortest = BASELINE_ROUTES.find(r => r.id === 'shortest')!;

      assert.ok(safest.averageRiskScore < balanced.averageRiskScore);
      assert.ok(balanced.averageRiskScore < fuel.averageRiskScore);
      assert.ok(fuel.averageRiskScore < shortest.averageRiskScore);
    });

    it('verifies dimensional physics for all vessels: LOA > beam > draft', () => {
      for (const vessel of VESSELS) {
        assert.ok(vessel.loaM > vessel.beamM, `LOA must exceed beam: ${vessel.id}`);
        assert.ok(vessel.beamM > vessel.draftM, `Beam must exceed draft: ${vessel.id}`);
        assert.ok(vessel.openWaterKn > vessel.iceLimitKn, `Open water speed must exceed ice speed: ${vessel.id}`);
      }
    });

    it('verifies missions have distinct origin and destination points', () => {
      for (const mission of MISSIONS) {
        assert.notStrictEqual(mission.origin, mission.destination);
      }
    });

    it('verifies DEFAULTS points to valid active records', () => {
      assert.ok(VESSELS.some(v => v.id === DEFAULTS.vesselId));
      assert.ok(MISSIONS.some(m => m.id === DEFAULTS.missionId));
      assert.ok(BASELINE_ROUTES.some(r => r.id === DEFAULTS.routeId));
    });
  });
});
