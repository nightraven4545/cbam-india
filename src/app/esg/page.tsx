import type { Metadata } from "next";
import { PageHeader } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import { EtsHistory, CbamTimeline } from "@/components/pages/MarketsCharts";
import { Takeaway, Toc } from "@/components/consulting/ApproachParts";
import { CarbonStack, CostFlow, EsgScorecard, FrameworksMatrix, GreenwashGrid, PriceLadder } from "@/components/esg/EsgParts";
import PathwayChart from "@/components/esg/PathwayChart";
import { ESG, FRAMEWORKS, GW_TESTS, PRICE_LADDER, REQUIREMENTS, TAXONOMY, borderGap, greenwashTests, historicRate, pathway, requiredRate, reuse } from "@/lib/esg";
import { PRODUCERS } from "@/lib/data";
import { DEFAULT_SCENARIO, producerCost } from "@/lib/model";
import { priceIn } from "@/lib/cbam";

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-IN")}`;
const pctAbs = (r: number) => `${Math.abs(r * 100).toFixed(1)}%`;
const COLORS = ["var(--s1)", "var(--s2)", "var(--s3)"];
const TOC = [
  { id: "prices", label: "Carbon prices" }, { id: "flow", label: "Cost flow" }, { id: "frameworks", label: "Frameworks" },
  { id: "scorecard", label: "ESG scorecard" }, { id: "pathway", label: "Net-zero paths" }, { id: "greenwashing", label: "Greenwashing" },
  { id: "india", label: "India's stack" }, { id: "history", label: "EU price & timeline" }, { id: "primer", label: "Primer" },
];
import { ETS_PRICES } from "@/lib/roadmap";

export const metadata: Metadata = { title: "ESG & carbon markets", description: "Carbon taxes, EU ETS, India's PAT/ESCerts and CCTS, voluntary markets, CORSIA, futures, net-zero maths and greenwashing." };

// Worked firm-level net-zero example (illustrative integrated steelmaker, not a real company).
const base = { output: 20, s1: 2.1, s2: 0.25, s3: 0.45 }; // Mt crude steel; tCO2e/t
const baseYear = 2025, target = 2050;
const abs = (base.s1 + base.s2 + base.s3) * base.output;
const linear = abs / (target - baseYear);

