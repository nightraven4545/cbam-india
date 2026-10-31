import { describe, expect, it } from "vitest";
import { PRODUCERS, LEVERS, COMPETITORS } from "./data";
import { DEFAULT_SCENARIO as S, cumulativeExposure, crossoverPrice, deliveredCost, leverEconomics, producerCost, tornado } from "./model";
import { exposureStats, pricePaths, rng } from "./risk";

const jsw = PRODUCERS.find((p) => p.id === "jsw")!;
const vedanta = PRODUCERS.find((p) => p.id === "vedanta")!;

describe("risk", () => {
  it("rng is deterministic per seed and in [0,1)", () => {
    const a = rng(7), b = rng(7);
    const xs = Array.from({ length: 5 }, () => a());
    expect(xs).toEqual(Array.from({ length: 5 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("σ = 0 collapses to the deterministic exposure", () => {
    const paths = pricePaths(S, { n: 10, sigma: 0, kappa: 0.3, seed: 1 });
    const st = exposureStats(jsw, S, "actual", paths);
    const det = cumulativeExposure(jsw, S, "actual");
    expect(st.p5).toBeCloseTo(det, 3);
    expect(st.p95).toBeCloseTo(det, 3);
  });

  it("volatility widens the band and CVaR ≥ P95 ≥ P50", () => {
    const st = exposureStats(jsw, S, "actual", pricePaths(S, { n: 500, sigma: 0.3, kappa: 0.3, seed: 42 }));
    expect(st.p95).toBeGreaterThan(st.p50);
    expect(st.cvar95).toBeGreaterThanOrEqual(st.p95);
    expect(st.p5).toBeLessThan(st.p50);
  });
});

describe("crossover", () => {
  it("delivered costs are equal at the crossover price", () => {
    const [india, , turkey] = COMPETITORS;
    const p = crossoverPrice(india, turkey, 2030, "law")!;
    expect(p).not.toBeNull();
    expect(deliveredCost(india, p, 2030, "law")).toBeCloseTo(deliveredCost(turkey, p, 2030, "law"), 6);
  });

  it("identical slopes have no crossover", () => {
    const a = COMPETITORS[0];
    expect(crossoverPrice(a, { ...a, fob: a.fob + 10 }, 2026, "law")).toBeNull();
  });
});

describe("aluminium and indirect emissions", () => {
  it("indirect stays out of scope by default and in when the stress toggle is on", () => {
    const off = producerCost(vedanta, S, "actual");
    const on = producerCost(vedanta, { ...S, includeIndirect: true }, "actual");
    expect(off.applied).toBeCloseTo(vedanta.actualDirect.value, 9);
    expect(on.applied).toBeCloseTo(vedanta.actualDirect.value + vedanta.indirect.value, 9);
  });

  it("a renewable PPA becomes CBAM-relevant only if indirect emissions are added", () => {
    const re = LEVERS.find((l) => l.id === "alre")!;
    const o = { dedicatedEU: true, cctsPrice: 0, greenPremium: 0, discount: 0.1 };
    expect(leverEconomics(vedanta, re, S, o).cbamRelevant).toBe(false);
    const on = leverEconomics(vedanta, re, { ...S, includeIndirect: true }, o);
    expect(on.cbamRelevant).toBe(true);
    expect(on.npv).toBeGreaterThan(leverEconomics(vedanta, re, S, o).npv);
  });
});

describe("tornado", () => {
  it("is sorted by swing and price moves exposure in the right direction", () => {
    const t = tornado(jsw, S);
    const swings = t.rows.map((r) => Math.abs(r.hi - r.lo));
    expect(swings).toEqual([...swings].sort((a, b) => b - a));
    const price = t.rows.find((r) => r.driver.startsWith("Certificate price"))!;
    expect(price.lo).toBeLessThan(0);
    expect(price.hi).toBeGreaterThan(0);
  });
});
