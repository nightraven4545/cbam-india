import { describe, expect, it } from "vitest";
import { ESG, FRAMEWORKS, GW_TESTS, PRICE_LADDER, REQUIREMENTS, borderGap, greenwashTests, historicRate, pathway, requiredRate, taxonomyStars } from "./esg";

describe("ESG module", () => {
  it("every figure has a source and a grade", () => {
    for (const x of [...ESG, ...PRICE_LADDER]) { expect(x.source.length).toBeGreaterThan(5); expect("ABCDE").toContain(x.grade); }
    for (const f of FRAMEWORKS) expect(f.marks).toHaveLength(REQUIREMENTS.length);
  });

  it("taxonomy stars follow the Ministry of Steel bands", () => {
    expect(taxonomyStars(1.5)).toBe(5);
    expect(taxonomyStars(1.6)).toBe(4);
    expect(taxonomyStars(2.1)).toBe(3);
    expect(taxonomyStars(2.2)).toBe(0);
    expect(taxonomyStars(null)).toBeNull();
  });

  it("required rate reaches the 2030 target exactly", () => {
    for (const p of ESG) {
      const r = requiredRate(p);
      if (r === null) continue;
      const from = 2000 + Number(p.intensityYear!.slice(2));
      expect(p.intensity! * Math.pow(1 + r, 2030 - from)).toBeCloseTo(p.target2030!, 9);
    }
  });

  it("pathway is linear between anchors and ends at zero in the net-zero year", () => {
    const tata = ESG.find((p) => p.id === "tata")!;
    const pts = pathway(tata).filter((r) => r.target !== undefined);
    expect(pts.find((r) => r.year === 2030)!.target).toBeCloseTo(1.8, 9);
    expect(pts.find((r) => r.year === tata.netZero)!.target).toBeCloseTo(0, 9);
    const d = pts.filter((r) => r.year >= 2030).map((r, i, a) => (i ? a[i - 1].target! - r.target! : null)).filter((x) => x !== null) as number[];
    d.forEach((x) => expect(x).toBeCloseTo(d[0], 9));
  });

  it("a rising intensity against a falling target flags red on trajectory", () => {
    const tata = ESG.find((p) => p.id === "tata")!;
    expect(historicRate(tata)!).toBeGreaterThan(0);
    expect(greenwashTests(tata).trajectory).toBe("red");
    for (const p of ESG) expect(Object.keys(greenwashTests(p))).toEqual(GW_TESTS.map((t) => t.id));
  });

  it("the border gap is the CBAM price less the origin price, never negative", () => {
    for (const p of PRICE_LADDER) expect(borderGap(p)).toBeGreaterThanOrEqual(0);
    expect(borderGap(PRICE_LADDER.find((p) => p.id === "in")!)).toBe(borderGap(PRICE_LADDER.find((p) => p.id === "cbam")!) + PRICE_LADDER.find((p) => p.id === "cbam")!.eur!);
  });
});
