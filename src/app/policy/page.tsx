import type { Metadata } from "next";
import { Landmark, Layers, Ship, TriangleAlert, Users } from "lucide-react";
import { Article9, MsmeCalc, Radar } from "@/components/PolicyLab";
import { PageHeader } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import { KpiStrip } from "@/components/consulting/KpiStrip";
import { Takeaway, Toc } from "@/components/consulting/ApproachParts";
import { LawBadge } from "@/components/visual/indicators";
import { facts } from "@/lib/storyline";
import { clusterExposure, downstreamCostPerUnit, downstreamRows, policyOptions } from "@/lib/policy";
import { PRODUCTS } from "@/lib/data";
import { DEFAULT_SCENARIO as S } from "@/lib/model";
import { cbamFactor, defaultMarkup, priceIn } from "@/lib/cbam";

export const metadata: Metadata = { title: "Policy & MSMEs · CBAM India", description: "Article 9 simulator for India's carbon market, policy options, the downstream CBAM radar, MSME cluster exposure and a per-unit calculator." };

const TOC = [
  { id: "art9", label: "Article 9 simulator" }, { id: "options", label: "Policy options" },
  { id: "downstream", label: "Downstream radar" }, { id: "msme", label: "MSME calculator" },
];

const OPTIONS = {
  none: { I: TriangleAlert, name: "No creditable Indian price", who: "Exporters pay the full CBAM through EU prices", needs: "Nothing", status: "Today", tone: "s2" },
  ccts: { I: Layers, name: "CCTS as designed", who: "Only plants above their intensity target buy credits", needs: "Traded CCC price; EU acceptance of intensity-based credits", status: "Targets notified", tone: "neutral" },
  explicit: { I: Landmark, name: "Explicit price on exported carbon", who: "Every embedded tonne pays in India, then is deducted in the EU", needs: "Levy design, MRV at installation level, EU recognition", status: "Not designed", tone: "s1" },
} as const;

export default function Policy() {
  const f = facts();
  const { m, bn } = f.fmt;
  const opts = policyOptions(20, 0.6);
  const total = opts[0].toEU;
  const cl = clusterExposure(downstreamRows(2026, false)); // in-scope headings only (2026, no extension)
  const y = 2028, P = priceIn(y, S.basePrice, S.growth), F = cbamFactor(y), B = PRODUCTS.steel.benchmarks[0].value;
  const unitD = downstreamCostPerUnit(2.5, 0.9, Math.max(0, PRODUCTS.steel.defaultValue.value * (1 + defaultMarkup(y)) - F * B), P);
  const unitV = downstreamCostPerUnit(2.5, 0.9, Math.max(0, 2.4 - F * B), P);
  const best = opts.find((o) => o.id === "explicit")!, ccts = opts.find((o) => o.id === "ccts")!;

  return (
    <div>
      <PageHeader title={`An explicit Indian carbon price could keep ${bn(f.polExplicit)} of CBAM at home; CCTS as designed keeps ${m(f.polCcts)}, and MSMEs are already exposed`}
        lede="Tools for government and industry bodies: how much CBAM revenue India could retain through its own carbon price, which policy design does it, which engineering exports and clusters CBAM touches, and what it costs a small exporter per unit." />
      <KpiStrip items={[
        { icon: Landmark, value: bn(f.polExplicit), label: "kept in India 2026–34 with an explicit €20/t price", tone: "s1" },
        { icon: Layers, value: m(f.polCcts), label: "kept under CCTS as designed (same price)", tone: "ink" },
        { icon: Ship, value: `$${f.dsIn.toFixed(1)}bn`, label: `of EU engineering imports from India already in CBAM; $${f.dsProp.toFixed(1)}bn more proposed`, tone: "s2" },
        { icon: Users, value: `€${unitD.toFixed(2)}`, label: `CBAM per 2.5 kg steel part on defaults in 2028 (€${unitV.toFixed(2)} verified)`, tone: "s3" },
      ]} />

      <div className="mt-8 xl:grid xl:grid-cols-[1fr_200px] xl:gap-10">
        <div className="grid gap-6 min-w-0">
          <section id="art9" className="grid gap-4 scroll-mt-20">
            <Takeaway>The design of India&apos;s carbon price matters more than its level: only a price paid on every exported tonne turns CBAM into Indian revenue.</Takeaway>
            <Article9 />
          </section>

          <section id="options" className="grid gap-4 scroll-mt-20">
            <Exhibit n={2} title={`Three designs, one bill: an explicit price keeps ${Math.round((best.kept / total) * 100)}% of the ${bn(total)} steel bill in India, CCTS as designed keeps ${Math.round((ccts.kept / total) * 100)}%`}
              subtitle="Indian steel's 2026–34 CBAM bill split between India and the EU under three policy designs, at €20/tCO₂ and 60% of exports with EU-accepted evidence"
              source="Article 9 simulator above (same assumptions); CCTS target 5% below current intensity. Requirements and status are analyst assessment as of Oct 2026."
              table={{ columns: ["Design", "Kept in India € m", "Paid to EU € m", "Status"], rows: opts.map((o) => [OPTIONS[o.id as keyof typeof OPTIONS].name, Math.round(o.kept / 1e6), Math.round(o.toEU / 1e6), OPTIONS[o.id as keyof typeof OPTIONS].status]) }}>
              <ul className="grid gap-3 md:grid-cols-3">
                {opts.map((o) => {
                  const d = OPTIONS[o.id as keyof typeof OPTIONS];
                  const share = o.kept / total;
                  return (
                    <li key={o.id} className={`rounded-lg border p-4 flex flex-col gap-3 ${o.id === "explicit" ? "border-s1" : "border-line"}`}>
                      <p className="flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sunken" style={{ color: `var(--${d.tone === "neutral" ? "ink-2" : d.tone + "i"})` }}><d.I aria-hidden size={17} /></span>{d.name}</p>
                      <div>
                        <p className="font-cond text-3xl font-semibold tabular-nums leading-none">{m(o.kept)}</p>
                        <p className="text-xs text-ink-3 mt-1">kept in India ({Math.round(share * 100)}% of the bill)</p>
                        <div className="mt-2 flex h-2.5 rounded-full overflow-hidden bg-s2" role="img" aria-label={`${Math.round(share * 100)}% kept in India, ${Math.round((1 - share) * 100)}% paid to the EU`}>
                          <span className="bg-s1" style={{ width: `${share * 100}%` }} />
                        </div>
                      </div>
                      <dl className="text-sm space-y-1.5">
                        <div><dt className="text-xs text-ink-3">Who pays</dt><dd>{d.who}</dd></div>
                        <div><dt className="text-xs text-ink-3">Needs</dt><dd>{d.needs}</dd></div>
                      </dl>
                      <p className="mt-auto text-xs inline-flex items-center gap-2"><span className="text-ink-3">Status:</span><span className="rounded-md border border-line px-1.5 py-0.5">{d.status}</span>{o.id !== "none" && <LawBadge status="proposal" />}</p>
                    </li>
                  );
                })}
              </ul>
            </Exhibit>
          </section>

          <section id="downstream" className="grid gap-4 scroll-mt-20">
            <Takeaway>{`CBAM is not only a steel-mill problem: fasteners, tubes and structures from ${cl.slice(0, 3).map((c) => c.cluster).join(", ")} are already in scope today, and vehicle parts and machinery follow if the 2028 proposal passes.`}</Takeaway>
            <Radar />
          </section>

          <section id="msme" className="grid gap-4 scroll-mt-20">
            <MsmeCalc />
          </section>
        </div>
        <Toc items={TOC} />
      </div>
    </div>
  );
}
