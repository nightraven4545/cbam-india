import type { Metadata } from "next";
import { COMPETITORS, PRODUCERS } from "@/lib/data";
import { DEFAULT_SCENARIO as S, crossoverPrice, cumulativeExposure, leverEconomics, producerSummary, tornado, trajectory } from "@/lib/model";
import { DEFAULT_RISK, exposureStats, pricePaths } from "@/lib/risk";
import { article9 } from "@/lib/policy";
import { DEFAULT_H2, h2Option } from "@/lib/options";
import { DOWNSTREAM, LEVERS } from "@/lib/data";

export const metadata: Metadata = { title: "Executive deck · CBAM India", description: "Ten-slide executive summary of EU CBAM exposure for Indian steel and aluminium, generated from the live model." };

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-IN")}`;
const m = (n: number) => `€${Math.round(n / 1e6).toLocaleString("en-IN")}m`;
const bn = (n: number) => `€${(n / 1e9).toFixed(1)}bn`;

function Slide({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="slide relative mx-auto mb-8 w-full max-w-5xl rounded-xl border border-line bg-surface p-6 sm:p-10 aspect-auto sm:aspect-[16/9] flex flex-col">
      <h2 className="text-xl sm:text-2xl font-semibold leading-snug max-w-4xl">{title}</h2>
      <div className="mt-5 flex-1 text-sm sm:text-base text-ink-2 [&_strong]:text-ink">{children}</div>
      <p className="mt-4 text-[10px] text-ink-3 flex justify-between"><span>CBAM India · model as of 31 Oct 2026 · grade-D producer inputs</span><span>{n}/10</span></p>
    </section>
  );
}

const Big = ({ v, k }: { v: string; k: string }) => (
  <div className="rounded-lg border border-line p-4"><p className="text-2xl sm:text-3xl font-semibold text-ink">{v}</p><p className="text-xs mt-1">{k}</p></div>
);

