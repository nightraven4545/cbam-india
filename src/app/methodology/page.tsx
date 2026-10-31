import type { Metadata } from "next";
import { PRODUCERS, LEVERS, PRODUCTS, COMPETITORS, PEER_DEFAULTS, benchmarkFor } from "@/lib/data";
import { YEARS, cbamFactor, defaultMarkup } from "@/lib/cbam";

export const metadata: Metadata = { title: "Methodology · CBAM India", description: "Formulas, rule tables, confidence grades and sources behind the CBAM India model." };

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function Methodology() {
  return (
    <article className="prose-cbam max-w-3xl">
      <h1 className="text-3xl font-semibold">Methodology</h1>

      <h2>Core formula (definitive period)</h2>
      <p><code>certificates/t = max(0, E_applied − F_t × CSCF_t × B)</code></p>
      <p><code>E_applied = verified actual</code>, or <code>India default × (1 + mark-up_t)</code> when the data is unverified</p>
      <p><code>CBAM €/t = certificates × P_t − Article 9 origin-carbon-price credit</code> · <code>exporter EBITDA hit = CBAM €/t × pass-through</code></p>
      <ul>
        <li>B is the CBAM benchmark (Implementing Reg. 2025/2620, Column B) for the CN code, weighted by each producer&apos;s route shares:{" "}
          {(["steel", "aluminium"] as const).map((k) => <span key={k}>CN {PRODUCTS[k].cn}: {PRODUCTS[k].benchmarks.map((b) => `${b.route} ${b.value}`).join(", ")}; India default {PRODUCTS[k].defaultValue.value}. </span>)}
        </li>
        <li>CSCF (the cross-sectoral correction factor) is 1 for 2026 and held at 1 thereafter.</li>
        <li>Iron &amp; steel and aluminium count direct emissions only (Annex II); cement and fertilisers also count indirect emissions. The &quot;indirect stress test&quot; adds each producer&apos;s electricity emissions to E while keeping the benchmark unchanged. It is hypothetical.</li>
        <li>The Article 9 credit is modelled as price × chargeable tonnes, capped at the gross cost. This is a simplification until the rules for crediting CCTS are known.</li>
        <li>The engine reproduces the Commission&apos;s example (1.2 t embedded, benchmark 1.0, 2026 → 0.225 t) and the €277.60/t default cost for Indian HR flat steel at €82.32. Both are unit-tested.</li>
      </ul>

      <h2>Rule tables</h2>
      <table>
        <thead><tr><th>Year</th>{YEARS.map((y) => <th key={y}>{y}</th>)}</tr></thead>
        <tbody>
          <tr><td>CBAM factor (law)</td>{YEARS.map((y) => <td key={y}>{pct(cbamFactor(y, "law"))}</td>)}</tr>
          <tr><td>COM(2026) 616 (proposal)</td>{YEARS.map((y) => <td key={y}>{pct(cbamFactor(y, "proposal"))}</td>)}</tr>
          <tr><td>Default mark-up</td>{YEARS.map((y) => <td key={y}>{pct(defaultMarkup(y))}</td>)}</tr>
        </tbody>
      </table>

      <h2>Confidence grades</h2>
      <table>
        <tbody>
          <tr><td><strong>A</strong></td><td>CBAM-verified installation data (none public yet)</td></tr>
          <tr><td><strong>B</strong></td><td>Regulation or official statistic (benchmarks, factors, prices)</td></tr>
          <tr><td><strong>C</strong></td><td>Company site-level disclosure</td></tr>
          <tr><td><strong>D</strong></td><td>Analyst estimate or derived value (e.g. CCTS plant baseline × 0.85 assumed direct share)</td></tr>
          <tr><td><strong>E</strong></td><td>EU default value</td></tr>
        </tbody>
      </table>

      <h2>Producer inputs</h2>
      <table>
        <thead><tr><th>Producer</th><th>Sector</th><th>Benchmark</th><th>Direct t/t</th><th>Indirect t/t</th><th>EU Mt</th><th>Output Mt</th><th>EBITDA €/t</th><th>Sources</th></tr></thead>
        <tbody>
          {PRODUCERS.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.sector}</td><td>{benchmarkFor(p).toFixed(3)}</td>
              <td>{p.actualDirect.value} ({p.actualDirect.confidence})</td>
              <td>{p.indirect.value} ({p.indirect.confidence})</td>
              <td>{p.euVolume.value} ({p.euVolume.confidence})</td>
              <td>{p.production.value} ({p.production.confidence})</td>
              <td>{p.ebitdaEUR.value} ({p.ebitdaEUR.confidence})</td>
              <td className="text-xs">{p.actualDirect.source}; {p.euVolume.source}; {p.production.source}; {p.ebitdaEUR.source}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Lever economics</h2>
      <p>
        Per tonne of capacity: capex in 2026, then benefits from 2027 over the lever&apos;s life at a 10% discount rate.
        Annual benefit = avoided certificates × price × pass-through × EU share of output (or 100% for a dedicated EU line) + CCTS credit price × (direct + indirect cut) + green premium × direct cut × EU share − OPEX delta.
        The avoided-certificate saving is capped at the certificates actually owed. MAC = (annualised capex + OPEX delta) ÷ tCO₂ cut, excluding carbon revenues.
      </p>
      <table>
        <thead><tr><th>Lever</th><th>Sector</th><th>Direct cut</th><th>Scope 2 cut</th><th>Capex €/t</th><th>OPEX Δ €/t</th><th>Life</th><th>TRL</th></tr></thead>
        <tbody>{LEVERS.map((l) => <tr key={l.id}><td>{l.name}</td><td>{l.sector}</td><td>{l.abatement}</td><td>{l.scope2Cut}</td><td>{l.capex}</td><td>{l.opexDelta}</td><td>{l.life}</td><td>{l.trl}</td></tr>)}</tbody>
      </table>
      <p>Lever ranges are D-grade, drawn from the IEA Iron &amp; Steel Technology Roadmap, the Ministry of Steel&apos;s &quot;Greening the Steel Sector in India&quot; (2024) and TERI/CSTEP studies, adjusted for Indian LNG, scrap and H₂ costs.</p>

      <h2>Carbon-price risk (Monte Carlo)</h2>
      <p>
        Prices follow the scenario path with a mean-reverting log deviation: <code>ln P_t = ln(path_t) + y_t</code>, <code>y_t+1 = (1 − κ) y_t + σ ε</code>, with y fixed at 0 in 2026 because three of the four 2026 quarterly prices are already published.
        Defaults: κ 0.3, σ 30%/yr (EUA realised volatility has run 30–50%), 2,000 paths and a fixed seed, so results are reproducible. We report P5, P50, P95 and CVaR95 (the mean of the worst 5%) of the 2026–34 exporter exposure.
        With σ = 0 the model collapses exactly to the deterministic case (unit-tested).
      </p>

      <h2>Sensitivity (tornado)</h2>
      <p>Each driver moves independently around the current scenario: certificate price ±20%, growth ±2 pp, direct intensity ±20%, EU volume ±20%, pass-through ±20%, and the free-allocation path law ↔ COM(2026) 616. Bars are sorted by swing.</p>

      <h2>Delivered-cost crossover</h2>
      <p>Delivered cost = FOB + freight + max(0, E − F_t × B) × P for each origin, which is linear in P. An EU BF-BOF mill is modelled with the same free-allocation formula under the EU ETS. Crossover = the P at which two lines meet (unit-tested). FOB, freight and competitor intensities are illustrative grade-D 2026 levels.</p>
      <table>
        <thead><tr><th>Origin</th><th>FOB €/t</th><th>Freight €/t</th><th>tCO₂/t</th><th>Benchmark</th><th>Note</th></tr></thead>
        <tbody>{COMPETITORS.map((c) => <tr key={c.origin}><td>{c.origin}</td><td>{c.fob}</td><td>{c.freight}</td><td>{c.intensity.toFixed(2)}</td><td>{c.benchmark}</td><td>{c.note}</td></tr>)}</tbody>
      </table>

      <h2>Country default values</h2>
      <table>
        <thead><tr><th>Sector</th><th>Country</th><th>Default tCO₂/t</th><th>Source</th></tr></thead>
        <tbody>{(["steel", "aluminium"] as const).flatMap((k) => PEER_DEFAULTS[k].map((x) => <tr key={k + x.country}><td>{k}</td><td>{x.country}</td><td>{x.value}</td><td className="text-xs">{x.source}</td></tr>))}</tbody>
      </table>

      <h2>Phase 3 methods</h2>
      <ul>
        <li><strong>Article 9 simulator:</strong> credit per tonne = min(gross CBAM, paid in India) × the qualifying share. Paid = price × intensity (explicit price) or price × intensity × target cut (CCTS intensity design). Modelled producers are scaled to the Eurostat 2025 sector volume (steel 4.01 Mt, aluminium 0.313 Mt).</li>
        <li><strong>Downstream radar:</strong> EU-27 imports from India in 2024 by HS-4 (UN Comtrade, reporter 97, partner 699). Status: Annex I today vs the COM(2025) 989 proposal (only some lines are covered). Cost = metal tonnes × max(0, E − F_t × B) × P, with steel E = 2.2 verified or the default plus mark-up.</li>
        <li><strong>Trade optimiser:</strong> two markets with linear margins. The EU net premium per plant = premium − pass-through × plant CBAM, with plant benchmarks weighted by DRI share. Greedy allocation under the cap is exactly optimal (checked against brute force in tests).</li>
        <li><strong>H₂ real option:</strong> a CRR binomial lattice on the certificate price (u = e^σ, drift = scenario growth, 10% discount). It is an American option to invest 2026–34. Project value at exercise = 25 years of avoided CBAM on a dedicated EU line × pass-through + green premium − an H₂ OPEX premium that falls with the H₂ cost, minus capex. After exercise, prices follow scenario growth.</li>
        <li><strong>Cement:</strong> indirect emissions are charged by law. Defaults (1.48 t) are taken as already covering them. Intensities are on an OPC basis (CN 2523 29); blended cements fall under other CN codes.</li>
      </ul>

      <h2>Known limitations</h2>
      <ul>
        <li>One CN code per sector (7208 HR flat; 7601 unwrought aluminium). Cold-rolled and coated steel (7209/7210) and semi-fabricated aluminium carry higher defaults that are not yet modelled, because India&apos;s country defaults for those codes could not be verified.</li>
        <li>EU volumes are flat across 2026–34. The tariff-rate quota and demand responses are not yet modelled.</li>
        <li>Benchmarks update for imports from 2027, and defaults and mark-ups are due for revision by December 2027.</li>
        <li>Producer inputs are estimates. Replace them with verified installation data where available.</li>
      </ul>
    </article>
  );
}
