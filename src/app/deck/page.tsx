import type { Metadata } from "next";
import CliffChart from "@/components/pages/CliffChart";
import MiniWaterfall from "@/components/pages/MiniWaterfall";
import { ExposureMatrix, Flows, Footprint, GapChart } from "@/components/pages/IndustryCharts";
import { Prioritisation } from "@/components/pages/RoadmapCharts";
import FormulaFlow from "@/components/consulting/FormulaFlow";
import { EU_STEEL_BY_CN, EU_STEEL_TOTAL_KT, PRODUCERS, benchmarkFor } from "@/lib/data";
import { DEFAULT_SCENARIO as S, producerCost } from "@/lib/model";
import { cbamFactor } from "@/lib/cbam";
import { annualBill } from "@/lib/roadmap";
import { facts, initiatives } from "@/lib/storyline";
import Presenter from "@/components/Presenter";

export const metadata: Metadata = { title: "Executive deck", description: "Ten-slide executive summary of the CBAM India engagement, generated from the live model." };

const SECTIONS = ["Situation", "Diagnosis", "Solutions", "Roadmap"] as const;

function Slide({ n, section, title, source, children }: { n: number; section: (typeof SECTIONS)[number]; title: string; source?: string; children: React.ReactNode }) {
  return (
    <section className="slide mx-auto mb-8 w-full max-w-[1100px] rounded-[10px] border border-line bg-surface p-6 sm:p-9 flex flex-col">
      <div className="flex items-center justify-between gap-4 text-xs text-ink-3">
        <ol className="flex gap-3" aria-label="Deck sections">{SECTIONS.map((s) => <li key={s} className={s === section ? "text-ink font-medium border-b-2 border-ink pb-0.5" : ""}>{s}</li>)}</ol>
        <span>{n} / 10</span>
      </div>
      <h2 className="font-cond text-[1.55rem] sm:text-[1.8rem] leading-tight font-semibold mt-4 max-w-[46ch]">{title}</h2>
      <div className="mt-5 flex-1">{children}</div>
      {source && <p className="text-[11px] text-ink-3 mt-4">Source: {source}</p>}
    </section>
  );
}