export default function Deck() {
  const full = { ...S, passThrough: 1 };
  const steel = PRODUCERS.filter((p) => p.sector === "steel");
  const rows = steel.map((p) => ({ p, r: producerSummary(p, full), t: trajectory(p, full), cum: cumulativeExposure(p, full, "actual") }));
  const verif = rows.reduce((a, x) => a + x.r.verificationValue, 0);
  const jsw = steel[0];
  const paths = pricePaths(S, DEFAULT_RISK);
  const ra = exposureStats(jsw, S, "actual", paths), rd = exposureStats(jsw, S, "default", paths);
  const tor = tornado(jsw, S);
  const [iv, idf] = COMPETITORS;
  const eu = COMPETITORS.find((c) => c.origin.startsWith("EU"))!;
  const xv = crossoverPrice(iv, eu, 2026, "law"), xd = crossoverPrice(idf, eu, 2026, "law");
  const vedanta = PRODUCERS.find((p) => p.id === "vedanta")!;
  const alA = producerSummary(vedanta, full), alI = producerSummary(vedanta, { ...full, includeIndirect: true });
  const tata = PRODUCERS.find((p) => p.id === "tata")!;
  const lev = LEVERS.filter((l) => l.sector === "steel").map((l) => ({ l, e: leverEconomics(tata, l, S, { dedicatedEU: false, cctsPrice: 0, greenPremium: 0, discount: 0.1 }) }));
  const pol = (mech: "explicit" | "ccts") => article9(S, "steel", { price: 20, mechanism: mech, targetCut: 0.05, qualifying: 0.6 }).reduce((a, r) => a + r.retained, 0);
  const h2 = h2Option(S, DEFAULT_H2), h2p = h2Option(S, { ...DEFAULT_H2, greenPremium: 150 });
  const dsUsd = (st: "inScope" | "proposed") => DOWNSTREAM.filter((d) => d.status === st).reduce((a, d) => a + d.usdM, 0) / 1000;
  const firstEx = (r: typeof h2) => r.thresholds.find((t) => t.price !== null);

  return (
    <div className="deck">
      <p className="text-sm text-ink-3 mb-6 print:hidden">Print or save as PDF (Ctrl/Cmd + P, landscape) for a slide-per-page deck. Every number is computed live from the model.</p>

      <Slide n={1} title="EU CBAM is now a cash cost on Indian steel. Most of it is a tax on missing data, and from 2030 a tax on the blast furnace.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Big v={eur(rows[1].r.def.net) + "/t"} k="2026 CBAM on Indian HR coil using EU default values" />
          <Big v={eur(rows[1].r.act.net) + "/t"} k="The same tonne, verified, from India's most efficient BF-BOF" />
          <Big v={m(verif) + "/yr"} k="What verified data is worth to EU buyers of the 5 largest exporters" />
        </div>
        <p className="mt-5">Free allocation falls from 77.5% (2029) to 51.5% (2030) and to 0% (2034). Even verified BF-BOF steel then pays {eur(Math.min(...rows.map((x) => x.t[8].actual)))}–{eur(Math.max(...rows.map((x) => x.t[8].actual)))}/t.</p>
      </Slide>

      <Slide n={2} title="The mechanism: the 2.5% phase-out in 2026 applies to the benchmark, not to emissions, so the gap above the benchmark is priced in full from day one">
        <p className="font-mono text-ink">certificates/t = max(0, E − F<sub>t</sub> × B) · cost = certificates × P − Art. 9 credit</p>
        <ul className="list-disc pl-5 mt-4 space-y-1">
          <li>F<sub>t</sub> (CBAM factor): 97.5% → 95% → 90% → 77.5% → <strong>51.5% (2030)</strong> → 39% → 26.5% → 14% → 0% (2034)</li>
          <li>Unverified goods use India&apos;s default (4.28 t for HR flat) plus a 10% / 20% / 30% mark-up (2026 / 2027 / 2028+)</li>
          <li>Steel and aluminium are charged on direct emissions only; cement also on electricity</li>
          <li>The EU importer pays; the exporter bears it through price (modelled as a pass-through share)</li>
        </ul>
      </Slide>

      <Slide n={3} title="Exposure differs sharply by producer: coal-DRI and mixed-route mills get the smallest free allocation">
        <table className="w-full text-sm">
          <thead className="text-left text-ink-3"><tr><th>Producer</th><th>Verified t/t</th><th>2026 €/t</th><th>2030 €/t</th><th>2026–34 cum. (100% pass-through)</th></tr></thead>
          <tbody>{rows.map(({ p, r, t, cum }) => <tr key={p.id} className="border-t border-line"><td className="py-1">{p.name}</td><td>{p.actualDirect.value}</td><td>{eur(r.act.net)}</td><td>{eur(t[4].actual)}</td><td>{m(cum)}</td></tr>)}</tbody>
        </table>
      </Slide>

      <Slide n={4} title="Verification is the highest-return lever in the sector, and it also cuts tail risk">
        <div className="grid gap-4 sm:grid-cols-2">
          <Big v={`${m(ra.p50)} → ${m(ra.cvar95)}`} k="JSW 2026–34 exposure with verified data: median → worst-5% average (50% pass-through)" />
          <Big v={`${m(rd.p50)} → ${m(rd.cvar95)}`} k="The same on EU default values" />
        </div>
        <p className="mt-4">{DEFAULT_RISK.n.toLocaleString()} mean-reverting carbon-price paths (σ {Math.round(DEFAULT_RISK.sigma * 100)}%). The biggest driver of exposure is <strong>{tor.rows[0].driver.replace(" ±20%", "").toLowerCase()}</strong>, which management controls, ahead of the EU price, which it does not.</p>
      </Slide>

      <Slide n={5} title="Competitiveness: default values erase India's cost edge over EU mills, while verified data keeps it">
        <div className="grid gap-4 sm:grid-cols-2">
          <Big v={xd ? eur(xd) + "/tCO₂" : "n/a"} k="Price above which Indian coil on defaults costs more delivered than EU-made BF-BOF coil (today ≈ €82)" />
          <Big v={xv ? eur(xv) + "/tCO₂" : "n/a"} k="The same crossover with verified Indian data" />
        </div>
        <p className="mt-4">Türkiye&apos;s EAF-heavy, short-haul steel beats India at almost any carbon price; Korea is a close substitute. A 2.8 Mt EU tariff-rate quota (50% duty above it) now caps volume as well.</p>
      </Slide>

      <Slide n={6} title="Aluminium: a small bill today, an existential one if electricity is ever brought into scope">
        <div className="grid gap-4 sm:grid-cols-2">
          <Big v={eur(alA.act.net) + "/t"} k="Vedanta 2026 CBAM, verified (anode + PFC only)" />
          <Big v={eur(alI.act.net) + "/t"} k="The same if captive-coal power emissions were charged (EBITDA ≈ €750/t)" />
        </div>
        <p className="mt-4">So renewable power for smelters is best valued as <strong>insurance on future CBAM scope</strong>. On today&apos;s rules it has negative NPV and zero CBAM benefit.</p>
      </Slide>

      <Slide n={7} title="Decarbonisation levers: efficiency pays now; deep levers need a dedicated EU line, a premium or a domestic carbon price">
        <table className="w-full text-sm">
          <thead className="text-left text-ink-3"><tr><th>Lever (Tata Steel, plant-wide)</th><th>NPV €/t</th><th>MAC €/tCO₂</th><th>Steel CBAM?</th></tr></thead>
          <tbody>{lev.map(({ l, e }) => <tr key={l.id} className="border-t border-line"><td className="py-1">{l.name}</td><td>{eur(e.npv)}</td><td>{e.mac === null ? "–" : eur(e.mac)}</td><td>{e.cbamRelevant ? "yes" : "no"}</td></tr>)}</tbody>
        </table>
      </Slide>

      <Slide n={8} title="Hydrogen DRI is a real option: wait, keep it ready, and let the carbon price and buyers trigger it">
        <div className="grid gap-4 sm:grid-cols-3">
          <Big v={eur(h2.npvNow) + "/t"} k="NPV if built in 2026 (dedicated EU line, no premium)" />
          <Big v={eur(h2.optionValue) + "/t"} k="Value of the option to build any year to 2034" />
          <Big v={firstEx(h2p) ? `${firstEx(h2p)!.year}` : "never"} k={`Earliest optimal build with a €150/t green premium${firstEx(h2p) ? ` (price ≥ ${eur(firstEx(h2p)!.price!)})` : ""}`} />
        </div>
        <p className="mt-4">Build H₂-ready DRI shafts (gas first) now; switch fuel when green H₂ and the carbon price cross the threshold.</p>
      </Slide>

      <Slide n={9} title="Policy: how India prices carbon decides whether CBAM revenue goes to Brussels or stays in India">
        <div className="grid gap-4 sm:grid-cols-2">
          <Big v={bn(pol("explicit"))} k="Steel CBAM retained in India 2026–34 with an explicit €20/t carbon price (60% of exports with accepted evidence)" />
          <Big v={m(pol("ccts"))} k="The same price under CCTS as designed (only the above-target slice pays)" />
        </div>
        <p className="mt-4">MSMEs are already exposed: fasteners, tubes, structures and other metal articles (US${dsUsd("inScope").toFixed(1)}bn of EU imports from India in 2024) are in scope today; the 2028 proposal would add headings worth US${dsUsd("proposed").toFixed(1)}bn (machinery and auto parts; only some lines).</p>
      </Slide>

      <Slide n={10} title="Recommendations">
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Now:</strong> install CBAM-grade MRV with accredited verification for every EU-supplying installation; pass verified data down to MSME buyers.</li>
          <li><strong>Now:</strong> rewrite EU contracts with CBAM cost-sharing indexed to the certificate price and a verified-intensity warranty.</li>
          <li><strong>2026–29:</strong> run the negative-cost efficiency stack; route the lowest-carbon plants to EU contracts.</li>
          <li><strong>Before 2030:</strong> stage H₂-ready DRI as a real option; price green premia into EU offtakes.</li>
          <li><strong>Government:</strong> make CCTS an explicit, Article 9-creditable price on exports; build verifier capacity; negotiate recognition and a phased downstream scope in the India–EU FTA.</li>
        </ol>
      </Slide>
    </div>
  );
}
