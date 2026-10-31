import type { Metadata } from "next";
import { PageHeader } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import { EtsHistory, Landscape, CbamTimeline } from "@/components/pages/MarketsCharts";
import { ETS_PRICES } from "@/lib/roadmap";

export const metadata: Metadata = { title: "Carbon markets", description: "Carbon taxes, EU ETS, India's PAT/ESCerts and CCTS, voluntary markets, CORSIA, futures, net-zero maths and greenwashing." };

// Worked firm-level net-zero example (illustrative integrated steelmaker, not a real company).
const base = { output: 20, s1: 2.1, s2: 0.25, s3: 0.45 }; // Mt crude steel; tCO2e/t
const baseYear = 2025, target = 2050;
const abs = (base.s1 + base.s2 + base.s3) * base.output;
const linear = abs / (target - baseYear);

// Approximate 2026 scale and price of major carbon-pricing schemes (ICAP Status Report, World Bank State & Trends; grade D).
const SCHEMES = [
  { name: "EU ETS", x: 1300, y: 80, kind: "Compliance" },
  { name: "UK ETS", x: 100, y: 50, kind: "Compliance" },
  { name: "China ETS", x: 8000, y: 10, kind: "Compliance" },
  { name: "Korea ETS", x: 600, y: 6, kind: "Compliance" },
  { name: "Singapore tax", x: 40, y: 31, kind: "Tax" },
  { name: "CORSIA units", x: 150, y: 20, kind: "Offset" },
  { name: "Voluntary market", x: 200, y: 5, kind: "Offset" },
  { name: "India CCTS (pre-trading)", x: 700, y: 1, kind: "Compliance" },
];

export default function Markets() {
  return (
    <div>
      <PageHeader title="The EU carbon price is ten times what most of Asia pays, and CBAM now carries it to India's factory gate"
        lede="A primer on the instruments behind the analysis: how carbon is priced, where India's own markets stand, and what firms should and should not claim." />
      <div className="grid gap-6">
        <Exhibit n={1} title="Europe prices carbon at about €80/t; China, Korea and the voluntary market sit below €10, and India's CCTS has no price yet"
          subtitle="Major carbon-pricing schemes: emissions covered (log scale, MtCO₂) against 2026 price (€/tCO₂)"
          source="ICAP Emissions Trading Worldwide Status Report; World Bank State and Trends of Carbon Pricing; approximate values (grade D). CCTS trading expected from late 2026, so its price is shown at ~0."
          table={{ columns: ["Scheme", "Covered MtCO₂", "Price €/t", "Type"], rows: SCHEMES.map((x) => [x.name, x.x, x.y, x.kind]) }}>
          <Landscape points={SCHEMES} />
        </Exhibit>
        <div className="grid gap-6 lg:grid-cols-2">
          <Exhibit n={2} title="The EU price has held €65–85/t since 2022; that is the price CBAM certificates follow"
            subtitle="EU allowance (EUA) annual average price, €/tCO₂"
            source="ICE front-December annual averages (LSEG Carbon Research for 2025); 2026 = average of the Commission's Q1–Q3 CBAM certificate prices."
            table={{ columns: ["Year", "€/t"], rows: ETS_PRICES.map((x) => [x.year, x.price]) }}>
            <EtsHistory data={ETS_PRICES} />
          </Exhibit>
          <Exhibit n={3} title="Law in force runs to 2034; the open proposals would widen scope and slow the phase-out"
            subtitle="CBAM milestones, law vs proposal">
            <CbamTimeline />
          </Exhibit>
        </div>
      </div>
      <h2 className="font-cond text-[1.7rem] font-semibold mt-14 mb-4">Primer: instruments, India&apos;s stack, net zero and greenwashing</h2>
      <div className="grid gap-3">
        <details className="group rounded-[10px] border border-line bg-surface px-5 py-1 open:pb-4">
          <summary className="cursor-pointer list-none py-3 font-cond text-lg font-semibold flex items-center justify-between gap-4">Carbon tax vs emissions trading<span className="text-ink-3 text-sm font-sans font-normal group-open:hidden">Expand</span><span className="text-ink-3 text-sm font-sans font-normal hidden group-open:inline">Collapse</span></summary>
          <div className="prose-cbam">
      <table>
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
      <table>
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
