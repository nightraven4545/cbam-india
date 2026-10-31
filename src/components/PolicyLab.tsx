"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DOWNSTREAM, PRODUCTS, type Sector } from "@/lib/data";
import { DEFAULT_SCENARIO } from "@/lib/model";
import { article9, downstreamCostPerUnit, type Mechanism } from "@/lib/policy";
import { cbamFactor, defaultMarkup, priceIn } from "@/lib/cbam";
import { AXIS, Card, Slider, TIP, eur, m, pct } from "./ui";
import { SankeyChart, TreemapChart } from "./consulting/charts";
import { PageHeader } from "./consulting/core";

const S = DEFAULT_SCENARIO;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-IN")}m`;

function Article9() {
  const [sector, setSector] = useState<Sector>("steel");
  const [price, setPrice] = useState(20);
  const [mechanism, setMech] = useState<Mechanism>("explicit");
  const [targetCut, setCut] = useState(0.05);
  const [qualifying, setQ] = useState(0.6);
  const rows = useMemo(() => article9(S, sector, { price, mechanism, targetCut, qualifying }), [sector, price, mechanism, targetCut, qualifying]);
  const toEU = rows.reduce((a, r) => a + r.toEU, 0), kept = rows.reduce((a, r) => a + r.retained, 0);
  const data = rows.map((r) => ({ year: r.year, "Paid to EU budget": Math.round(r.toEU / 1e6), "Retained in India": Math.round(r.retained / 1e6) }));
  return (
    <Card title="Article 9 simulator: can India keep the CBAM money at home?"
      sub="CBAM lets the EU importer deduct a carbon price effectively paid in the country of origin. The model scales modelled producers to India's whole EU export volume (Eurostat 2025) and uses verified intensities, at the scenario price path.">
      <div className="grid gap-4 md:grid-cols-2 mb-4 text-sm">
        <div className="space-y-3">
          <label className="block"><span className="text-ink-2">Sector</span>
            <select className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5" value={sector} onChange={(e) => setSector(e.target.value as Sector)}>
              <option value="steel">Steel</option><option value="aluminium">Aluminium</option>
            </select>
          </label>
          <fieldset><legend className="text-ink-2 mb-1">Design of the Indian carbon price</legend>
            <label className="block"><input type="radio" name="mech" checked={mechanism === "explicit"} onChange={() => setMech("explicit")} /> Explicit carbon price on every embedded tonne (export levy or carbon tax)</label>
            <label className="block"><input type="radio" name="mech" checked={mechanism === "ccts"} onChange={() => setMech("ccts")} /> CCTS as designed: only tonnes above the intensity target pay</label>
          </fieldset>
        </div>
        <div className="space-y-3">
          <Slider label={mechanism === "ccts" ? "CCC price (€/tCO₂)" : "Carbon price (€/tCO₂)"} value={price} min={0} max={80} step={1} fmt={(v) => eur(v)} onChange={setPrice} />
          {mechanism === "ccts" && <Slider label="CCTS target below current intensity" value={targetCut} min={0} max={0.2} step={0.01} fmt={pct} onChange={setCut} />}
          <Slider label="Exports with EU-accepted evidence" value={qualifying} min={0} max={1} step={0.05} fmt={pct} onChange={setQ} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <div className="rounded-lg border border-line p-3"><p className="text-xs text-ink-3">Retained in India, 2026–34</p><p className="text-2xl font-semibold">{m(kept)}</p></div>
        <div className="rounded-lg border border-line p-3"><p className="text-xs text-ink-3">Still paid to the EU, 2026–34</p><p className="text-2xl font-semibold">{m(toEU)}</p></div>
      </div>
      <p className="text-sm font-medium mb-1">Where the 2026–34 CBAM bill goes, € million</p>
      <SankeyChart height={220} fmt={(v) => `€${Math.round(v).toLocaleString("en-IN")}m`}
        nodes={[{ name: "CBAM bill on Indian " + sector, color: "var(--ink-2)" }, { name: "Paid to EU budget", color: "var(--s2)" }, { name: "Paid in India (Art. 9)", color: "var(--s1)" }]}
        links={[{ source: 0, target: 1, value: Math.max(1, toEU / 1e6) }, { source: 0, target: 2, value: Math.max(1, kept / 1e6) }]} />
      <p className="text-sm font-medium mt-4 mb-1">By year</p>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="year" tick={AXIS} tickLine={false} />
            <YAxis tick={AXIS} tickFormatter={(v) => `€${v}m`} tickLine={false} axisLine={false} />
            <Tooltip {...TIP} formatter={(v: number) => `€${v}m`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Retained in India" stackId="a" fill="var(--s1)" isAnimationActive={false} />
            <Bar dataKey="Paid to EU budget" stackId="a" fill="var(--s2)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-ink-3 mt-2">The EU has not yet recognised any third-country carbon price under Article 9 (as of Oct 2026). An intensity-based CCTS creates an &quot;effectively paid&quot; price only on the slice above the target, so the design choice matters more than the price level.</p>
    </Card>
  );
}

function Radar() {
  const [year, setYear] = useState(2028);
  const [adopted, setAdopted] = useState(true);
  const P = priceIn(year, S.basePrice, S.growth), F = cbamFactor(year);
  const certs = (metal: "steel" | "aluminium", mode: "v" | "d") => {
    const b = PRODUCTS[metal].benchmarks[0].value;
    const e = mode === "v" ? (metal === "steel" ? 2.2 : 1.8) : PRODUCTS[metal].defaultValue.value * (1 + defaultMarkup(year));
    return Math.max(0, e - F * b);
  };
  const rows = DOWNSTREAM.map((d) => {
    const live = d.status === "inScope" || (adopted && year >= 2028);
    const t = d.kt * 1e3 * d.metalShare;
    const v = live ? t * certs(d.metal, "v") * P : 0, df = live ? t * certs(d.metal, "d") * P : 0;
    return { ...d, live, v, df, pctValue: d.usdM ? (df / 1.08) / (d.usdM * 1e6) : 0 };
  }).sort((a, b) => b.usdM - a.usdM);
  const tot = (k: "v" | "df", st?: string) => rows.filter((r) => !st || r.status === st).reduce((a, r) => a + r[k], 0);
  return (
    <Card title="Downstream radar: Indian engineering exports caught by CBAM"
      sub="EU imports from India in 2024 (UN Comtrade, EU-27 reporter). Several MSME-heavy headings (fasteners, tubes, structures) are already in scope today; the 2028 proposal adds machinery and vehicle parts. Annual CBAM cost on metal content, before pass-through.">
      <div className="flex flex-wrap gap-6 items-end mb-4 text-sm">
        <div className="w-56"><Slider label="Year" value={year} min={2026} max={2034} step={1} fmt={String} onChange={setYear} /></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={adopted} onChange={(e) => setAdopted(e.target.checked)} /> Assume the downstream extension is adopted from 2028 (proposal, not law)</label>
      </div>
      <p className="text-sm font-medium mb-1">EU imports from India 2024 by heading, US$ million: blue = already in CBAM, orange = proposed for 2028</p>
      <TreemapChart height={340} fmt={(v) => `$${Math.round(v).toLocaleString("en-IN")}m`}
        items={[...DOWNSTREAM].sort((a, b) => b.usdM - a.usdM).map((d) => ({ name: `${d.hs} ${d.product.split(" (")[0].split(",")[0]}`, size: d.usdM, color: d.status === "inScope" ? "#2a78d6" : "#e8590c", sub: d.status === "inScope" ? "in scope" : "2028" }))} />
      <div tabIndex={0} className="overflow-x-auto mt-5">
        <table className="w-full text-sm">
          <thead className="text-left text-ink-3"><tr>{["HS", "Product", "EU imports 2024", "kt", "Status", "MSME cluster", "CBAM/yr verified", "CBAM/yr on defaults", "% of value (defaults)"].map((h) => <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hs} className="border-t border-line">
                <td className="py-2 pr-3">{r.hs}</td><td className="pr-3">{r.product}</td><td className="pr-3">{usd(r.usdM)}</td><td className="pr-3">{r.kt.toFixed(1)}</td>
                <td className="pr-3 whitespace-nowrap"><span className={`text-[10px] uppercase rounded px-1 border ${r.status === "inScope" ? "border-s1 text-s1i" : "border-s2 text-s2i"}`}>{r.status === "inScope" ? "in scope now" : "proposed 2028"}</span></td>
                <td className="pr-3 text-ink-2">{r.cluster}</td><td className="pr-3">{r.live ? m(r.v) : "–"}</td><td className="pr-3">{r.live ? m(r.df) : "–"}</td><td className="pr-3">{r.live ? pct(r.pctValue) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm mt-3">
        {year}: headings already in scope cost <strong>{m(tot("v", "inScope"))}</strong> a year verified and <strong>{m(tot("df", "inScope"))}</strong> on defaults. The proposed 2028 headings would add {m(tot("v", "proposed"))} or {m(tot("df", "proposed"))}.
      </p>
      <p className="text-xs text-ink-3 mt-1">Metal shares and verified intensities (steel 2.2, Al 1.8) are grade-D assumptions. The proposal covers only some 8-digit lines within 8708, 8483, 8481 and 8431, so these headings overstate coverage. USD→EUR at 1.08.</p>
    </Card>
  );
}

function MsmeCalc() {
  const [weight, setWeight] = useState(2.5);
  const [share, setShare] = useState(0.9);
  const [unitPrice, setUnitPrice] = useState(12);
  const [intensity, setInt] = useState(2.4);
  const [year, setYear] = useState(2028);
  const P = priceIn(year, S.basePrice, S.growth), F = cbamFactor(year), B = PRODUCTS.steel.benchmarks[0].value;
  const certsV = Math.max(0, intensity - F * B), certsD = Math.max(0, PRODUCTS.steel.defaultValue.value * (1 + defaultMarkup(year)) - F * B);
  const v = downstreamCostPerUnit(weight, share, certsV, P), d = downstreamCostPerUnit(weight, share, certsD, P);
  return (
    <Card title="MSME calculator: CBAM per unit for a steel component" sub="For a Ludhiana fastener maker or a Rajkot casting shop: the steel content priced at the intensity of the steel you buy (ask your mill for its CBAM data) vs India's default.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Slider label="Unit weight (kg)" value={weight} min={0.1} max={50} step={0.1} fmt={(x) => x.toFixed(1)} onChange={setWeight} />
        <Slider label="Steel share of weight" value={share} min={0.1} max={1} step={0.05} fmt={pct} onChange={setShare} />
        <Slider label="Export price per unit (€)" value={unitPrice} min={1} max={500} step={1} fmt={(x) => eur(x)} onChange={setUnitPrice} />
        <Slider label="Supplier steel intensity (tCO₂/t)" value={intensity} min={0.3} max={4} step={0.05} fmt={(x) => x.toFixed(2)} onChange={setInt} />
        <Slider label="Year" value={year} min={2026} max={2034} step={1} fmt={String} onChange={setYear} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <div className="rounded-lg border border-line p-3"><p className="text-xs text-ink-3">With supplier&apos;s verified data</p><p className="text-2xl font-semibold">{eur(v, 2)} / unit</p><p className="text-xs text-ink-2">{pct(v / unitPrice)} of the export price</p></div>
        <div className="rounded-lg border border-line p-3"><p className="text-xs text-ink-3">On India&apos;s default value</p><p className="text-2xl font-semibold">{eur(d, 2)} / unit</p><p className="text-xs text-ink-2">{pct(d / unitPrice)} of the export price</p></div>
      </div>
      <p className="text-xs text-ink-3 mt-2">The free-allocation benchmark is the BF-BOF HR value as a proxy. Downstream benchmarks will be set per good if the extension is adopted.</p>
    </Card>
  );
}

export default function PolicyLab() {
  return (
    <div className="space-y-6">
      <PageHeader title="An explicit Indian carbon price could keep about €1bn of CBAM at home; CCTS as designed keeps almost none, and MSMEs are already exposed"
        lede="Three tools for government and industry bodies: how much CBAM revenue India could retain through its own carbon price, which engineering exports CBAM already touches or will touch from 2028, and what it costs a small exporter per unit." />
      <Article9 />
      <Radar />
      <MsmeCalc />
    </div>
  );
}
