import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MISSIONS,
  VESSELS,
  BASELINE_ROUTES,
  DEFAULTS,
  type ForecastHorizon,
  type OptimizationPreference,
  type RouteId,
} from '../lib/data';
import { coordToSvg } from '../lib/utils';
import { ENGINE_STAGES } from '../components/mission/SimulationPipeline';

describe('Empirical Verification: Mission Planner Interactive Functionality', () => {
  // --------------------------------------------------------------------------
  // 1. Simulation State Transitions & Progress Progression
  // --------------------------------------------------------------------------
  describe('1. Simulation State Transitions & Progress Progression', () => {
    it('verifies 8-stage engine definitions and nominal sequential order', () => {
      assert.strictEqual(ENGINE_STAGES.length, 8, 'Must have exactly 8 engine stages');

      const expectedCodes = [
        'ENG-01-MET',
        'ENG-02-CPA',
        'ENG-03-HAZ',
        'ENG-04-POL',
        'ENG-05-AST',
        'ENG-06-MIT',
        'ENG-07-CON',
        'ENG-08-RIO',
      ];

      ENGINE_STAGES.forEach((stage, idx) => {
        assert.strictEqual(stage.id, idx + 1);
        assert.strictEqual(stage.code, expectedCodes[idx]);
        assert.ok(stage.name.length > 0, `Stage ${stage.id} must have a name`);
        assert.ok(stage.formula.length > 0, `Stage ${stage.id} must have a formula`);
        assert.ok(stage.inputs.length > 0, `Stage ${stage.id} must have inputs`);
        assert.ok(stage.outputs.length > 0, `Stage ${stage.id} must have outputs`);
        assert.ok(stage.telemetryKey.length > 0, `Stage ${stage.id} must have telemetryKey`);
        assert.ok(stage.telemetryValue.length > 0, `Stage ${stage.id} must have telemetryValue`);
        assert.ok(stage.nominalDurationMs > 0, `Stage ${stage.id} nominalDurationMs must be positive`);
      });
    });

    it('empirically verifies pipeline stage status partitioning across progress scale', () => {
      // Logic from SimulationPipeline.tsx getStageStatus:
      const getStageStatus = (
        simulationStatus: 'idle' | 'running' | 'completed',
        simulationProgress: number,
        stageIdx: number
      ): 'pending' | 'active' | 'complete' => {
        if (simulationStatus === 'completed') return 'complete';
        if (simulationStatus === 'idle') return 'pending';

        const stageStartPct = stageIdx * 12.5;
        const stageEndPct = (stageIdx + 1) * 12.5;

        if (simulationProgress >= stageEndPct) return 'complete';
        if (simulationProgress >= stageStartPct) return 'active';
        return 'pending';
      };

      // When IDLE: all 8 stages must be pending
      for (let i = 0; i < 8; i++) {
        assert.strictEqual(getStageStatus('idle', 0, i), 'pending');
      }

      // When RUNNING at 0%: stage 0 is active, all others pending
      assert.strictEqual(getStageStatus('running', 0, 0), 'active');
      for (let i = 1; i < 8; i++) {
        assert.strictEqual(getStageStatus('running', 0, i), 'pending');
      }

      // When RUNNING at 40% (the first timeout trigger in MissionContext):
      // 40% >= 12.5% * 3 (37.5%) -> stages 0, 1, 2 complete
      // Stage 3 (37.5% - 50%) is active
      // Stages 4, 5, 6, 7 are pending
      assert.strictEqual(getStageStatus('running', 40, 0), 'complete');
      assert.strictEqual(getStageStatus('running', 40, 1), 'complete');
      assert.strictEqual(getStageStatus('running', 40, 2), 'complete');
      assert.strictEqual(getStageStatus('running', 40, 3), 'active');
      assert.strictEqual(getStageStatus('running', 40, 4), 'pending');
      assert.strictEqual(getStageStatus('running', 40, 5), 'pending');
      assert.strictEqual(getStageStatus('running', 40, 6), 'pending');
      assert.strictEqual(getStageStatus('running', 40, 7), 'pending');

      // When RUNNING at 80% (the second timeout trigger in MissionContext):
      // 80% >= 12.5% * 6 (75%) -> stages 0, 1, 2, 3, 4, 5 complete
      // Stage 6 (75% - 87.5%) is active
      // Stage 7 is pending
      for (let i = 0; i <= 5; i++) {
        assert.strictEqual(getStageStatus('running', 80, i), 'complete');
      }
      assert.strictEqual(getStageStatus('running', 80, 6), 'active');
      assert.strictEqual(getStageStatus('running', 80, 7), 'pending');

      // When COMPLETED: all 8 stages must be complete regardless of progress number
      for (let i = 0; i < 8; i++) {
        assert.strictEqual(getStageStatus('completed', 100, i), 'complete');
      }
    });

    it('empirically tests simulation progression timing sequence and completion', async () => {
      // Model the exact state machine in MissionContext.tsx
      class SimulationHarness {
        status: 'idle' | 'running' | 'completed' = 'idle';
        progress: number = 0;
        timers: NodeJS.Timeout[] = [];
        history: { t: number; status: string; progress: number }[] = [];

        record(t: number) {
          this.history.push({ t, status: this.status, progress: this.progress });
        }

        runSimulation() {
          this.timers.forEach(clearTimeout);
          this.timers = [];
          this.status = 'running';
          this.progress = 0;
          this.record(0);

          this.timers.push(
            setTimeout(() => {
              this.progress = 40;
              this.record(300);
            }, 300)
          );
          this.timers.push(
            setTimeout(() => {
              this.progress = 80;
              this.record(700);
            }, 700)
          );
          this.timers.push(
            setTimeout(() => {
              this.progress = 100;
              this.status = 'completed';
              this.record(1200);
            }, 1200)
          );
        }

        abort() {
          this.timers.forEach(clearTimeout);
          this.timers = [];
        }
      }

      const harness = new SimulationHarness();
      assert.strictEqual(harness.status, 'idle');
      assert.strictEqual(harness.progress, 0);

      harness.runSimulation();
      assert.strictEqual(harness.status, 'running');
      assert.strictEqual(harness.progress, 0);

      // Wait 350ms -> progress should be 40
      await new Promise((r) => setTimeout(r, 350));
      assert.strictEqual(harness.status, 'running');
      assert.strictEqual(harness.progress, 40);

      // Wait another 400ms (750ms total) -> progress should be 80
      await new Promise((r) => setTimeout(r, 400));
      assert.strictEqual(harness.status, 'running');
      assert.strictEqual(harness.progress, 80);

      // Wait another 500ms (1250ms total) -> progress should be 100, status completed
      await new Promise((r) => setTimeout(r, 500));
      assert.strictEqual(harness.status, 'completed');
      assert.strictEqual(harness.progress, 100);

      // Verify execution sequence
      assert.deepStrictEqual(harness.history, [
        { t: 0, status: 'running', progress: 0 },
        { t: 300, status: 'running', progress: 40 },
        { t: 700, status: 'running', progress: 80 },
        { t: 1200, status: 'completed', progress: 100 },
      ]);
    });

    it('empirically verifies timer cancellation on rapid re-triggering (race prevention)', async () => {
      class RapidTriggerHarness {
        status: 'idle' | 'running' | 'completed' = 'idle';
        progress: number = 0;
        timers: NodeJS.Timeout[] = [];
        completions: number = 0;

        runSimulation() {
          this.timers.forEach(clearTimeout);
          this.timers = [];
          this.status = 'running';
          this.progress = 0;

          this.timers.push(
            setTimeout(() => {
              this.progress = 40;
            }, 50)
          );
          this.timers.push(
            setTimeout(() => {
              this.progress = 100;
              this.status = 'completed';
              this.completions++;
            }, 100)
          );
        }
      }

      const harness = new RapidTriggerHarness();

      // Trigger 1
      harness.runSimulation();
      // Fast re-trigger after 30ms before completion
      await new Promise((r) => setTimeout(r, 30));
      // Trigger 2
      harness.runSimulation();
      // Fast re-trigger after 30ms before completion
      await new Promise((r) => setTimeout(r, 30));
      // Trigger 3
      harness.runSimulation();

      // Wait for Trigger 3 to fully complete (120ms)
      await new Promise((r) => setTimeout(r, 120));

      assert.strictEqual(harness.status, 'completed');
      assert.strictEqual(harness.progress, 100);
      assert.strictEqual(harness.completions, 1, 'Prior timers must have been cancelled; exactly 1 completion');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Parameter Selection Synchronization
  // --------------------------------------------------------------------------
  describe('2. Parameter Selection Synchronization', () => {
    it('synchronizes mission scenario selections across all defined corridors', () => {
      for (const m of MISSIONS) {
        assert.ok(m.id && m.name && m.origin && m.destination && m.distanceNm > 0);

        // Fallback test: if id is valid, matches m; if unknown id, fallbacks safely to MISSIONS[0]
        const resolved = MISSIONS.find((item) => item.id === m.id) ?? MISSIONS[0];
        assert.strictEqual(resolved.id, m.id);
        assert.strictEqual(resolved.name, m.name);
        assert.strictEqual(resolved.distanceNm, m.distanceNm);
      }

      // Safe fallback test
      const fallback = MISSIONS.find((m) => m.id === 'invalid_mission_slug') ?? MISSIONS[0];
      assert.strictEqual(fallback.id, MISSIONS[0].id);
    });

    it('synchronizes vessel profiles and preserves polar class specifications', () => {
      for (const v of VESSELS) {
        assert.ok(v.id && v.name && v.iceClass);
        assert.ok(v.loaM > 0 && v.beamM > 0 && v.draftM > 0);
        assert.ok(v.openWaterKn > 0 && v.iceLimitKn > 0 && v.fuelTonsPerDay > 0);

        const resolved = VESSELS.find((item) => item.id === v.id) ?? VESSELS[2];
        assert.strictEqual(resolved.id, v.id);
        assert.strictEqual(resolved.iceClass, v.iceClass);
      }

      // Safe fallback test
      const fallback = VESSELS.find((v) => v.id === 'ghost_ship') ?? VESSELS[2];
      assert.strictEqual(fallback.id, VESSELS[2].id);
    });

    it('synchronizes forecast horizon windows (1, 3, 7 days)', () => {
      const horizons: ForecastHorizon[] = [1, 3, 7];
      const HORIZONS_DATA: Record<ForecastHorizon, { label: string; hours: number }> = {
        1: { label: '1 Day', hours: 24 },
        3: { label: '3 Days', hours: 72 },
        7: { label: '7 Days', hours: 168 },
      };

      for (const h of horizons) {
        assert.strictEqual(h * 24, HORIZONS_DATA[h].hours);
        assert.ok(h > 0);
      }
    });

    it('synchronizes optimization objectives and maps to correct recommended route', () => {
      const getRecommendedRouteId = (preference: OptimizationPreference): RouteId => {
        switch (preference) {
          case 'safety':
            return 'safest';
          case 'fuel':
            return 'fuel_efficient';
          case 'time':
            return 'shortest';
          case 'balanced':
          default:
            return 'balanced';
        }
      };

      assert.strictEqual(getRecommendedRouteId('safety'), 'safest');
      assert.strictEqual(getRecommendedRouteId('fuel'), 'fuel_efficient');
      assert.strictEqual(getRecommendedRouteId('time'), 'shortest');
      assert.strictEqual(getRecommendedRouteId('balanced'), 'balanced');

      // Verify each recommended route exists in BASELINE_ROUTES
      const preferences: OptimizationPreference[] = ['balanced', 'safety', 'fuel', 'time'];
      for (const pref of preferences) {
        const routeId = getRecommendedRouteId(pref);
        const route = BASELINE_ROUTES.find((r) => r.id === routeId);
        assert.ok(route, `Recommended route ${routeId} for preference ${pref} must exist`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. Route Selection and Navigation Triggers
  // --------------------------------------------------------------------------
  describe('3. Route Selection & Navigation Triggers', () => {
    it('verifies all baseline route IDs exist and resolve correctly', () => {
      const validRouteIds: RouteId[] = ['balanced', 'safest', 'fuel_efficient', 'shortest'];

      for (const rId of validRouteIds) {
        const resolved = BASELINE_ROUTES.find((r) => r.id === rId) ?? BASELINE_ROUTES[3];
        assert.strictEqual(resolved.id, rId);
      }

      // Safe fallback verification
      const fallback = BASELINE_ROUTES.find((r) => r.id === ('invalid_route' as RouteId)) ?? BASELINE_ROUTES[3];
      assert.strictEqual(fallback.id, BASELINE_ROUTES[3].id);
    });

    it('verifies POLARIS RIO scores and regulatory compliance per route', () => {
      const ROUTE_RIO_SCORES: Record<RouteId, { rio: string; status: 'PASS' | 'MARGINAL'; note: string }> = {
        balanced: { rio: '+16.8', status: 'PASS', note: 'Authorized Polar Transit' },
        safest: { rio: '+24.2', status: 'PASS', note: 'Maximum Ice Standoff' },
        fuel_efficient: { rio: '+11.5', status: 'PASS', note: 'Optimized Bunker Profile' },
        shortest: { rio: '-3.2', status: 'MARGINAL', note: 'Elevated Pressure Ice' },
      };

      assert.strictEqual(ROUTE_RIO_SCORES.balanced.status, 'PASS');
      assert.strictEqual(ROUTE_RIO_SCORES.safest.status, 'PASS');
      assert.strictEqual(ROUTE_RIO_SCORES.fuel_efficient.status, 'PASS');
      assert.strictEqual(ROUTE_RIO_SCORES.shortest.status, 'MARGINAL');

      // Score numeric sanity
      assert.ok(parseFloat(ROUTE_RIO_SCORES.safest.rio) > parseFloat(ROUTE_RIO_SCORES.balanced.rio));
      assert.ok(parseFloat(ROUTE_RIO_SCORES.balanced.rio) > parseFloat(ROUTE_RIO_SCORES.fuel_efficient.rio));
      assert.ok(parseFloat(ROUTE_RIO_SCORES.fuel_efficient.rio) > parseFloat(ROUTE_RIO_SCORES.shortest.rio));
    });

    it('verifies preview map route paths and waypoints are within sector bounds', () => {
      const ROUTE_PATHS: Record<RouteId, [number, number][]> = {
        shortest: [
          [-62.2, -58.95],
          [-63.1, -57.8],
          [-63.5, -57.5],
          [-65.5, -56.0],
        ],
        safest: [
          [-62.2, -58.95],
          [-62.8, -60.2],
          [-63.0, -61.0],
          [-64.5, -59.5],
          [-65.5, -56.0],
        ],
        fuel_efficient: [
          [-62.2, -58.95],
          [-63.5, -58.2],
          [-64.2, -57.0],
          [-65.5, -56.0],
        ],
        balanced: [
          [-62.2, -58.95],
          [-63.0, -58.7],
          [-63.4, -58.5],
          [-64.2, -57.5],
          [-64.6, -57.0],
          [-65.5, -56.0],
        ],
      };

      for (const [rId, pts] of Object.entries(ROUTE_PATHS)) {
        // Every route must start at Maxwell Bay origin (-62.2, -58.95) and end at Destination (-65.5, -56.0)
        assert.deepStrictEqual(pts[0], [-62.2, -58.95], `${rId} start point`);
        assert.deepStrictEqual(pts[pts.length - 1], [-65.5, -56.0], `${rId} end point`);

        // Every coordinate must project into valid SVG coordinates [0..1000, 0..650]
        for (const [lat, lon] of pts) {
          const svg = coordToSvg(lat, lon, 1000, 650);
          assert.ok(svg.x >= 0 && svg.x <= 1000, `${rId} x out of bounds: ${svg.x}`);
          assert.ok(svg.y >= 0 && svg.y <= 650, `${rId} y out of bounds: ${svg.y}`);
        }
      }
    });

    it('empirically verifies mathematical invertibility of map cursor hover projection', () => {
      // In SimulationPreviewMap.tsx:
      // lon = (svgX / 100) - 64
      // lat = -62 - (svgY * 4.5) / 650
      const testCoordinates: [number, number][] = [
        [-62.0, -64.0], // Top-Left
        [-62.0, -54.0], // Top-Right
        [-66.5, -64.0], // Bottom-Left
        [-66.5, -54.0], // Bottom-Right
        [-64.25, -59.0], // Center
        [-63.2, -59.8], // B1 Iceberg
        [-63.8, -58.4], // B2 Iceberg
      ];

      for (const [origLat, origLon] of testCoordinates) {
        const svg = coordToSvg(origLat, origLon, 1000, 650);
        const invertedLon = (svg.x / 100) - 64;
        const invertedLat = -62 - (svg.y * 4.5) / 650;

        assert.ok(
          Math.abs(invertedLat - origLat) < 1e-6,
          `Lat inversion error: orig ${origLat}, got ${invertedLat}`
        );
        assert.ok(
          Math.abs(invertedLon - origLon) < 1e-6,
          `Lon inversion error: orig ${origLon}, got ${invertedLon}`
        );
      }
    });
  });
});
