import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { faq } from "./faq";
import { facts } from "./storyline";
import { mekko, scorecard } from "./exhibits";

// The README quotes engine outputs; this keeps it honest when data or rules change.
describe("README", () => {
  const readme = readFileSync(join(__dirname, "../../README.md"), "utf8");
  it("carries every quick answer verbatim", () => {
    for (const x of faq()) { expect(readme).toContain(`### ${x.q}`); expect(readme).toContain(x.a); }
  });
  it("quotes the current headline numbers", () => {
    const f = facts(); const { eur, bn, m } = f.fmt;
    const share = `${Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100)}%`;
    const mk = mekko(2030), india = mk.find((c) => c.flag === "IN")!, korea = mk.find((c) => c.flag === "KR")!;
    const reds = scorecard().map((r) => ({ name: r.p.name, n: Object.values(r.cells).filter((c) => c.level === "red").length })).sort((a, b) => b.n - a.n)[0];
    const words = ["zero", "one", "two", "three", "four", "five"];
    for (const s of [bn(f.vas.doNothing), bn(f.vas.residual), bn(-f.vas.steps[1].value), share, eur(f.defaultPerT), eur(f.verifiedPerT),
      `${eur(india.verified!)}/t`, `${eur(korea.verified!)}/t`, `${eur(india.penalty!)}/t more`, bn(f.polExplicit), m(f.polCcts), `${reds.name} flags red on ${words[reds.n]}`]) {
      expect(readme, s).toContain(s);
    }
  });
});
