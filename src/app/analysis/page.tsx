import type { Metadata } from "next";
import { PRODUCERS } from "@/lib/data";
import { COMPETITORS } from "@/lib/data";
import { DEFAULT_SCENARIO as S, producerSummary, cumulativeExposure, trajectory, crossoverPrice, tornado } from "@/lib/model";
import { DEFAULT_RISK, exposureStats, pricePaths } from "@/lib/risk";

export const metadata: Metadata = { title: "Analysis · CBAM India", description: "Findings, player analysis and recommendations on EU CBAM for Indian steel." };

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-IN")}`;
const m = (n: number) => `€${Math.round(n / 1e6).toLocaleString("en-IN")}m`;
const full = { ...S, passThrough: 1 };

export default function Analysis() {
  const rows = PRODUCERS.filter((p) => p.sector === "steel").map((p) => ({ p, r: producerSummary(p, full), t: trajectory(p, full), cumA: cumulativeExposure(p, full, "actual"), cumD: cumulativeExposure(p, full, "default") }));
  const totVerif = rows.reduce((s, x) => s + x.r.verificationValue, 0);
  const totCumA = rows.reduce((s, x) => s + x.cumA, 0);
  const totCumD = rows.reduce((s, x) => s + x.cumD, 0);
  const paths = pricePaths(S, DEFAULT_RISK);
  const jsw = rows[0].p;
  const riskA = exposureStats(jsw, S, "actual", paths), riskD = exposureStats(jsw, S, "default", paths);
  const tor = tornado(jsw, S);
  const [indiaV, indiaD] = COMPETITORS;
  const eu = COMPETITORS.find((c) => c.origin.startsWith("EU"))!, kr = COMPETITORS.find((c) => c.origin.startsWith("South Korea"))!;
  const xEUv = crossoverPrice(indiaV, eu, 2026, "law"), xEUd = crossoverPrice(indiaD, eu, 2026, "law"), xKR = crossoverPrice(indiaV, kr, 2026, "law");
  const al = PRODUCERS.filter((p) => p.sector === "aluminium").map((p) => ({ p, r: producerSummary(p, full), ri: producerSummary(p, { ...full, includeIndirect: true }), t: trajectory(p, full) }));

  return (
    <article className="prose-cbam max-w-3xl">
      <p className="text-xs uppercase tracking-wider text-ink-3">Analysis · steel + aluminium · as of 31 Oct 2026</p>
      <h1 className="text-3xl font-semibold mt-2">CBAM and Indian steel: the problem, the numbers, the moves</h1>

      <h2>1. Governing thought</h2>
      <p>
        <strong>CBAM is less a carbon tax on Indian steel than a tax on missing data, and then, from 2030, a tax on BF-BOF.</strong>{" "}
        In 2026 an unverified tonne of Indian hot-rolled coil carries about {eur(rows[1].r.def.net)} of CBAM cost. A verified tonne from an efficient BF-BOF mill carries {eur(rows[1].r.act.net)}.
        Across the five producers modelled, verified data alone is worth about {m(totVerif)} a year to their EU buyers at today&apos;s certificate price.
        Physical decarbonisation matters later: free allocation falls from 77.5% in 2029 to 51.5% in 2030 and to zero in 2034. By then even verified BF-BOF steel pays €200–280/t.
      </p>

      <h2>2. The problem, restated</h2>
      <p>
        The original brief asked what CBAM costs per tonne and which lever pays back fastest. That is necessary but not sufficient. The legal payer is the EU importer, an authorised CBAM declarant above the 50 t threshold.
        The Indian exporter bears the cost economically through price, contract terms, or lost volume. So the decision unit is <strong>producer × production route × CN code × buyer contract</strong>, not a company-wide BRSR intensity. The real question:
      </p>
      <p><em>Given CBAM, the 2026 EU steel quota regime and India&apos;s own CCTS, which mix of verification, decarbonisation, trade allocation and pricing maximises post-CBAM EBITDA from Europe, and when?</em></p>

      <h2>3. Five findings</h2>
      <ol>
        <li><strong>The 2026 &quot;2.5% year&quot; is a myth.</strong> The 2.5% phase-out applies to the <em>benchmark</em>, not to the exporter&apos;s emissions. Every tonne of CO₂ above 97.5% of the benchmark is priced in full from day one. Studies that put 2026 costs at €3–4/t (for example, ARE, Sep 2026) apply 2.5% to total emissions. On the regulation&apos;s formula, verified Indian BF-BOF steel pays €55–145/t in 2026.</li>
        <li><strong>Verification is the highest-IRR lever in the sector.</strong> India&apos;s HR-flat default is 4.28 t (4.71 with the 2026 mark-up, 5.56 from 2028). Indian mills actually run at about 2.0–2.6 t direct. The gap is worth €170–220 per tonne exported in 2026, against verification costs of tens of thousands of euros per installation per year.</li>
        <li><strong>Route matters as much as intensity.</strong> The benchmark for DRI-EAF HR flat (0.481) is far below BF-BOF (1.370). A coal-DRI producer such as JSPL, or a mixed one such as AM/NS, therefore receives much less free allocation per tonne. In unit terms, coal-based DRI is the most exposed route in India.</li>
        <li><strong>Renewable PPAs do nothing for steel CBAM today.</strong> Iron, steel and aluminium are charged on direct emissions only (Annex II). A PPA still pays through power-cost savings, CCTS compliance, customer Scope 3 demands, and the risk that indirect emissions are added later. But it is not a CBAM lever, and lever rankings that treat it as one are wrong.</li>
        <li><strong>CBAM avoidance alone does not finance deep decarbonisation unless output is ring-fenced for Europe.</strong> EU sales are only 1–8% of each major producer&apos;s output. Spread across a whole plant, the avoided-CBAM stream is small, and gas-DRI, CCUS and H₂-DRI all show negative NPV at the current certificate price. A dedicated EU line (low-carbon tonnes sent only to Europe), plus a green premium and a CCTS credit price, is what moves them toward viability. Toggle these in the Decarbonisation lab.</li>
      </ol>

      <h2>4. Producer exposure (2026, 100% pass-through, Q3 price €82.32)</h2>
      <table>
        <thead><tr><th>Producer</th><th>Route</th><th>Default €/t</th><th>Verified €/t</th><th>2030 verified €/t</th><th>Cum. 2026–34 verified</th><th>Cum. on defaults</th></tr></thead>
        <tbody>
          {rows.map(({ p, r, t, cumA, cumD }) => (
            <tr key={p.id}><td>{p.name}</td><td>{p.route}</td><td>{eur(r.def.net)}</td><td>{eur(r.act.net)}</td><td>{eur(t[4].actual)}</td><td>{m(cumA)}</td><td>{m(cumD)}</td></tr>
          ))}
          <tr><td><strong>Total</strong></td><td /><td /><td /><td /><td><strong>{m(totCumA)}</strong></td><td><strong>{m(totCumD)}</strong></td></tr>
        </tbody>
      </table>
      <p>Assumptions: certificate price grows 3% a year and EU volumes stay flat. Producer intensities are D-grade estimates derived from CCTS plant baselines. As a cross-check, our JSW 2030 figure (~€190m at full pass-through) is close to ARE&apos;s independent €130–160m.</p>

      <h2>5. Risk, sensitivity and competitiveness (Phase 2)</h2>
      <h3>Carbon-price risk</h3>
      <p>
        At 50% pass-through, JSW&apos;s 2026–34 exposure with verified data has a median of <strong>{m(riskA.p50)}</strong>. In a bad price world it rises to {m(riskA.p95)} (P95), and the average of the worst 5% (CVaR95) is {m(riskA.cvar95)}.
        On default values the median is {m(riskD.p50)}, with CVaR95 of {m(riskD.cvar95)}. <strong>Verification shrinks both the expected cost and the tail</strong>: it is a hedge, not just a saving. This uses {DEFAULT_RISK.n.toLocaleString()} mean-reverting paths at σ {Math.round(DEFAULT_RISK.sigma * 100)}%/yr.
      </p>
      <h3>What matters most</h3>
      <p>
        Moving each driver by 20% shows that <strong>{tor.rows[0].driver.replace(" ±20%", "").toLowerCase()}</strong> is the biggest lever on JSW&apos;s exposure (±{m(Math.abs(tor.rows[0].hi))}). It is ahead of the certificate price, volume and pass-through (±{m(Math.abs(tor.rows[1].hi))} each).
        Management controls intensity and contract terms; it does not control the EU price. That is why the response should start with verification, efficiency and contracts.
      </p>
      <h3>Delivered-cost competitiveness (HR coil into the EU)</h3>
      <ul>
        <li><strong>Against EU mills:</strong> verified Indian BF-BOF steel stays cheaper delivered until the certificate price reaches about {xEUv ? `€${Math.round(xEUv)}` : "n/a"}/tCO₂. On default values India is already behind above about {xEUd ? `€${Math.round(xEUd)}` : "n/a"}/tCO₂, far below today&apos;s €82. The default penalty alone erases India&apos;s cost advantage.</li>
        <li><strong>Against Korea</strong> (verified BF-BOF at about 2.0 t), costs only cross at around {xKR ? `€${Math.round(xKR)}` : "n/a"}/t. The two are close substitutes, so the fight is over contract terms and verified data.</li>
        <li><strong>Against Türkiye</strong> (EAF-heavy, about 1.0 t, short haul), India loses at almost any carbon price. Türkiye&apos;s lower route intensity outweighs its lower benchmark.</li>
        <li><strong>Against China on defaults</strong>, India wins above about €21/t, but only if India verifies.</li>
      </ul>
      <p className="text-xs">FOB and freight are illustrative 2026 levels (grade D). The slopes, and therefore the direction of each result, come from the regulation.</p>

      <h2>6. Aluminium: a small bill today, a large tail risk</h2>
      <table>
        <thead><tr><th>Producer</th><th>2026 default €/t</th><th>2026 verified €/t</th><th>2034 verified €/t</th><th>2026 if indirect added €/t</th><th>EBITDA €/t</th></tr></thead>
        <tbody>
          {al.map(({ p, r, ri, t }) => <tr key={p.id}><td>{p.name}</td><td>{eur(r.def.net)}</td><td>{eur(r.act.net)}</td><td>{eur(t[8].actual)}</td><td>{eur(ri.act.net)}</td><td>{eur(p.ebitdaEUR.value)}</td></tr>)}
        </tbody>
      </table>
      <ul>
        <li>Today Indian primary aluminium pays about €25–35/t with verified data, roughly 1% of a €2,600/t metal price. Only anode and PFC emissions are priced, and India&apos;s default (1.87) is modest.</li>
        <li><strong>The real exposure is regulatory.</strong> Indian smelters burn captive coal at about 14–15 tCO₂/t of metal. If indirect emissions were brought into scope, CBAM would cost about €1,200/t in 2026, which is more than the entire EBITDA margin.</li>
        <li>That flips the lever ranking. A round-the-clock renewable PPA for half the load has negative NPV today (CBAM-irrelevant, with higher power cost), but is strongly positive under the indirect stress test. <strong>Renewable power for aluminium is an option on future CBAM scope.</strong> Its value should be priced as insurance, not judged on today&apos;s rules.</li>
        <li>PFC and anode-effect control is the no-regret move: it cuts the emissions CBAM does price, pays back within about 2 years, and also saves power.</li>
      </ul>

      <h2>7. Industry context</h2>
      <h3>Why steel first</h3>
      <ul>
        <li>About €4.4bn of the €5.3bn of CBAM-covered goods the EU imported from India in 2025 was iron and steel: 4.0 Mt, about 6.9% of extra-EU CBAM steel imports (Eurostat Comext, via cbamguide.com).</li>
        <li>India&apos;s steel and aluminium exports to the EU fell 24.4% in FY2024-25, from US$7.71bn to US$5.82bn, ahead of the definitive phase.</li>
        <li>About 70% of Indian crude steel comes from BF-BOF and much of the rest from coal-based DRI. The sector averages roughly 2.5 tCO₂/t against about 1.8 in the EU (ARE; NITI Aayog puts it at 2.5–2.6).</li>
        <li>From 1 Jul 2026 the EU safeguard became tariff-rate quotas. India has about 2.8 Mt of access, of which 1.9 Mt is country-specific, with a 50% tariff above quota. CBAM applies within quota, so volume risk and carbon cost now stack.</li>
      </ul>
      <h3>Key value drivers per EU tonne</h3>
      <ul>
        <li><strong>Embedded emissions</strong> (route, coke rate, PCI, scrap share, captive power treatment), and whether they are verified.</li>
        <li><strong>The CBAM benchmark</strong> for that CN code and route, multiplied by the CBAM factor for the year.</li>
        <li><strong>The certificate price</strong>, which tracks EU ETS auctions: quarterly in 2026, weekly from 2027.</li>
        <li><strong>Pass-through</strong>: buyer bargaining power, alternative suppliers (Türkiye, Korea, Vietnam, EU mills), and quota scarcity.</li>
        <li><strong>Origin carbon-price credit</strong> (Article 9): zero today. It becomes material if CCTS creates an effectively paid carbon price that the EU accepts.</li>
      </ul>
      <h3>Aluminium and cement in context</h3>
      <p>
        <strong>Aluminium:</strong> the EU imported €904m (313 kt) of Indian aluminium in 2025. Indian smelters run on captive coal power at roughly 18–21 tCO₂/t Scope 1+2, but steel-style CBAM (direct only) sees just about 1.7–2.0 t of anode and PFC emissions.
        So today&apos;s CBAM bill is small next to the corporate footprint. The big risk is the EU adding indirect emissions for aluminium, which is under review.{" "}
        <strong>Cement:</strong> EU imports from India are under €1m. It matters as a contrast: indirect emissions are included, and clinker substitution (PPC, PSC, LC3) is the dominant lever. Indian blended cements are already among the world&apos;s lowest-clinker.
      </p>

      <h2>8. What management should do (ranked)</h2>
      <ol>
        <li><strong>Now: install CBAM-grade MRV and get accredited verification for each EU-supplying installation.</strong> Report emissions per CN code with precursors (sinter, pig iron, DRI). This beats the defaults immediately.</li>
        <li><strong>Now: rewrite EU contracts.</strong> Use CBAM cost-sharing clauses indexed to the certificate price, a verified-intensity warranty, and quota-allocation commitments. Do not concede 100% pass-through by default.</li>
        <li><strong>2026–2029: run the negative-cost efficiency stack</strong> (WHR, TRT, CDQ, PCI) and push scrap and biochar to their limits. These lower direct intensity and pay for themselves on energy savings.</li>
        <li><strong>Before 2030: allocate production.</strong> Route the lowest-intensity plant and route to EU contracts and the highest-intensity tonnes to domestic and non-EU markets. Consider a dedicated low-carbon EU line, and price a green premium into it.</li>
        <li><strong>2030+: commit to structural routes</strong> (gas or H₂-ready DRI-EAF, CCUS in clusters) as staged real options. Build H₂-ready shafts now and switch fuel when green H₂ falls below about US$2–2.5/kg.</li>
      </ol>

      <h2>9. What India should do</h2>
      <ul>
        <li>Make CCTS produce an <em>effectively paid</em> carbon price, with documentation that qualifies for the Article 9 deduction, so revenue stays in India rather than going to the EU budget.</li>
        <li>Build national CBAM-grade MRV and verification capacity: accredited verifiers and a shared default-to-actual data service for MSMEs, which feel the downstream extension first.</li>
        <li>Align the Green Steel Taxonomy (below 2.2 tCO₂e/t finished steel, Scope 1+2+partial 3) with CBAM boundaries, or publish a reconciliation, so &quot;green&quot; claims hold up in both systems.</li>
        <li>Use India–EU FTA talks to secure recognition of CCTS and to phase the downstream extension.</li>
      </ul>

      <h2>10. Risks and limits of this model</h2>
      <ul>
        <li>Producer EU volumes, prices, EBITDA and CBAM-boundary intensities are <strong>estimates (grade D)</strong>. Company BRSR intensities use corporate Scope 1+2 boundaries, not CBAM&apos;s installation and product boundary.</li>
        <li>One CN code (7208) stands in for each producer&apos;s whole product mix. Coated and cold-rolled products carry extra precursor emissions.</li>
        <li>Benchmarks will be updated for imports from 2027. Defaults and mark-ups must be revised by December 2027. The COM(2026) 616 proposal is not law.</li>
        <li>Lever cost ranges are wide and India-specific (LNG, scrap and H₂ prices). Read the IRRs as directional.</li>
      </ul>

      <h2>11. Cross-check of the AI-generated research inputs</h2>
      <table>
        <thead><tr><th>Claim</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>The formula E − F_t × B and the 97.5%…0% CBAM factor path</td><td>Confirmed (Directive 2003/87/EC Art. 10a(1a); EU Commission example: 1.2 vs 1.0 → 0.225 t, reproduced in our tests)</td></tr>
          <tr><td>Default mark-ups of 10/20/30%; India HR-flat default 4.28; cost €277.60/t in 2026</td><td>Confirmed (2025/2621 as replaced by 2026/1740; reproduced exactly)</td></tr>
          <tr><td>Q1–Q3 2026 prices €75.36 / €75.28 / €82.32</td><td>Confirmed by several outlets; the Commission page lists the publication dates</td></tr>
          <tr><td>COM(2026) 616 sets 2030 retention at 59%</td><td>Consistent with &quot;15% of phased-out allocation reintroduced from 2028&quot; (0.515 + 0.15 × 0.485 = 0.588); proposal only</td></tr>
          <tr><td>&quot;Default values wipe out 200% of EBITDA&quot;</td><td>Only at 100% pass-through and on defaults; misleading as a headline</td></tr>
          <tr><td>&quot;Verification costs &lt;€0.15/t&quot;</td><td>Not supported; verification and MRV run tens of thousands of euros per installation per year, still tiny next to the saving</td></tr>
          <tr><td>India aluminium default 1.87 attributed to UAE/Bahrain (Gemini)</td><td>Corrected: Argus reports India&apos;s CN 7601 default as 1.87 t (UAE/Bahrain is also listed at 1.87)</td></tr>
          <tr><td>Türkiye &quot;billet&quot; default 2.31</td><td>Corrected: 2.31 is Türkiye&apos;s bars/rods (CN 7213/7214) value</td></tr>
          <tr><td>&quot;2026 CBAM cost ≈ €3–4/t&quot; (ARE)</td><td>Rejected: applies 2.5% to total emissions instead of to the benchmark</td></tr>
        </tbody>
      </table>

      <h2>Sources</h2>
      <ul>
        <li>Regulation (EU) 2023/956 (CBAM), as amended by Reg. (EU) 2025/2083 (Omnibus); Implementing Regs. (EU) 2025/2620 (benchmarks), 2025/2621 and 2026/1740 (default values).</li>
        <li>European Commission, DG TAXUD: CBAM certificate price page (Q1–Q3 2026).</li>
        <li><a href="https://cbamguide.com/countries/india/">cbamguide.com: India country page</a> (Eurostat Comext DS-045409 extracts); <a href="https://cbamguide.com/compliance/default-values/">default values</a>.</li>
        <li><a href="https://asiareengage.com/the-cbam-test-indian-steels-future-in-europe/">Asia Research &amp; Engagement, &quot;The CBAM Test&quot;</a> (1 Sep 2026).</li>
        <li><a href="https://www.business-standard.com/india-news/eu-steel-quota-opens-2-8-million-tonnes-export-window-for-india-126091701446_1.html">Business Standard, EU steel quota for India</a> (17 Sep 2026).</li>
        <li>NITI Aayog CBAM assessment (2026); Ministry of Steel, Green Steel Taxonomy (Dec 2024) and &quot;Greening the Steel Sector in India&quot; (2024); IEA Iron &amp; Steel Technology Roadmap.</li>
        <li>CCTS draft GHG-emission-intensity target notifications (MoEFCC/BEE), FY2023-24 plant baselines.</li>
      </ul>
    </article>
  );
}
