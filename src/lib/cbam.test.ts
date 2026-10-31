import { describe, expect, it } from "vitest";
import { cbamCostPerTonne, cbamFactor, irr, npv, paybackYears } from "./cbam";
import { PRODUCERS, LEVERS } from "./data";
import { DEFAULT_SCENARIO, leverEconomics, producerSummary } from "./model";

describe("CBAM rules", () => {
  it("reproduces the Commission example: 1.2 embedded, benchmark 1.0, 2026 → 0.225 t", () => {
    const r = cbamCostPerTonne({ year: 2026, mode: "actual", defaultValue: 0, actual: 1.2, benchmark: 1.0, price: 1 });
    expect(r.certificates).toBeCloseTo(0.225, 6);
  });

  it("India HR flat steel on defaults in 2026 at €82.32 = €277.60/t (cbamguide worked example)", () => {
    const r = cbamCostPerTonne({ year: 2026, mode: "default", defaultValue: 4.28, actual: 0, benchmark: 1.37, price: 82.32 });
    expect(r.applied).toBeCloseTo(4.708, 6);
    expect(r.certificates).toBeCloseTo(3.37225, 5);
    expect(r.net).toBeCloseTo(277.6, 1);
  });

  it("2030 default cost at a constant price = €399.95/t", () => {
    const r = cbamCostPerTonne({ year: 2030, mode: "default", defaultValue: 4.28, actual: 0, benchmark: 1.37, price: 82.32 });
    expect(r.net).toBeCloseTo(399.95, 1);
  });

  it("never charges below zero, and caps the origin credit at gross", () => {
    expect(cbamCostPerTonne({ year: 2026, mode: "actual", defaultValue: 0, actual: 0.5, benchmark: 1.37, price: 80 }).net).toBe(0);
    const r = cbamCostPerTonne({ year: 2026, mode: "actual", defaultValue: 0, actual: 2, benchmark: 1.37, price: 80, originCarbonPrice: 500 });
    expect(r.net).toBe(0);
  });

  it("COM(2026) 616 reintroduces 15% of phased-out allocation from 2028 only", () => {
    expect(cbamFactor(2027, "proposal")).toBe(0.95);
    expect(cbamFactor(2028, "proposal")).toBeCloseTo(0.915, 6);
    expect(cbamFactor(2034, "proposal")).toBeCloseTo(0.15, 6);
    expect(cbamFactor(2034, "law")).toBe(0);
  });
});

describe("finance helpers", () => {
  it("irr / npv / payback agree on a simple project", () => {
    const flows = [-100, 30, 30, 30, 30, 30];
    const r = irr(flows)!;
    expect(npv(r, flows)).toBeCloseTo(0, 6);
    expect(r).toBeCloseTo(0.1524, 3);
    expect(paybackYears(flows)).toBeCloseTo(3.333, 2);
    expect(irr([-1, -1])).toBeNull();
  });
});

describe("model", () => {
  it("verified data always costs no more than defaults for every producer", () => {
    for (const p of PRODUCERS) {
      const s = producerSummary(p, DEFAULT_SCENARIO);
      expect(s.act.net).toBeLessThanOrEqual(s.def.net);
      expect(s.verificationValue).toBeGreaterThanOrEqual(0);
    }
  });

  it("a renewable PPA earns no steel CBAM saving (Annex II: direct only)", () => {
    const re = LEVERS.find((l) => l.id === "re")!;
    const e = leverEconomics(PRODUCERS[0], re, DEFAULT_SCENARIO, { dedicatedEU: true, cctsPrice: 0, greenPremium: 0, discount: 0.1 });
    expect(e.cbamRelevant).toBe(false);
    expect(e.flows.slice(1).every((f) => f === 3)).toBe(true); // only the OPEX saving
  });
});
