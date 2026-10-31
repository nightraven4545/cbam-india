import type { Metadata } from "next";
import { PRODUCERS, LEVERS, STEEL_HR, benchmarkFor } from "@/lib/data";
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
        <li>B is the CBAM benchmark for the CN code. Each producer gets a route-weighted benchmark: BF-BOF {STEEL_HR.benchmarkBFBOF.value}, DRI-EAF {STEEL_HR.benchmarkDRIEAF.value}, scrap-EAF {STEEL_HR.benchmarkScrapEAF.value} for CN 7208.</li>
        <li>CSCF (the cross-sectoral correction factor) is 1 for 2026 and held at 1 thereafter.</li>
        <li>Iron &amp; steel and aluminium count direct emissions only (Annex II); cement and fertilisers also count indirect emissions.</li>
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
        <thead><tr><th>Producer</th><th>Benchmark</th><th>Direct t/t</th><th>EU Mt</th><th>Output Mt</th><th>EBITDA €/t</th><th>Sources</th></tr></thead>
        <tbody>
          {PRODUCERS.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{benchmarkFor(p).toFixed(3)}</td>
              <td>{p.actualDirect.value} ({p.actualDirect.confidence})</td>
              <td>{p.euVolume.value} ({p.euVolume.confidence})</td>
              <td>{p.production.value} ({p.production.confidence})</td>
              <td>{p.ebitdaEUR.value} ({p.ebitdaEUR.confidence})</td>
              <td className="text-xs">{p.actualDirect.source}; {p.euVolume.source}</td>
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
        <thead><tr><th>Lever</th><th>Direct cut</th><th>Scope 2 cut</th><th>Capex €/t</th><th>OPEX Δ €/t</th><th>Life</th><th>TRL</th></tr></thead>
        <tbody>{LEVERS.map((l) => <tr key={l.id}><td>{l.name}</td><td>{l.abatement}</td><td>{l.scope2Cut}</td><td>{l.capex}</td><td>{l.opexDelta}</td><td>{l.life}</td><td>{l.trl}</td></tr>)}</tbody>
      </table>
      <p>Lever ranges are D-grade, drawn from the IEA Iron &amp; Steel Technology Roadmap, the Ministry of Steel&apos;s &quot;Greening the Steel Sector in India&quot; (2024) and TERI/CSTEP studies, adjusted for Indian LNG, scrap and H₂ costs.</p>

      <h2>Known limitations</h2>
      <ul>
        <li>One CN code (7208) per producer. Precursor emissions for cold-rolled and coated products are not yet split out.</li>
        <li>EU volumes are flat across 2026–34. The tariff-rate quota and demand responses are not yet modelled.</li>
        <li>Benchmarks update for imports from 2027, and defaults and mark-ups are due for revision by December 2027.</li>
        <li>Producer inputs are estimates. Replace them with verified installation data where available.</li>
      </ul>
    </article>
  );
}