export default function Esg() {
  const ladder = PRICE_LADDER;
  const disclosed = ESG.filter((p) => p.intensity !== null);
  const rates = disclosed.map((p) => requiredRate(p)).filter((r): r is number => r !== null);
  const rising = ESG.filter((p) => (historicRate(p) ?? 0) > 0);
  const gw = ESG.map((p) => Object.values(greenwashTests(p)));
  const passAll = gw.filter((r) => r.every((x) => x === "green")).length, passNone = gw.filter((r) => r.every((x) => x !== "green")).length;
  const steeper = disclosed.filter((p) => historicRate(p) !== null && requiredRate(p)! < historicRate(p)!);
  const instFw = FRAMEWORKS.filter((f) => f.marks[4] === "yes" && f.marks[3] === "yes").map((f) => f.name);
  const listAnd = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
  const tata = PRODUCERS.find((p) => p.id === "tata")!;
  const s30 = { ...DEFAULT_SCENARIO, year: 2030 };
  const act = producerCost(tata, s30, "actual");
  const credit = producerCost(tata, { ...s30, originCarbonPrice: 20 }, "actual");
  const price2030 = priceIn(2030, DEFAULT_SCENARIO.basePrice, DEFAULT_SCENARIO.growth);
  const flowHit = act.net * DEFAULT_SCENARIO.passThrough;
  const flowShare = flowHit / tata.ebitdaEUR.value;
  const flow = [
    { label: "EU carbon price (2030 path)", value: `${eur(price2030)}/t`, sub: "€82.32 in Q3 2026, +3% a year" },
    { label: "Certificates per tonne", value: `${act.certificates.toFixed(2)} t`, sub: `${act.applied.toFixed(2)} t verified − ${act.freeAllocation.toFixed(2)} t free allocation` },
    { label: "EU importer's CBAM bill", value: `${eur(act.net)}/t`, sub: "certificates × price, paid by the importer" },
    { label: "Passed back in the price", value: `${eur(flowHit)}/t`, sub: `${Math.round(DEFAULT_SCENARIO.passThrough * 100)}% pass-through in contract terms` },
    { label: "Share of EBITDA per EU tonne", value: `${Math.round(flowShare * 100)}%`, sub: `of ${eur(tata.ebitdaEUR.value)}/t FY26 EBITDA` },
  ];
  return (
    <div>
      <PageHeader title={`None of the ${disclosed.length} producers that disclose an intensity qualifies as green steel under India's own taxonomy, and CBAM will price that gap at the border`}
        lede="An ESG view of the same problem: what carbon costs where, how that cost reaches an Indian plant, which disclosures buyers and regulators require, how credible each producer's targets are, and where greenwashing risk sits." />
      <div className="xl:grid xl:grid-cols-[1fr_200px] xl:gap-10">
        <div className="grid gap-6 min-w-0">
          <section id="prices" className="grid gap-4 scroll-mt-20">
            <Takeaway>CBAM charges the EU price on every chargeable tonne. A Chinese or Korean exporter can deduct a ~€6–9 home price under Article 9; an Indian one can deduct nothing until CCTS credits trade at a price the EU recognises.</Takeaway>
            <Exhibit n={1} title={`Europe prices carbon at about ${eur(ladder[0].eur!)}/t; Asian systems sit below €10, and India's CCTS has no price yet`}
              subtitle="Carbon price per tCO₂, latest available, € (USD prices converted at $1.16/€); right column = what CBAM still collects per chargeable tonne after crediting the home price"
              source={<>{ladder.map((p) => `${p.name}: ${p.source} (grade ${p.grade})`).join("; ")}.</>}
              table={{ columns: ["Scheme", "Native price", "€/t", "Gap to CBAM €/t"], rows: ladder.map((p) => [p.name, p.native, p.eur === null ? "n/a" : +p.eur.toFixed(2), +borderGap(p).toFixed(2)]) }}>
              <PriceLadder items={ladder} />
            </Exhibit>
          </section>

          <section id="flow" className="grid gap-4 scroll-mt-20">
            <Takeaway>{`At the base 50% pass-through, CBAM takes ${Math.round(flowShare * 100)}% of ${tata.name}'s EBITDA on each EU tonne in 2030, and an explicit €20/t Indian price would cut the EU bill by ${eur(credit.originCredit)}/t.`}</Takeaway>
            <Exhibit n={2} title={`How a carbon price reaches an Indian plant: ${eur(price2030)}/t in Europe becomes ${eur(flowHit)}/t off the margin of a verified ${tata.name} tonne in 2030`}
              subtitle="One tonne of hot-rolled coil, verified data, 2030, base scenario. Article 9 shown as a side branch at an explicit €20/t Indian price"
              source="Model: certificate price €82.32 growing 3%/yr; CBAM factor 51.5% (2030); route benchmark; 50% pass-through; EBITDA FY26 (grade C).">
              <CostFlow steps={flow} credit={{ value: `−${eur(credit.originCredit)}/t`, sub: `on the importer's bill if India's €20/t price on ${credit.certificates.toFixed(2)} chargeable tonnes is recognised` }} />
            </Exhibit>
          </section>

          <section id="frameworks" className="grid gap-4 scroll-mt-20">
            <Takeaway>{`Build installation-level, product-level emissions data once: it feeds ${reuse(4)} of the ${FRAMEWORKS.length} frameworks here, including CBAM, the Green Steel Taxonomy and ResponsibleSteel. Corporate BRSR numbers do not.`}</Takeaway>
            <Exhibit n={3} title={`Every framework asks for Scope 1 and 2, but only ${listAnd(instFw)} need installation-level product footprints`}
              subtitle="What each disclosure or target framework requires of a steel producer"
              source="Analyst mapping of the GHG Protocol Corporate Standard, SEBI BRSR Core, IFRS S2, ESRS E1, Regulation (EU) 2023/956, India Green Steel Taxonomy (Dec 2024), SBTi steel guidance and the ResponsibleSteel Standard (grade C)."
              table={{ columns: ["Framework", ...REQUIREMENTS], rows: FRAMEWORKS.map((f) => [f.name, ...f.marks.map((m) => (m === "yes" ? "Required" : m === "part" ? "Partial" : "–"))]) }}>
              <FrameworksMatrix />
            </Exhibit>
          </section>

          <section id="scorecard" className="grid gap-4 scroll-mt-20">
            <Takeaway>{`Disclosed intensities run ${Math.min(...disclosed.map((p) => p.intensity!)).toFixed(2)}–${Math.max(...disclosed.map((p) => p.intensity!)).toFixed(2)} t, above the ${TAXONOMY.green} t green line. Hitting the 2030 targets needs cuts of ${pctAbs(Math.max(...rates))}–${pctAbs(Math.min(...rates))} a year.`}</Takeaway>
            <Exhibit n={4} title={`${disclosed.length} of ${ESG.length} producers disclose an intensity in our sources; none earns a Green Steel Taxonomy star, and ${rising.length ? `${rising.map((p) => p.name).join(", ")} is moving the wrong way` : "all are moving toward their targets"}`}
              subtitle="Producer climate disclosures: latest Scope 1+2 intensity, taxonomy rating, 2030 target and the annual cut it implies, recent trend, net-zero year, renewable share"
              source={<>{ESG.map((p) => `${p.name}: ${p.source}`).join("; ")}. Taxonomy rating uses corporate Scope 1+2 per tonne of crude steel as a proxy for the finished-steel boundary. &quot;Not disclosed&quot; means not found in these sources.</>}
              table={{ columns: ["Producer", "Intensity", "Year", "2030 target", "Cut needed/yr", "Trend/yr", "Net zero", "Grade"], rows: ESG.map((p) => [p.name, p.intensity ?? "n/d", p.intensityYear ?? "n/d", p.target2030 ?? "n/d", requiredRate(p) === null ? "n/d" : pctAbs(requiredRate(p)!), historicRate(p) === null ? "n/d" : (historicRate(p)! * 100).toFixed(1) + "%", p.netZero ?? "n/d", p.grade]) }}>
              <EsgScorecard rows={ESG} />
            </Exhibit>
          </section>

          <section id="pathway" className="grid gap-4 scroll-mt-20">
            <Exhibit n={5} title={`For ${steeper.length} of ${disclosed.length} disclosing producers the 2030 path is steeper than their own track record; 2026–30 is where credibility will be tested`}
              subtitle="Scope 1+2 intensity, tCO₂ per tonne of crude steel: reported (solid) and the straight line to each 2030 target and net-zero year (dashed)"
              source="Company disclosures as in Exhibit 4; JSW's 2005 base is derived from its stated −42% target. Straight lines are an analytical device, not company guidance.">
              <PathwayChart green={TAXONOMY.green} series={disclosed.map((p, i) => ({ id: p.id, name: p.name, color: COLORS[i], points: pathway(p) }))} />
            </Exhibit>
          </section>

          <section id="greenwashing" className="grid gap-4 scroll-mt-20">
            <Takeaway>Greenwashing risk for steel is less about slogans than about numbers: intensity-only targets, trends that contradict targets, and quoting corporate BRSR figures where buyers need CBAM-boundary values.</Takeaway>
            <Exhibit n={6} title={`${passAll === 0 ? "No producer passes every test" : `${passAll} producer(s) pass every test`}${passNone ? `, and ${passNone} pass none` : ""}: the common gaps are intensity-only targets and undisclosed renewable shares`}
              subtitle="Greenwashing-risk tests applied to each producer's disclosures, with three enforcement cases that set the standard"
              source={<>Tests follow the CCPA Guidelines for Prevention and Regulation of Greenwashing (India, 2024) and Directive (EU) 2024/825 on empowering consumers for the green transition: {GW_TESTS.map((t) => `${t.label} (${t.basis})`).join("; ")}.</>}
              table={{ columns: ["Producer", ...GW_TESTS.map((t) => t.label)], rows: ESG.map((p) => [p.name, ...GW_TESTS.map((t) => greenwashTests(p)[t.id])]) }}>
              <GreenwashGrid rows={ESG} />
            </Exhibit>
          </section>

          <section id="india" className="grid gap-4 scroll-mt-20">
            <Exhibit n={7} title="India's carbon stack is built bottom-up from energy efficiency; the layer that matters for CBAM, an Article 9 link, does not exist yet"
              subtitle="India's carbon-pricing instruments, from the oldest layer to the open CBAM question"
              source="BEE PAT scheme; Carbon Credit Trading Scheme 2023 and its amendments; GHG-intensity target notifications for FY2025-26 and FY2026-27; Regulation (EU) 2023/956 Art. 9 (grade C).">
              <CarbonStack />
            </Exhibit>
          </section>

          <div id="history" className="grid gap-6 lg:grid-cols-2 scroll-mt-20">
            <Exhibit n={8} title="The EU price has held €65–85/t since 2022; that is the price CBAM certificates follow"
              subtitle="EU allowance (EUA) annual average price, €/tCO₂"
              source="ICE front-December annual averages (LSEG Carbon Research for 2025); 2026 = average of the Commission's Q1–Q3 CBAM certificate prices."
              table={{ columns: ["Year", "€/t"], rows: ETS_PRICES.map((x) => [x.year, x.price]) }}>
              <EtsHistory data={ETS_PRICES} />
            </Exhibit>
            <Exhibit n={9} title="Law in force runs to 2034; the open proposals would widen scope and slow the phase-out"
              subtitle="CBAM milestones, law vs proposal">
              <CbamTimeline />
            </Exhibit>
          </div>
        </div>
        <Toc items={TOC} />
      </div>
      <h2 id="primer" className="font-cond text-[1.7rem] font-semibold mt-14 mb-4 scroll-mt-20">Primer: instruments, India&apos;s stack, net zero and greenwashing</h2>
      <div className="grid gap-3">
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">Carbon tax vs emissions trading<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <table tabIndex={0}>
        <thead><tr><th /><th>Carbon tax</th><th>Emissions trading (cap-and-trade / baseline-and-credit)</th></tr></thead>
        <tbody>
          <tr><td>What is fixed</td><td>Price per tCO₂</td><td>Quantity (cap) or intensity (baseline); the price floats</td></tr>
          <tr><td>Certainty</td><td>Price certainty, emissions uncertain</td><td>Emissions certainty, price volatile</td></tr>
          <tr><td>Examples</td><td>Sweden, Canada (federal fuel charge, now removed for consumers), Singapore</td><td>EU ETS, UK ETS, China ETS (intensity), India CCTS (intensity)</td></tr>
          <tr><td>Border measure</td><td colSpan={2}>CBAM mirrors the EU ETS price at the border, so EU producers are not undercut by imports that pay no carbon cost</td></tr>
        </tbody>
      </table>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">EU ETS, the price behind CBAM<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <ul>
        <li>Launched in 2005; covers power, industry, aviation and, since 2024, maritime. It is a cap-and-trade system with an annual linear reduction factor; the Fit-for-55 reform targets −62% against 2005 by 2030.</li>
        <li>The Market Stability Reserve (2019) withdraws surplus allowances, which has kept prices around €60–100/t since 2022.</li>
        <li>Heavy industry receives <strong>free allocation</strong> based on product benchmarks. CBAM replaces it gradually: the CBAM factor runs 97.5% (2026) → 51.5% (2030) → 0% (2034) under current law.</li>
        <li>The CBAM certificate price is the average of EU ETS auction prices: quarterly in 2026 (€75.36, €75.28, €82.32), weekly from 2027.</li>
        <li><strong>Carbon futures:</strong> EUA futures and options on ICE Endex (and EEX) are the liquid hedge. An EU importer can lock in its CBAM cost by buying EUA futures, a hedge that Indian exporters can price into contracts.</li>
      </ul>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">India&apos;s carbon stack<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <h3>Perform, Achieve &amp; Trade (PAT) and ESCerts</h3>
      <ul>
        <li>The National Mission for Enhanced Energy Efficiency (2008) runs PAT under the Energy Conservation Act 2001. Since 2012 it has set specific energy consumption (SEC) targets for designated consumers in 13 energy-intensive sectors, including iron &amp; steel, aluminium and cement.</li>
        <li>Over-achievers earn <strong>Energy Saving Certificates (ESCerts)</strong> (1 ESCert = 1 toe saved), traded on IEX/PXIL; under-achievers buy them or pay penalties. Prices have been volatile and mostly weak because of oversupply.</li>
        <li>PAT is an <em>energy</em> market, not a carbon market. It is being folded into the CCTS, and its targets are not a carbon price the EU would credit under CBAM Article 9.</li>
      </ul>
      <h3>Carbon Credit Trading Scheme (CCTS)</h3>
      <ul>
        <li>Legal basis: Energy Conservation (Amendment) Act 2022 and the CCTS notification of June 2023. BEE administers it, Grid-India is the registry, and CERC regulates trading.</li>
        <li><strong>Compliance mechanism:</strong> GHG-emission-intensity targets (tCO₂e per tonne of product), set in three-year cycles. Entities beating their target earn Carbon Credit Certificates (CCCs); laggards must buy them.</li>
        <li>Phasing: aluminium, cement, chlor-alkali and pulp &amp; paper were notified in Oct 2025; refining, petrochemicals and textiles in Jan 2026. <strong>Iron &amp; steel targets</strong> were reported as still pending in some 2026 sources. The first compliance year closed on 31 Mar 2026, and trading is expected from about Oct 2026.</li>
        <li><strong>Offset mechanism:</strong> voluntary registration of projects outside the compliance sectors, issuing CCCs under approved methodologies.</li>
        <li><strong>The CBAM link:</strong> an intensity scheme only creates an &quot;effectively paid&quot; carbon price on the tonnes above target. Whether the EU will accept CCC purchases as an Article 9 deduction is the single most valuable open policy question for Indian exporters.</li>
      </ul>
      <h3>Disclosure and taxonomy</h3>
      <ul>
        <li><strong>BRSR / BRSR Core</strong> (SEBI): mandatory for the top 1,000 listed companies. BRSR Core KPIs, including GHG intensity, are subject to reasonable assurance or assessment, phasing up the market-cap ranking, with value-chain disclosure to follow.</li>
        <li><strong>Green Steel Taxonomy</strong> (Ministry of Steel, Dec 2024): steel below 2.2 tCO₂e per tonne of finished steel is &quot;green&quot;. Star ratings: 5★ below 1.6, 4★ 1.6–2.0, 3★ 2.0–2.2. The boundary is Scope 1, Scope 2 and part of Scope 3, which differs from CBAM&apos;s.</li>
      </ul>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">India vs EU at a glance<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <table tabIndex={0}>
        <thead><tr><th /><th>EU ETS + CBAM</th><th>India CCTS</th></tr></thead>
        <tbody>
          <tr><td>Design</td><td>Absolute cap-and-trade</td><td>Intensity baseline-and-credit</td></tr>
          <tr><td>Price signal</td><td>€70–90/t (2026)</td><td>Not yet discovered (trading from ~late 2026)</td></tr>
          <tr><td>Steel coverage</td><td>Full, with free allocation phasing out to 2034</td><td>Targets pending or being finalised</td></tr>
          <tr><td>Border measure</td><td>CBAM from 2026</td><td>None</td></tr>
          <tr><td>MRV</td><td>Accredited verification, installation level</td><td>BEE-accredited carbon verification agencies</td></tr>
          <tr><td>Revenue</td><td>EU / Member State budgets</td><td>Flows between covered entities</td></tr>
        </tbody>
      </table>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">Compliance vs voluntary markets<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <ul>
        <li><strong>Compliance markets</strong> (EU ETS, CCTS compliance, CORSIA for airlines) create legal obligations. Their units are regulated instruments.</li>
        <li><strong>Voluntary carbon markets</strong> (Verra VCS, Gold Standard; integrity labels from ICVCM&apos;s Core Carbon Principles): companies buy offsets to back voluntary claims. India has historically been one of the largest suppliers (renewables, cookstoves), which has drawn integrity criticism.</li>
        <li><strong>Paris Article 6.2/6.4</strong>: country-to-country transfers (ITMOs) require corresponding adjustments. India has listed activities it will authorise for transfer, mainly advanced technologies, and keeps cheap abatement for its own NDC.</li>
        <li><strong>Offsets do not reduce CBAM.</strong> CBAM prices the embedded emissions of the product. Buying credits changes neither the verified intensity nor the certificates owed.</li>
      </ul>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">CORSIA<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <p>
        ICAO&apos;s Carbon Offsetting and Reduction Scheme for International Aviation requires airlines to offset growth in international emissions above a baseline (85% of 2019) using eligible units. The voluntary pilot ran 2021–23, and phase 1 runs 2024–26. India has not volunteered; it becomes subject from the mandatory phase in 2027 (with exemptions for small and developing states).
        For Indian sellers of credits, CORSIA phase-1 eligibility needs host-country authorisation and corresponding adjustment, which links it to India&apos;s Article 6 choices.
      </p>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">Net zero at firm level: a worked calculation<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <p>Take an illustrative 20 Mt integrated steelmaker with Scope 1 of 2.1, Scope 2 of 0.25 and Scope 3 (upstream) of 0.45 tCO₂e per tonne in {baseYear}.</p>
      <ul>
        <li>Absolute footprint = (2.1 + 0.25 + 0.45) × 20 Mt = <strong>{abs.toFixed(1)} MtCO₂e</strong>.</li>
        <li>A straight-line path to net zero by {target} needs an average of <strong>{linear.toFixed(2)} MtCO₂e/yr</strong> of absolute cuts. That equals <strong>{((linear / abs) * 100).toFixed(1)}%</strong> of base-year emissions every year, while output in India is still growing about 7–8% a year.</li>
        <li>With 7% output growth, intensity must fall faster than absolute emissions. Holding emissions flat to 2030 already needs intensity to drop about 29% (1/1.07⁵ ≈ 0.71).</li>
        <li>A credible plan states: an absolute and intensity target, a base year, scope boundaries (CBAM, Green Steel Taxonomy and BRSR differ), a residual-emissions cap (SBTi: about 5–10%), and the role of removals versus offsets (only for residuals).</li>
      </ul>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">Greenwashing: cases and lessons<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <ul>
        <li><strong>DWS (Deutsche Bank asset management), 2023:</strong> a US$19m SEC penalty over misstatements on ESG integration. Process claims need evidence.</li>
        <li><strong>KLM &quot;Fly Responsibly&quot;, Amsterdam court, 2024:</strong> ads implying sustainable flying through offsets were held misleading. Offsets cannot support &quot;sustainable&quot; claims.</li>
        <li><strong>HSBC, UK ASA, 2022:</strong> ads banned for omitting the bank&apos;s fossil-fuel financing. Selective disclosure counts as misleading.</li>
        <li><strong>India:</strong> the CCPA Guidelines for the Prevention and Regulation of Greenwashing (2024) and the ASCI environmental-claims guidelines now regulate vague claims such as &quot;green&quot;, &quot;eco-friendly&quot; and &quot;net zero&quot;.</li>
        <li><strong>Steel-specific risk:</strong> selling &quot;green steel&quot; on mass-balance or certificate bookkeeping. Quoting a BRSR intensity (corporate Scope 1+2) to EU buyers who need CBAM-boundary values. Calling a company &quot;carbon neutral&quot; on cheap offsets, which do nothing for CBAM. The protection is the same as for CBAM: installation-level, verified, boundary-explicit data.</li>
      </ul>

          </div>
        </details>
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">Actuarial and risk lens<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <ul>
        <li>Treat CBAM as a stochastic liability: cumulative cost = Σ volume × chargeable intensity(t) × price(t). Price paths can be simulated (for example, mean-reverting log-price), and the result reported as P50, P95 and CVaR of 2026–34 cash outflow. This is planned for the next model release.</li>
        <li>Deep-decarbonisation capex is a real option. Waiting has value while H₂ costs fall, but waiting loses value as free allocation drops in 2030–34. The optimal exercise date is the &quot;cash cliff&quot; question the model answers.</li>
      </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
