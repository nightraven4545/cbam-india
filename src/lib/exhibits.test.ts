import { describe, expect, it } from "vitest";
import { LEVERS, PRODUCERS } from "./data";
import { DEFAULT_SCENARIO as S, leverEconomics, producerSummary } from "./model";
import { driverTree, footballField, leverScores, macc, mekko, scorecard, type DriverNode } from "./exhibits";

const opts = { dedicatedEU: false, cctsPrice: 0, greenPremium: 0, discount: 0.1 };
const find = (n: DriverNode, id: string): DriverNode | undefined => n.id === id ? n : n.children?.map((c) => find(c, id)).find(Boolean);

describe("consultant exhibits", () => {
  it("Mekko widths sum to 100% and India pays the largest default penalty", () => {
    const cols = mekko();
    expect(cols.reduce((a, c) => a + c.share, 0)).toBeCloseTo(1, 9);
    const last = cols[cols.length - 1];
    expect(last.x0 + last.share).toBeCloseTo(1, 9);
    const known = cols.filter((c) => c.penalty !== null);
    expect(Math.max(...known.map((c) => c.penalty!))).toBe(known.find((c) => c.flag === "IN")!.penalty);
  });

  it("MACC widths are abatement × EU volume, sorted by cost, contiguous", () => {
    const p = PRODUCERS.find((x) => x.id === "jsw")!;
    const { bars, totalMt } = macc(p, S, opts);
    for (const b of bars) {
      const l = LEVERS.find((x) => x.id === b.id)!;
      expect(b.widthMt).toBeCloseTo((l.abatement + l.scope2Cut) * p.euVolume.value, 9);
    }
    bars.slice(1).forEach((b, i) => { expect(b.mac).toBeGreaterThanOrEqual(bars[i].mac); expect(b.x0).toBeCloseTo(bars[i].x0 + bars[i].widthMt, 9); });
    expect(totalMt).toBeCloseTo(bars.reduce((a, b) => a + b.widthMt, 0), 9);
  });

  it("driver tree multiplies back to the model's annual hit", () => {
    for (const p of PRODUCERS) {
      const t = driverTree(p, { ...S, year: 2030 });
      const vol = find(t, "vol")!.value, pt = find(t, "pt")!.value, net = find(t, "net")!.value;
      expect(vol * 1e6 * net * pt).toBeCloseTo(producerSummary(p, { ...S, year: 2030 }).annualActual, 3);
      const certs = find(t, "certs")!.value, e = find(t, "e")!.value, free = find(t, "free")!.value;
      expect(certs).toBeCloseTo(Math.max(0, e - free), 9);
      expect(find(t, "f")!.value * find(t, "b")!.value).toBeCloseTo(free, 9);
    }
  });

  it("Harvey cost score never rises as the abatement cost rises", () => {
    const l = LEVERS[0];
    const e = leverEconomics(PRODUCERS[0], l, S, opts);
    const scores = [-10, 0, 20, 60, 120, 400].map((mac) => leverScores(l, { ...e, mac }, 90)[1]);
    scores.slice(1).forEach((s, i) => expect(s).toBeLessThanOrEqual(scores[i]));
  });

  it("football field brackets the base case; scorecard covers every steel producer", () => {
    for (const r of footballField()) { expect(r.lo).toBeLessThanOrEqual(r.base); expect(r.hi).toBeGreaterThanOrEqual(r.base); }
    expect(scorecard()).toHaveLength(PRODUCERS.filter((p) => p.sector === "steel").length);
  });
});
