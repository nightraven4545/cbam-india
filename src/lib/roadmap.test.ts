import { describe, expect, it } from "vitest";
import { annualBill, valueAtStake } from "./roadmap";
import { PRODUCERS } from "./data";
import { DEFAULT_SCENARIO, cumulativeExposure } from "./model";

describe("value at stake", () => {
  const v = valueAtStake();
  it("deltas sum from do-nothing to the residual", () => {
    const deltas = v.steps.filter((s) => !s.total).reduce((a, s) => a + s.value, 0);
    expect(v.doNothing + deltas).toBeCloseTo(v.residual, 3);
  });
  it("do-nothing equals the engine's cumulative default exposure at full pass-through", () => {
    const full = { ...DEFAULT_SCENARIO, passThrough: 1 };
    const expected = PRODUCERS.filter((p) => p.sector === "steel").reduce((a, p) => a + cumulativeExposure(p, full, "default"), 0);
    expect(v.doNothing).toBeCloseTo(expected, 0);
  });
  it("every move reduces (or keeps) the bill", () => {
    expect(v.steps.filter((s) => !s.total).every((s) => s.value <= 1e-6)).toBe(true);
  });
  it("annual bill has one row per year with every producer", () => {
    const b = annualBill("actual");
    expect(b).toHaveLength(9);
    expect(Object.keys(b[0])).toContain("JSW Steel");
  });
});
