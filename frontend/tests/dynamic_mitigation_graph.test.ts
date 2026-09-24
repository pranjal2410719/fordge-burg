import { describe, it } from "node:test";
import assert from "node:assert";
import { MITIGATIONS, BASELINE_ROUTES } from "../lib/data";
import { MITIGATION_SOPS_MAP } from "../lib/riskDetailData";

describe("Dynamic Mitigation Graph & Checklist System", () => {
  it("all mitigations in MITIGATIONS exist in MITIGATION_SOPS_MAP", () => {
    assert.strictEqual(MITIGATIONS.length, 7);
    for (const m of MITIGATIONS) {
      assert.ok(MITIGATION_SOPS_MAP[m.id], `Mitigation SOP mapping exists for ${m.id}`);
      assert.strictEqual(MITIGATION_SOPS_MAP[m.id].id, m.id);
      assert.ok(MITIGATION_SOPS_MAP[m.id].riskReduction.riskScoreDelta < 0, `Risk score delta is negative`);
    }
  });

  it("computes progressive residual risk reduction as items are checked", () => {
    const baselineRisk = 31; // Balanced route average risk
    const weights: Record<string, number> = {
      m1: 0.14,
      m2: 0.26,
      m3: 0.12,
      m4: 0.12,
      m5: 0.08,
      m6: 0.10,
      m7: 0.12,
    };

    // 0 Acknowledged: full baseline risk
    let acked: Record<string, boolean> = {};
    let fraction = Object.entries(acked).reduce((sum, [k, v]) => sum + (v ? weights[k] : 0), 0);
    let residualRisk = Math.max(3, Math.round(baselineRisk * (1 - Math.min(0.85, fraction))));
    assert.strictEqual(residualRisk, 31, "Zero acked yields exact baseline risk");

    // Ack m2 (Iceberg standoff): highest weight (26%)
    acked["m2"] = true;
    fraction = Object.entries(acked).reduce((sum, [k, v]) => sum + (v ? weights[k] : 0), 0);
    residualRisk = Math.max(3, Math.round(baselineRisk * (1 - Math.min(0.85, fraction))));
    assert.ok(residualRisk < 31, "Acking m2 reduces residual risk");
    assert.strictEqual(residualRisk, Math.round(31 * (1 - 0.26)));

    // Ack All: Maximum reduction capped properly
    for (const m of MITIGATIONS) {
      acked[m.id] = true;
    }
    fraction = Object.entries(acked).reduce((sum, [k, v]) => sum + (v ? weights[k] : 0), 0);
    residualRisk = Math.max(3, Math.round(baselineRisk * (1 - Math.min(0.85, fraction))));
    assert.ok(residualRisk <= 10, "Acking all mitigations drops residual risk to low tier");
    assert.ok(residualRisk >= 3, "Residual risk adheres to minimum physical ceiling (>= 3)");
  });

  it("verifies Polar Code compliance status transitions accurately", () => {
    const vesselIceClass = "PC4";
    const mandatoryIds = MITIGATIONS.filter((m) => {
      const sop = MITIGATION_SOPS_MAP[m.id];
      if (!sop) return m.status === "mandatory";
      const app = sop.applicability.find((a) => a.class === vesselIceClass);
      return app ? app.status === "Mandatory" : m.status === "mandatory";
    }).map((m) => m.id);

    assert.ok(mandatoryIds.length > 0, "PC4 has mandatory mitigations");

    let acked: Record<string, boolean> = {};
    let mandatoryAckedCount = mandatoryIds.filter((id) => !!acked[id]).length;
    let isCompliant = mandatoryIds.length > 0 && mandatoryAckedCount === mandatoryIds.length;
    assert.strictEqual(isCompliant, false, "Initial state with no acks is non-compliant");

    // Acknowledge all mandatory items
    for (const id of mandatoryIds) {
      acked[id] = true;
    }
    mandatoryAckedCount = mandatoryIds.filter((id) => !!acked[id]).length;
    isCompliant = mandatoryIds.length > 0 && mandatoryAckedCount === mandatoryIds.length;
    assert.strictEqual(isCompliant, true, "Acking all mandatory items achieves IMO Polar Code compliance");
  });
});