export default function Deck() {
  const f = facts();
  const { eur, m, bn } = f.fmt;
  const full = { ...S, passThrough: 1 };
  const steel = PRODUCERS.filter((p) => p.sector === "steel");
  const names = steel.map((p) => p.name);
  const others = EU_STEEL_TOTAL_KT - steel.reduce((a, p) => a + p.euVolume.value * 1000, 0);
  const left = [...steel.map((p) => ({ name: p.name, kt: p.euVolume.value * 1000 })), { name: "Other Indian mills", kt: others }];
  const nodes = [...left.map((l) => ({ name: l.name, color: "var(--ink-2)" })), { name: "EU border (CBAM)", color: "var(--s2)" }, ...EU_STEEL_BY_CN.map((c) => ({ name: c.cn, color: "var(--s1)" }))];
  const links = [...left.map((l, i) => ({ source: i, target: left.length, value: l.kt })), ...EU_STEEL_BY_CN.map((c, i) => ({ source: left.length, target: left.length + 1 + i, value: c.kt }))];
  const points = steel.map((p) => { const x = producerCost(p, full, "actual", { year: 2030 }).net; return { name: p.name, x, y: p.ebitdaEUR.value, z: p.euVolume.value, tone: (x > 150 ? "s2" : "s1") as "s1" | "s2" }; });
  const gap = steel.map((p) => { const b = benchmarkFor(p), e = p.actualDirect.value, f26 = cbamFactor(2026) * b, f30 = cbamFactor(2030) * b; return { name: p.name, covered2026: +Math.min(e, f26).toFixed(2), gap2026: +Math.max(0, e - f26).toFixed(2), covered2030: +Math.min(e, f30).toFixed(2), gap2030: +Math.max(0, e - f30).toFixed(2) }; });
  const foot = PRODUCERS.filter((p) => p.sector !== "steel").map((p) => ({ name: p.name, charged: p.sector === "cement" ? p.actualDirect.value + p.indirect.value : p.actualDirect.value, uncharged: p.sector === "cement" ? 0 : p.indirect.value }));
  const ins = initiatives();
  const TONE = { Company: "s1", Government: "s2", "MSME clusters": "s3" } as const;
  const pts = ins.map((x, i) => ({ name: `${i + 1}. ${x.name}`, label: String(i + 1), x: x.ease, y: Math.log10(Math.max(10, x.impact)), z: 1, tone: TONE[x.owner] }));
  const share = Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100);

  return (
    <div>
      <p className="text-sm text-ink-3 mb-6 print:hidden">Ten slides generated from the live model. Print or save as PDF (Ctrl/Cmd + P, landscape) for one slide per page.</p>

      <Presenter>
      <Slide n={1} section="Situation" title={`CBAM will cost India's five largest steel exporters ${bn(f.vas.doNothing)} by 2034 if they do nothing; ${share}% of it is a tax on missing data`}>
        <div className="grid gap-6 sm:grid-cols-3">
          {[[eur(f.defaultPerT) + "/t", "2026 CBAM on Indian hot-rolled coil on EU default values", "text-s2i"], [eur(f.verifiedPerT) + "/t", "The same tonne, verified, from India's most efficient BF-BOF", "text-s1i"], [m(f.verification) + "/yr", "What verified data is worth to EU buyers of the five largest exporters", "text-s3i"]].map(([v, k, c]) => (
            <div key={k} className="border-t-2 border-ink pt-3"><p className={`font-cond text-4xl font-semibold ${c}`}>{v}</p><p className="text-sm text-ink-2 mt-2">{k}</p></div>
          ))}
        </div>
        <div className="grid gap-px mt-8 rounded-lg border border-line bg-line overflow-hidden sm:grid-cols-3 text-sm">
          {[["Situation", "EU importers have paid CBAM since 1 Jan 2026 at the EU carbon price (€82.32/t, Q3)."], ["Complication", "Free allocation goes to zero by 2034; unverified goods pay India's default plus up to 30%."], ["Question", "How should producers and the state respond, and in what order?"]].map(([k, v]) => <div key={k} className="bg-surface p-3"><p className="font-semibold">{k}</p><p className="text-ink-2">{v}</p></div>)}
        </div>
      </Slide>

      <Slide n={2} section="Situation" title="The 2.5% phase-out in 2026 applies to the benchmark, not to emissions, so the gap above the benchmark is charged in full from day one" source="Regulation (EU) 2023/956; Implementing Regs. 2025/2620, 2025/2621 (2026/1740).">
        <FormulaFlow />
        <p className="text-sm text-ink-2 mt-6">CBAM factor F<sub>t</sub>: 97.5% (2026) → 95% → 90% → 77.5% → <strong className="text-ink">51.5% (2030)</strong> → 39% → 26.5% → 14% → 0% (2034). Steel and aluminium count direct emissions only; cement also counts electricity.</p>
      </Slide>

      <Slide n={3} section="Diagnosis" title="The bill steepens from 2030, when free allocation drops from 77.5% to 51.5%" source="Model; volumes and intensities grade D.">
        <CliffChart verified={annualBill("actual")} defaults={annualBill("default")} names={names} />
      </Slide>

      <Slide n={4} section="Diagnosis" title="Five producers ship about 90% of India's CBAM steel to the EU, mostly coated and hot-rolled flat products" source="Eurostat Comext 2025 (product split); ARE and estimates (producer split).">
        <Flows nodes={nodes} links={links} />
      </Slide>

      <Slide n={5} section="Diagnosis" title="Route matters as much as intensity: DRI-heavy and thin-margin producers are the most exposed by 2030" source="Model at €82.32 growing 3%/yr; EBITDA FY26 results and estimates.">
        <ExposureMatrix points={points} xMid={150} yMid={100} />
      </Slide>

      <Slide n={6} section="Diagnosis" title="By 2030 every producer pays on more than half of its emissions, and aluminium's electricity is the tail risk" source="Implementing Reg. 2025/2620 benchmarks; intensities grade D.">
        <GapChart data={gap} />
        <div className="mt-4"><Footprint data={foot} /></div>
      </Slide>

      <Slide n={7} section="Solutions" title={`Five moves cut the 2026–34 bill from ${bn(f.vas.doNothing)} to ${bn(f.vas.residual)}; verification does ${share}% of the work`} source="Model; moves applied in sequence.">
        <MiniWaterfall steps={f.vas.steps} height={380} />
      </Slide>

      <Slide n={8} section="Solutions" title={f.h2first ? `Hydrogen DRI is an option, not a project: worth ${eur(f.h2.optionValue)}/t, exercise from ${f.h2first.year} only above ${eur(f.h2first.price!)}/t` : "Hydrogen DRI is an option, not a project"} source="Binomial real-option model; IEA cost ranges (grade D).">
        <div className="grid gap-6 sm:grid-cols-3">
          {[[eur(f.h2.npvNow) + "/t", "NPV if built in 2026 on a dedicated EU line"], [eur(f.h2.optionValue) + "/t", "Value of keeping the option to build any year to 2034"], [f.h2first ? `${f.h2first.year}` : "never", "Earliest year it is optimal to build at current inputs"]].map(([v, k]) => (
            <div key={k} className="border-t-2 border-ink pt-3"><p className="font-cond text-4xl font-semibold">{v}</p><p className="text-sm text-ink-2 mt-2">{k}</p></div>
          ))}
        </div>
        <p className="text-ink-2 mt-6 max-w-[70ch]">Stay H₂-ready (gas-DRI shafts, site and power); let the certificate price and a buyer premium trigger the switch. Routing EU orders to the cleanest plant is worth {m(f.optUplift)}/yr for JSW in 2030 at no capex.</p>
      </Slide>

      <Slide n={9} section="Roadmap" title="Quick wins are verification, contracts, routing and verifier capacity; hydrogen and the FTA are staged bets" source="Model values for initiatives 1, 3, 4, 5, 7; others estimated.">
        <Prioritisation points={pts} />
      </Slide>

      <Slide n={10} section="Roadmap" title={`Government's lever: an explicit, Article 9-creditable carbon price keeps ${bn(f.polExplicit)} in India; CCTS as designed keeps ${m(f.polCcts)}`}>
        <ol className="list-decimal pl-5 space-y-2 text-ink-2">
          <li><strong className="text-ink">Now:</strong> verify every EU-bound tonne; index CBAM cost-sharing in EU contracts; route EU orders to the cleanest plants.</li>
          <li><strong className="text-ink">2026–29:</strong> run the efficiency, scrap and biochar stack before the 2030 cliff; share verified data with MSME buyers.</li>
          <li><strong className="text-ink">2030+:</strong> exercise the H₂-DRI option when the price and premium triggers are met.</li>
          <li><strong className="text-ink">Government:</strong> an explicit carbon price on exported embedded carbon; national verifier capacity; CCTS recognition and a phased downstream scope in the India–EU FTA.</li>
          <li><strong className="text-ink">MSMEs:</strong> US${f.dsIn.toFixed(1)}bn of goods are already in scope; cluster MRV desks in Ludhiana, Rajkot and Moradabad.</li>
        </ol>
      </Slide>
      </Presenter>
    </div>
  );
}
