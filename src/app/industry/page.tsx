import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import { ExposureMatrix, Flows, Footprint, GapChart, RouteMix, Spark } from "@/components/pages/IndustryCharts";
import { EU_STEEL_BY_CN, EU_STEEL_TOTAL_KT, PRODUCERS, benchmarkFor } from "@/lib/data";
import { DEFAULT_SCENARIO as S, producerCost, producerSummary, trajectory } from "@/lib/model";
import { cbamFactor } from "@/lib/cbam";

export const metadata: Metadata = { title: "Industry & players", description: "Who is exposed to EU CBAM among Indian steel, aluminium and cement producers, and why." };

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-IN")}`;

export default function Industry() {
  const full = { ...S, passThrough: 1 };
  const steel = PRODUCERS.filter((p) => p.sector === "steel");
  const rows = steel.map((p) => ({ p, r: producerSummary(p, full), t: trajectory(p, full), c2030: producerCost(p, full, "actual", { year: 2030 }).net }));

  // Sankey: producers (estimated) → EU border → CN headings (Eurostat).
  const others = EU_STEEL_TOTAL_KT - steel.reduce((a, p) => a + p.euVolume.value * 1000, 0);
  const left = [...steel.map((p) => ({ name: p.name, kt: p.euVolume.value * 1000 })), { name: "Other Indian mills", kt: others }];
  const nodes = [...left.map((l) => ({ name: l.name, color: "var(--ink-2)" })), { name: "EU border (CBAM)", color: "var(--s2)" }, ...EU_STEEL_BY_CN.map((c) => ({ name: c.cn, color: "var(--s1)" }))];
  const hub = left.length;
  const links = [...left.map((l, i) => ({ source: i, target: hub, value: l.kt })), ...EU_STEEL_BY_CN.map((c, i) => ({ source: hub, target: hub + 1 + i, value: c.kt }))];

  const points = rows.map(({ p, c2030 }) => ({ name: p.name, x: c2030, y: p.ebitdaEUR.value, z: p.euVolume.value, tone: (c2030 > 150 ? "s2" : "s1") as "s1" | "s2" }));
  const xMid = 150, yMid = 100;
  const danger = points.filter((q) => q.x > xMid && q.y < yMid).map((q) => q.name);
  const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

  const mix = steel.map((p) => ({ name: p.name, "BF-BOF": p.routeShares[0], "DRI-EAF": p.routeShares[1] }));
  const gap = steel.map((p) => {
    const b = benchmarkFor(p), e = p.actualDirect.value;
    const f26 = cbamFactor(2026) * b, f30 = cbamFactor(2030) * b;
    return { name: p.name, covered2026: +Math.min(e, f26).toFixed(2), gap2026: +Math.max(0, e - f26).toFixed(2), covered2030: +Math.min(e, f30).toFixed(2), gap2030: +Math.max(0, e - f30).toFixed(2) };
  });
  const foot = PRODUCERS.filter((p) => p.sector !== "steel").map((p) => ({
    name: p.name, charged: p.sector === "cement" ? p.actualDirect.value + p.indirect.value : p.actualDirect.value, uncharged: p.sector === "cement" ? 0 : p.indirect.value,
  }));
  const al = foot.filter((x) => x.uncharged > 1);
  const alShare = al.reduce((a, x) => a + x.charged / (x.charged + x.uncharged), 0) / al.length;

  return (
    <div>
      <PageHeader step="diagnosis" title="Exposure is concentrated in five steelmakers, and the route they use matters as much as how much they emit"
        lede="India sent about 4.0 Mt of CBAM-covered steel to the EU in 2025. This page shows who ships it, where each producer sits on exposure versus ability to absorb, and why coal-DRI mills get the least free allocation." />

      <div className="grid gap-6">
        <Exhibit n={1} title="Five producers ship about 90% of India's CBAM steel to the EU; coated and hot-rolled flat products dominate"
          subtitle="EU imports of CBAM iron and steel from India, 2025, kt: producer split (left) is estimated, product split (right) is Eurostat"
          source="Eurostat Comext DS-045409 via cbamguide.com (product split, grade C); producer volumes from ARE (Sep 2026) and analyst estimates (grade D)."
          table={{ columns: ["Flow", "kt"], rows: [...left.map((l) => [l.name, Math.round(l.kt)]), ...EU_STEEL_BY_CN.map((c) => [c.cn, c.kt])] }}>
          <Flows nodes={nodes} links={links} />
        </Exhibit>

        <Exhibit n={2} title={`${list(danger)} ${danger.length === 1 ? "sits" : "sit"} in the danger quadrant: high 2030 cost per tonne and the thinnest margin to absorb it`}
          subtitle="2030 verified CBAM cost per tonne (100% pass-through) against EBITDA per tonne; bubble size = EU volume"
          source="Model at €82.32 growing 3%/yr, law-in-force phase-out. EBITDA: JSW and SAIL FY26 results (grade C); others estimated (grade D)."
          table={{ columns: ["Producer", "2030 €/t", "EBITDA €/t", "EU Mt"], rows: points.map((p) => [p.name, Math.round(p.x), p.y, p.z]) }}>
          <ExposureMatrix points={points} xMid={xMid} yMid={yMid} />
        </Exhibit>

        <div className="grid gap-6 lg:grid-cols-2">
          <Exhibit n={3} title="Mixed-route producers carry DRI capacity that earns only the 0.481 t benchmark"
            subtitle="Share of output by route (estimated)" source="Company reports; analyst estimates (grade D)."
            table={{ columns: ["Producer", "BF-BOF", "DRI-EAF"], rows: mix.map((x) => [x.name, x["BF-BOF"], x["DRI-EAF"]]) }}>
            <RouteMix data={mix} />
          </Exhibit>
          <Panel className="p-5 sm:p-6">
            <h3 className="font-cond text-xl font-semibold leading-snug">Why route matters</h3>
            <p className="text-ink-2 mt-2">Free allocation is the CBAM factor times the benchmark of the production route. For hot-rolled flat steel the BF-BOF benchmark is 1.370 t, but DRI-EAF is 0.481 t and scrap-EAF is 0.072 t.</p>
            <p className="text-ink-2 mt-2">A coal-based DRI plant emitting as much as a blast furnace therefore pays on almost all of its emissions from day one. The EU rewards gas-DRI and scrap-EAF for being clean, not coal-DRI for being DRI.</p>
            <p className="text-ink-2 mt-2">This is why JSPL and AM/NS, not the largest exporter, carry the steepest cost per tonne.</p>
          </Panel>
        </div>

        <Exhibit n={4} title="By 2030 every producer pays on more than half of its emissions; the charged slice roughly doubles in four years"
          subtitle="Verified direct tCO₂ per tonne split into the part covered by free allocation and the part charged"
          source="Implementing Reg. 2025/2620 benchmarks; CBAM factor 97.5% (2026), 51.5% (2030); intensities grade D."
          table={{ columns: ["Producer", "Covered 2026", "Charged 2026", "Covered 2030", "Charged 2030"], rows: gap.map((g) => [g.name, g.covered2026, g.gap2026, g.covered2030, g.gap2030]) }}>
          <GapChart data={gap} />
        </Exhibit>

        <section aria-labelledby="players">
          <h2 id="players" className="font-cond text-xl font-semibold mb-3">Player profiles</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {rows.map(({ p, r, t }) => (
              <li key={p.id} className="rounded-[10px] border border-line bg-surface p-4">
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-ink-3 mt-0.5 min-h-8">{p.route}</p>
                <Spark data={t} />
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm mt-2">
                  <dt className="text-ink-3">2026</dt><dd className="text-right">{eur(r.act.net)}/t</dd>
                  <dt className="text-ink-3">2034</dt><dd className="text-right">{eur(t[8].actual)}/t</dd>
                  <dt className="text-ink-3">EU volume</dt><dd className="text-right">{p.euVolume.value} Mt</dd>
                  <dt className="text-ink-3">On defaults</dt><dd className="text-right text-s2">{eur(r.def.net)}/t</dd>
                </dl>
                <p className="text-xs text-ink-2 mt-3">{p.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <Exhibit n={5} title={`Aluminium's real footprint is about 16 t CO₂ per tonne, but CBAM prices only ~${Math.round(alShare * 100)}% of it today; cement is charged in full`}
          subtitle="tCO₂ per tonne of product: charged by CBAM today vs electricity emissions outside the charge"
          source="Steel and aluminium are Annex II goods (direct emissions only); cement includes indirect. Intensities grade D (IAI ranges, BRSR on an OPC basis)."
          table={{ columns: ["Producer", "Charged", "Not charged"], rows: foot.map((x) => [x.name, x.charged, x.uncharged]) }}>
          <Footprint data={foot} />
          <p className="text-sm text-ink-2 mt-3">If the EU adds indirect emissions for aluminium, Indian smelters on captive coal would face roughly €1,200/t: most or all of a record FY26 margin of €1,100–1,500/t. Test it in the <Link href="/model?sector=aluminium&p=vedanta&indirect=1" className="text-s1 underline underline-offset-2">model</Link>.</p>
        </Exhibit>
      </div>
    </div>
  );
}
