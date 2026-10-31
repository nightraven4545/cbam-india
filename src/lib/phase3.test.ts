import { describe, expect, it } from "vitest";
import { PRODUCERS, LEVERS } from "./data";
import { DEFAULT_SCENARIO as S, leverEconomics, optimiseAllocation, producerCost } from "./model";
import { article9, downstreamCostPerUnit, paidPerTonne } from "./policy";
import { DEFAULT_H2, h2Option, projectValue } from "./options";

const tata = PRODUCERS.find((p) => p.id === "tata")!;
const ultra = PRODUCERS.find((p) => p.id === "ultratech")!;

describe("Article 9 policy", () => {
  const o = { price: 20, mechanism: "explicit" as const, targetCut: 0.05, qualifying: 1 };
  it("retains nothing at a zero price", () => {
    expect(article9(S, "steel", { ...o, price: 0 }).every((r) => r.retained === 0)).toBe(true);
  });
  it("never retains more than the gross CBAM cost, and total is conserved", () => {
    const none = article9(S, "steel", { ...o, price: 0 });
    const big = article9(S, "steel", { ...o, price: 10_000 });
    big.forEach((r, i) => {
      expect(r.toEU).toBeCloseTo(0, 3);
      expect(r.retained).toBeCloseTo(none[i].toEU, 3);
    });
  });
  it("CCTS intensity design pays only on the above-target slice", () => {
    expect(paidPerTonne(2, { ...o, mechanism: "ccts", targetCut: 0.05 })).toBeCloseTo(2, 9);
    expect(paidPerTonne(2, o)).toBeCloseTo(40, 9);
  });
  it("downstream cost scales linearly with metal content", () => {
    expect(downstreamCostPerUnit(10, 0.8, 1, 80)).toBeCloseTo(2 * downstreamCostPerUnit(10, 0.4, 1, 80), 9);
  });
});

describe("trade allocation", () => {
  const brute = (p: typeof tata, cap: number, prem: number) => {
    // enumerate allocations in 0.5 Mt steps
    const r = optimiseAllocation(p, S, { euCap: cap, euPremium: prem });
    const pl = r.plants;
    let best = 0;
    const rec = (i: number, left: number, acc: number) => {
      if (i === pl.length) { best = Math.max(best, acc); return; }
      for (let x = 0; x <= Math.min(left, pl[i].capacity) + 1e-9; x += 0.5) rec(i + 1, left - x, acc + x * 1e6 * pl[i].netPremium);
    };
    rec(0, cap, 0);
    return { best, got: r.valueOptimised, r };
  };
  it("greedy matches brute force and respects the cap", () => {
    const { best, got, r } = brute(tata, 1.5, 60);
    expect(got).toBeCloseTo(best, 0);
    expect(r.optimised.reduce((a, x) => a + x.eu, 0)).toBeLessThanOrEqual(1.5 + 1e-9);
    expect(r.valueOptimised).toBeGreaterThanOrEqual(r.valueProrata);
  });
  it("sends nothing to the EU when the premium cannot cover CBAM", () => {
    const r = optimiseAllocation(tata, { ...S, passThrough: 1, year: 2034 }, { euCap: 2, euPremium: 0 });
    expect(r.optimised.every((x) => x.eu === 0)).toBe(true);
  });
});

describe("H2 real option", () => {
  it("option value ≥ max(0, invest-now NPV)", () => {
    const r = h2Option(S, DEFAULT_H2);
    expect(r.optionValue).toBeGreaterThanOrEqual(Math.max(0, r.npvNow) - 1e-9);
  });
  it("with ~zero volatility equals the best discounted deterministic start", () => {
    const o = { ...DEFAULT_H2, sigma: 1e-9, greenPremium: 300 };
    const s = { ...S, growth: 0 };
    let best = 0;
    for (let y = 2026; y <= 2034; y++) best = Math.max(best, projectValue(y, s.basePrice, s, o) / Math.pow(1 + o.discount, y - 2026));
    expect(h2Option(s, o).optionValue).toBeCloseTo(best, 3);
  });
});

describe("cement", () => {
  it("charges indirect emissions by law for actuals but not on top of defaults", () => {
    const a = producerCost(ultra, S, "actual"), d = producerCost(ultra, S, "default");
    expect(a.applied).toBeCloseTo(ultra.actualDirect.value + ultra.indirect.value, 9);
    expect(d.applied).toBeCloseTo(1.48 * 1.1, 9);
  });
  it("a renewable PPA is CBAM-relevant for cement without any stress toggle", () => {
    const re = LEVERS.find((l) => l.id === "cre")!;
    expect(leverEconomics(ultra, re, S, { dedicatedEU: true, cctsPrice: 0, greenPremium: 0, discount: 0.1 }).cbamRelevant).toBe(true);
    expect(producerCost(tata, S, "actual").applied).toBeCloseTo(tata.actualDirect.value, 9);
  });
});
