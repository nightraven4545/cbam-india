import Link from "next/link";
import { PageHeader, Panel } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import { Ticker } from "@/components/consulting/Ticker";
import CliffChart from "@/components/pages/CliffChart";
import MiniWaterfall from "@/components/pages/MiniWaterfall";
import { annualBill } from "@/lib/roadmap";
import { facts } from "@/lib/storyline";
import { DirectIcon, VerifiedIcon, EuroIcon } from "@/components/visual/icons";
import { Scorecard } from "@/components/consulting/exhibits";
import { SCORECARD_RULES, scorecard } from "@/lib/exhibits";

export default function Summary() {
  const f = facts();
  const { eur, m, bn } = f.fmt;
  const defaults = annualBill("default"), verified = annualBill("actual");
  const names = f.sums.map((x) => x.p.name);
  const verifyStep = -f.vas.steps[1].value;
  const share = Math.round((verifyStep / f.vas.doNothing) * 100);
  const sc = scorecard();
  const reds = sc.map((r) => ({ name: r.p.name, n: Object.values(r.cells).filter((c) => c.level === "red").length })).sort((a, b) => b.n - a.n);
  const allRedPenalty = sc.filter((r) => r.cells.penalty.level !== "green").length;
  const recs = [
    { title: "Verify every EU-bound tonne now", body: `Accredited, installation-level emissions data replaces India's punitive default. It is worth ${m(f.verification)} a year to EU buyers of the five largest exporters.`, value: bn(verifyStep), when: "Next 6 months", owner: "Producers", href: "/roadmap" },
    { title: "Reprice the risk in EU contracts", body: "Index CBAM cost-sharing to the certificate price instead of conceding full pass-through. Back it with a verified-intensity warranty.", value: "Margin protection", when: "Next contract round", owner: "Producers", href: "/model" },
    { title: "Serve Europe from the cleanest plants", body: `Route EU orders to the lowest-carbon sites and run the efficiency, scrap and biochar stack before the 2030 cliff. Worth ${m(f.optUplift)}/yr for JSW from routing alone in 2030.`, value: bn(-(f.vas.steps[2].value + f.vas.steps[3].value + f.vas.steps[4].value)), when: "2026–29", owner: "Producers", href: "/industry" },
    { title: "Keep hydrogen as a staged option", body: f.h2first ? `Building H₂-DRI in 2026 destroys ${eur(-f.h2.npvNow)}/t of value. Stay H₂-ready; exercise from ${f.h2first.year} if the certificate price passes ${eur(f.h2first.price!)}/t, or earlier with a buyer premium.` : "Stay H₂-ready; do not commit capital yet.", value: `${eur(f.h2.optionValue)}/t option`, when: "2030+", owner: "Producers", href: "/model" },
    { title: "Make India's carbon price count in Brussels", body: `An explicit, Article 9-creditable price on exported carbon keeps ${bn(f.polExplicit)} in India over 2026–34; CCTS in its current intensity design keeps ${m(f.polCcts)}.`, value: bn(f.polExplicit), when: "2026–29", owner: "Government", href: "/policy" },
  ];

  return (
    <div>
      <PageHeader step="situation"
        title={`Europe's carbon border will cost India's five largest steel exporters ${bn(f.vas.doNothing)} by 2034 if they do nothing. ${share}% of it is a tax on missing data.`}>
        <div className="grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-3 text-sm">
          {[
            ["Situation", "Since 1 January 2026, EU importers of Indian steel, aluminium and cement must buy CBAM certificates priced off the EU carbon market (€82.32/t in Q3)."],
            ["Complication", "Free allocation shrinks from 97.5% to zero by 2034, and unverified goods are charged on India's default values plus a mark-up rising to 30%. The cost lands on exporters through price."],
            ["Question", "How should producers and the Indian state respond to protect EU margins, and in what order?"],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4"><p className="font-semibold mb-1">{k}</p><p className="text-ink-2">{v}</p></div>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-6">
        <Exhibit n={1} title="The bill is modest in 2026 and steepens sharply from 2030, when free allocation drops from 77.5% to 51.5%"
          subtitle="Annual CBAM cost on EU-bound steel, five largest Indian exporters, € million, assuming the cost is fully passed back to the exporter and the certificate price grows 3% a year"
          source="EU Implementing Regs. 2025/2620 and 2025/2621 (as replaced by 2026/1740); Commission Q1–Q3 2026 certificate prices; producer volumes and intensities are grade-D estimates (see Methodology)."
          table={{ columns: ["Year", ...names, "Certificate price €/t"], rows: defaults.map((r) => [r.year, ...names.map((n) => r[n]), r.price]) }}>
          <CliffChart verified={verified} defaults={defaults} names={names} />
        </Exhibit>

        <Panel className="p-5 sm:p-6 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-cond text-4xl font-semibold text-s2i leading-none"><Ticker value={f.defaultPerT} prefix="€" suffix="/t" /></p>
            <p className="text-sm text-ink-2 mt-2 flex gap-1.5"><DirectIcon aria-hidden size={16} className="mt-0.5 shrink-0 text-s2i" />2026 CBAM on a tonne of Indian hot-rolled coil, charged on EU default values</p>
          </div>
          <div>
            <p className="font-cond text-4xl font-semibold text-s1i leading-none"><Ticker value={f.verifiedPerT} prefix="€" suffix="/t" /></p>
            <p className="text-sm text-ink-2 mt-2 flex gap-1.5"><VerifiedIcon aria-hidden size={16} className="mt-0.5 shrink-0 text-s1i" />The same tonne from Tata Steel&apos;s BF-BOF with verified emissions data</p>
          </div>
          <div>
            <p className="font-cond text-4xl font-semibold text-s3i leading-none"><Ticker value={f.verification / 1e6} prefix="€" suffix="m" /></p>
            <p className="text-sm text-ink-2 mt-2 flex gap-1.5"><EuroIcon aria-hidden size={16} className="mt-0.5 shrink-0 text-s3i" />Value of verified data per year to EU buyers of the five largest exporters</p>
          </div>
        </Panel>

        <Exhibit n={2} title={`${reds[0].name} flags red on ${reds[0].n} of ${SCORECARD_RULES.length} risk dimensions; staying on defaults is a material cost for ${allRedPenalty} of ${sc.length} producers`}
          subtitle="Executive scorecard: five largest steel exporters, red / amber / green on exposure, margin, data, route and cliff risk"
          source={<>Model outputs (100% pass-through unless stated, €82.32 growing 3%/yr, law in force). Thresholds: {SCORECARD_RULES.map((r) => `${r.label}: ${r.rule}`).join("; ")}.</>}
          table={{ columns: ["Producer", ...SCORECARD_RULES.map((r) => r.label)], rows: sc.map((r) => [r.p.name, ...SCORECARD_RULES.map((k) => `${r.cells[k.k].level} (${(+r.cells[k.k].v.toFixed(2))})`)]) }}>
          <Scorecard rows={sc} />
        </Exhibit>

        <Exhibit n={3} title={`Five moves cut the 2026–34 bill from ${bn(f.vas.doNothing)} to ${bn(f.vas.residual)}; verification alone does ${share}% of the work`}
          subtitle="Cumulative CBAM paid to the EU 2026–34, € million, steps applied in sequence so nothing is double-counted"
          source="Model outputs; efficiency −0.2 tCO₂/t from 2027, scrap + biochar −0.25 from 2028, Article 9 credit at an explicit €20/t on 60% of exports. Details on the Roadmap page."
          table={{ columns: ["Step", "€ million"], rows: f.vas.steps.map((s) => [s.label, Math.round(s.value / 1e6)]) }}>
          <MiniWaterfall steps={f.vas.steps} />
        </Exhibit>
      </div>

      <section className="mt-14" aria-labelledby="recs">
        <h2 id="recs" className="font-cond text-[1.7rem] font-semibold leading-tight max-w-[40ch]">What we recommend, in order of priority</h2>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line">
          {recs.map((r, i) => (
            <li key={r.title} className="bg-surface p-5 grid gap-4 sm:grid-cols-[48px_1fr_220px] items-start">
              <span className="font-cond text-3xl font-semibold text-ink-3 leading-none">{i + 1}</span>
              <div>
                <h3 className="font-semibold text-lg leading-snug">{r.title}</h3>
                <p className="text-ink-2 mt-1 max-w-[70ch]">{r.body}</p>
                <Link href={r.href} className="text-sm text-s1i underline underline-offset-2 mt-2 inline-block">See the evidence</Link>
              </div>
              <dl className="grid grid-cols-3 sm:grid-cols-1 gap-2 text-sm">
                <div><dt className="text-ink-3 text-xs">Value</dt><dd className="font-medium">{r.value}</dd></div>
                <div><dt className="text-ink-3 text-xs">When</dt><dd>{r.when}</dd></div>
                <div><dt className="text-ink-3 text-xs">Owner</dt><dd>{r.owner}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <Panel className="mt-10 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-[60ch]">
          <h2 className="font-semibold text-lg">How we got here</h2>
          <p className="text-ink-2 mt-1">A 6-week structured problem-solving engagement: one key question, four branches, eight hypotheses tested against a unit-tested model of the regulation.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/approach" className="rounded-md bg-ink text-bg px-4 py-2 font-medium">See the approach</Link>
          <Link href="/model" className="rounded-md border border-line px-4 py-2 hover:border-ink-3">Open the model</Link>
          <a href="/CBAM-India-one-pager.pdf" className="rounded-md border border-line px-4 py-2 hover:border-ink-3">One-page PDF</a>
        </div>
      </Panel>
    </div>
  );
}
