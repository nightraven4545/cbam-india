"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Euro, Flame, Landmark, Layers, Lock, Package, ShieldCheck, TriangleAlert, Users, Weight, type LucideIcon } from "lucide-react";
import { DEFAULT_SCENARIO } from "@/lib/model";
import { PRODUCTS, type Sector } from "@/lib/data";
import { article9, clusterExposure, downstreamCostPerUnit, downstreamRows, type Mechanism } from "@/lib/policy";
import { cbamFactor, defaultMarkup, priceIn } from "@/lib/cbam";
import { AXIS, Slider, TIP, eur, m, pct } from "./ui";
import { SankeyChart, TreemapChart } from "./consulting/charts";
import { Exhibit } from "./consulting/Exhibit";
import { Takeaway } from "./consulting/ApproachParts";
import { Flag, LawBadge } from "./visual/indicators";

const S = DEFAULT_SCENARIO;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-IN")}m`;

function Tile({ I, label, value, tone, children }: { I: LucideIcon | React.FC; label: string; value: string; tone: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line p-3 flex gap-3 items-start">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sunken" style={{ color: `var(--${tone}i)` }}><I aria-hidden size={18} /></span>
      <div><p className="text-xs text-ink-3">{label}</p><p className="font-cond text-2xl font-semibold tabular-nums" style={{ color: `var(--${tone}i)` }}>{value}</p>{children}</div>
    </div>
  );
}
const EuFlag = () => <Flag code="EU" size={14} />;

export function Article9() {
  const [sector, setSector] = useState<Sector>("steel");
  const [price, setPrice] = useState(20);
  const [mechanism, setMech] = useState<Mechanism>("explicit");
  const [targetCut, setCut] = useState(0.05);
  const [qualifying, setQ] = useState(0.6);
  const rows = useMemo(() => article9(S, sector, { price, mechanism, targetCut, qualifying }), [sector, price, mechanism, targetCut, qualifying]);
  const toEU = rows.reduce((a, r) => a + r.toEU, 0), kept = rows.reduce((a, r) => a + r.retained, 0);
  const share = kept / (kept + toEU || 1);
  const data = rows.map((r) => ({ year: r.year, "Retained in India": Math.round(r.retained / 1e6), "Paid to EU budget": Math.round(r.toEU / 1e6) }));
  const title = mechanism === "explicit"
    ? `At ${eur(price)}/t on every embedded tonne, India keeps ${m(kept)} (${Math.round(share * 100)}%) of the 2026–34 ${sector} CBAM bill at home`
    : `Under CCTS as designed, only the slice above target pays, so India keeps just ${m(kept)} (${Math.round(share * 100)}%) of the 2026–34 ${sector} bill`;
  return (
    <Exhibit n={1} title={title}
      subtitle="Article 9 simulator: the EU importer can deduct a carbon price effectively paid in India. Modelled producers are scaled to India's whole EU export volume (Eurostat 2025), with verified intensities on the base price path."
      source="Regulation (EU) 2023/956 Art. 9; model at €82.32 growing 3%/yr. The EU has not yet recognised any third-country carbon price under Article 9 (Oct 2026)."
      table={{ columns: ["Year", "Retained in India € m", "Paid to EU € m"], rows: data.map((d) => [d.year, d["Retained in India"], d["Paid to EU budget"]]) }}
      controls={
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="space-y-3">
            <label className="block"><span className="text-ink-2">Sector</span>
              <select className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5" value={sector} onChange={(e) => setSector(e.target.value as Sector)}>
                <option value="steel">Steel</option><option value="aluminium">Aluminium</option>
              </select>
            </label>
            <fieldset><legend className="text-ink-2 mb-1">Design of the Indian carbon price</legend>
              <label className="flex items-start gap-2"><input type="radio" className="mt-1" name="mech" checked={mechanism === "explicit"} onChange={() => setMech("explicit")} /><Landmark aria-hidden size={15} className="mt-0.5 text-s1i shrink-0" />Explicit price on every embedded tonne (export levy or carbon tax)</label>
              <label className="flex items-start gap-2 mt-1"><input type="radio" className="mt-1" name="mech" checked={mechanism === "ccts"} onChange={() => setMech("ccts")} /><Layers aria-hidden size={15} className="mt-0.5 text-ink-2 shrink-0" />CCTS as designed: only tonnes above the intensity target pay</label>
            </fieldset>
          </div>
          <div className="space-y-3">
            <Slider label={mechanism === "ccts" ? "CCC price (€/tCO₂)" : "Carbon price (€/tCO₂)"} value={price} min={0} max={80} step={1} fmt={(v) => eur(v)} onChange={setPrice} />
            {mechanism === "ccts" && <Slider label="CCTS target below current intensity" value={targetCut} min={0} max={0.2} step={0.01} fmt={pct} onChange={setCut} />}
            <Slider label="Exports with EU-accepted evidence" value={qualifying} min={0} max={1} step={0.05} fmt={pct} onChange={setQ} />
          </div>
        </div>
      }>
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <Tile I={Landmark} label="Retained in India, 2026–34" value={m(kept)} tone="s1" />
        <Tile I={EuFlag} label="Still paid to the EU budget, 2026–34" value={m(toEU)} tone="s2" />
      </div>
      <p className="text-sm font-medium mb-1">Where the 2026–34 CBAM bill goes, € million</p>
      <SankeyChart height={200} fmt={(v) => `€${Math.round(v).toLocaleString("en-IN")}m`}
        nodes={[{ name: `CBAM bill on Indian ${sector}`, color: "var(--ink-2)" }, { name: "Paid to EU budget", color: "var(--s2)" }, { name: "Paid in India (Art. 9)", color: "var(--s1)" }]}
        links={[{ source: 0, target: 1, value: Math.max(1, toEU / 1e6) }, { source: 0, target: 2, value: Math.max(1, kept / 1e6) }]} />
      <p className="text-sm font-medium mt-4 mb-1">By year, € million</p>
      <div className="h-60">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="year" tick={AXIS} tickLine={false} />
            <YAxis tick={AXIS} tickFormatter={(v) => `€${v}m`} tickLine={false} axisLine={false} />
            <Tooltip {...TIP} formatter={(v: number) => `€${v}m`} />
            <Bar dataKey="Retained in India" stackId="a" fill="var(--s1)" isAnimationActive={false} />
            <Bar dataKey="Paid to EU budget" stackId="a" fill="var(--s2)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-4 text-xs text-ink-2 mt-1" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5"><Flag code="IN" size={11} /><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm bg-s1" />Retained in India</li>
        <li className="inline-flex items-center gap-1.5"><Flag code="EU" size={11} /><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm bg-s2" />Paid to the EU budget</li>
      </ul>
    </Exhibit>
  );
}

export function Radar() {
  const [year, setYear] = useState(2028);
  const [adopted, setAdopted] = useState(true);
  const rows = useMemo(() => downstreamRows(year, adopted), [year, adopted]);
  const clusters = useMemo(() => clusterExposure(rows).slice(0, 10), [rows]);
  const tot = (k: "v" | "df", st?: string) => rows.filter((r) => !st || r.status === st).reduce((a, r) => a + r[k], 0);
  const maxPct = Math.max(...rows.map((r) => r.pctValue), 0.01);
  const maxCl = Math.max(...clusters.map((c) => c.inScope + c.proposed), 1);
  const controls = (
    <div className="flex flex-wrap gap-6 items-end text-sm">
      <div className="w-56"><Slider label="Year" value={year} min={2026} max={2034} step={1} fmt={String} onChange={setYear} /></div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={adopted} onChange={(e) => setAdopted(e.target.checked)} /> Assume the downstream extension is adopted from 2028 <LawBadge status="proposal" /></label>
    </div>
  );
  return (
    <>
      <Exhibit n={3} title={`In ${year}, engineering goods already in CBAM cost ${m(tot("df", "inScope"))} a year on defaults (${m(tot("v", "inScope"))} verified)${adopted && year >= 2028 ? `; the 2028 proposal would add ${m(tot("df", "proposed"))}` : ""}`}
        subtitle="Downstream radar: EU imports from India in 2024 by heading (UN Comtrade, EU-27 reporter), with annual CBAM cost on metal content, before pass-through"
        source="UN Comtrade 2024 (grade C). Metal shares and verified intensities (steel 2.2, Al 1.8) are grade-D assumptions. The proposal covers only some 8-digit lines within 8708, 8483, 8481 and 8431, so these headings overstate coverage. USD→EUR at 1.08."
        table={{ columns: ["HS", "Product", "EU imports $m", "Status", "Cluster", "CBAM/yr verified €", "CBAM/yr defaults €", "% of value"], rows: rows.map((r) => [r.hs, r.product, Math.round(r.usdM), r.status === "inScope" ? "In scope (law)" : "Proposed 2028", r.cluster, Math.round(r.v), Math.round(r.df), `${(r.pctValue * 100).toFixed(1)}%`]) }}
        controls={controls}>
        <ul className="flex flex-wrap gap-4 text-xs text-ink-2 mb-2" aria-label="Legend">
          <li className="inline-flex items-center gap-1.5"><Lock aria-hidden size={13} className="text-s1i" /><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm bg-s1" />Already in CBAM (law)</li>
          <li className="inline-flex items-center gap-1.5"><Clock aria-hidden size={13} className="text-s2i" /><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm bg-s2" />Proposed for 2028</li>
          <li>Box size = EU imports from India, 2024, US$</li>
        </ul>
        <TreemapChart height={320} fmt={(v) => `$${Math.round(v).toLocaleString("en-IN")}m`}
          items={rows.map((d) => ({ name: `${d.hs} ${d.product.split(" (")[0].split(",")[0]}`, size: d.usdM, color: d.status === "inScope" ? "#2a78d6" : "#e8590c", sub: d.status === "inScope" ? "in scope" : "2028" }))} />
        <div tabIndex={0} role="region" aria-label="Downstream headings" className="relative overflow-x-auto mt-5">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="text-left text-xs text-ink-3"><tr>{["HS", "Product", "EU imports 2024", "Status", "MSME cluster", "CBAM/yr verified", "on defaults", "Share of export value (defaults)"].map((h) => <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.hs} className="border-t border-line">
                  <td className="py-2 pr-3 tabular-nums">{r.hs}</td><td className="pr-3">{r.product}</td><td className="pr-3 tabular-nums">{usd(r.usdM)}</td>
                  <td className="pr-3 whitespace-nowrap">{r.status === "inScope" ? <span className="inline-flex items-center gap-1 text-xs text-s1i"><Lock aria-hidden size={12} />In scope</span> : <span className="inline-flex items-center gap-1 text-xs text-s2i"><Clock aria-hidden size={12} />2028 proposal</span>}</td>
                  <td className="pr-3 text-ink-2">{r.cluster}</td>
                  <td className="pr-3 tabular-nums">{r.live ? m(r.v) : "–"}</td><td className="pr-3 tabular-nums">{r.live ? m(r.df) : "–"}</td>
                  <td className="pr-3">{r.live ? <span className="flex items-center gap-2"><span className="h-2 rounded-sm bg-s2" style={{ width: `${(r.pctValue / maxPct) * 80}px` }} aria-hidden /><span className="tabular-nums">{pct(r.pctValue)}</span></span> : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Exhibit>

      <Takeaway>{`${clusters[0]?.cluster} and ${clusters[1]?.cluster} carry the most CBAM on defaults in ${year}: cluster help-desks and mill-to-MSME data sharing should start there.`}</Takeaway>
      <Exhibit n={4} title={`${clusters.slice(0, 3).map((c) => c.cluster).join(", ")} are the most exposed engineering hubs in ${year}`}
        subtitle="Annual CBAM on India's default values by engineering hub (MSME clusters and states as listed in the trade data), € million; each heading's cost is split equally across the hubs it lists"
        source="Downstream radar above; cluster attribution is an analyst mapping of HS headings to known MSME clusters (grade D)."
        table={{ columns: ["Cluster", "In scope € m", "Proposed € m", "Headings"], rows: clusters.map((c) => [c.cluster, +(c.inScope / 1e6).toFixed(1), +(c.proposed / 1e6).toFixed(1), c.headings.join(", ")]) }}>
        <ul className="space-y-2">
          {clusters.map((c) => (
            <li key={c.cluster} className="grid grid-cols-[150px_1fr_80px] sm:grid-cols-[180px_1fr_90px] items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5"><Users aria-hidden size={14} className="text-s3i shrink-0" />{c.cluster}</span>
              <span className="flex h-5 rounded overflow-hidden bg-sunken" role="img" aria-label={`${c.cluster}: ${m(c.inScope)} in scope, ${m(c.proposed)} proposed`}>
                <span className="bg-s1" style={{ width: `${(c.inScope / maxCl) * 100}%` }} />
                <span className="bg-s2" style={{ width: `${(c.proposed / maxCl) * 100}%` }} />
              </span>
              <span className="tabular-nums text-right">{m(c.inScope + c.proposed)}<span className="block text-[11px] text-ink-3">{c.headings.length} heading{c.headings.length > 1 ? "s" : ""}</span></span>
            </li>
          ))}
        </ul>
      </Exhibit>
    </>
  );
}

function FormulaRow({ I, label, tone, kg, certs, price, perUnit, unitPrice }: { I: LucideIcon; label: string; tone: string; kg: number; certs: number; price: number; perUnit: number; unitPrice: number }) {
  const chip = (SI: LucideIcon, v: string, l: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-sunken px-2 py-1"><SI aria-hidden size={14} className="text-ink-3" /><span className="font-semibold tabular-nums">{v}</span><span className="text-[11px] text-ink-3">{l}</span></span>
  );
  const op = (o: string) => <span aria-hidden className="text-ink-3">{o}</span>;
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-sm font-medium inline-flex items-center gap-1.5" style={{ color: `var(--${tone}i)` }}><I aria-hidden size={15} />{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {chip(Weight, `${kg.toFixed(2)} kg`, "steel in the part")}{op("×")}
        {chip(Flame, `${certs.toFixed(2)} t/t`, "CO₂ charged per t of steel")}{op("=")}
        {chip(Flame, `${(kg * certs).toFixed(2)} kg`, "CO₂ charged")}{op("×")}
        {chip(Euro, `${eur(price)}/t`, "certificate price")}{op("=")}
        <span className="font-cond text-2xl font-semibold tabular-nums" style={{ color: `var(--${tone}i)` }}>{eur(perUnit, 2)}</span><span className="text-ink-3 text-xs">per unit</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="h-2 flex-1 rounded-full bg-sunken overflow-hidden" aria-hidden><span className="block h-full" style={{ width: `${Math.min(100, (perUnit / unitPrice) * 100)}%`, background: `var(--${tone})` }} /></span>
        <span className="tabular-nums w-40 text-right">{pct(perUnit / unitPrice)} of the export price</span>
      </div>
    </div>
  );
}

export function MsmeCalc() {
  const [weight, setWeight] = useState(2.5);
  const [share, setShare] = useState(0.9);
  const [unitPrice, setUnitPrice] = useState(12);
  const [intensity, setInt] = useState(2.4);
  const [year, setYear] = useState(2028);
  const P = priceIn(year, S.basePrice, S.growth), F = cbamFactor(year), B = PRODUCTS.steel.benchmarks[0].value;
  const certsV = Math.max(0, intensity - F * B), certsD = Math.max(0, PRODUCTS.steel.defaultValue.value * (1 + defaultMarkup(year)) - F * B);
  const v = downstreamCostPerUnit(weight, share, certsV, P), d = downstreamCostPerUnit(weight, share, certsD, P);
  return (
    <Exhibit n={5} title={`A ${weight.toFixed(1)} kg steel part costs ${eur(v, 2)} in CBAM with verified mill data and ${eur(d, 2)} on India's default: ${(d / Math.max(v, 1e-9)).toFixed(1)}× more`}
      subtitle="MSME calculator: for a Ludhiana fastener maker or a Rajkot casting shop, the steel content priced at your mill's verified intensity vs India's default value"
      source="Free-allocation benchmark: BF-BOF hot-rolled value as a proxy (downstream benchmarks will be set per good if the extension is adopted). Default 4.28 tCO₂/t plus the year's mark-up."
      controls={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Slider label="Unit weight (kg)" value={weight} min={0.1} max={50} step={0.1} fmt={(x) => x.toFixed(1)} onChange={setWeight} />
          <Slider label="Steel share of weight" value={share} min={0.1} max={1} step={0.05} fmt={pct} onChange={setShare} />
          <Slider label="Export price per unit (€)" value={unitPrice} min={1} max={500} step={1} fmt={(x) => eur(x)} onChange={setUnitPrice} />
          <Slider label="Supplier steel intensity (tCO₂/t)" value={intensity} min={0.3} max={4} step={0.05} fmt={(x) => x.toFixed(2)} onChange={setInt} />
          <Slider label="Year" value={year} min={2026} max={2034} step={1} fmt={String} onChange={setYear} />
        </div>
      }>
      <div className="grid gap-3">
        <p className="text-xs text-ink-3 inline-flex items-center gap-1.5"><Package aria-hidden size={14} />Per unit exported to the EU, {year}</p>
        <FormulaRow I={ShieldCheck} label="With your mill's verified data" tone="s1" kg={weight * share} certs={certsV} price={P} perUnit={v} unitPrice={unitPrice} />
        <FormulaRow I={TriangleAlert} label="On India's default value + mark-up" tone="s2" kg={weight * share} certs={certsD} price={P} perUnit={d} unitPrice={unitPrice} />
        <p className="rounded-lg border-l-4 border-s3 bg-sunken px-3 py-2 text-sm inline-flex items-start gap-2"><ShieldCheck aria-hidden size={16} className="mt-0.5 text-s3i shrink-0" />Ask your steel supplier for its verified CBAM emissions per tonne. It is the single cheapest way for an MSME to cut this cost.</p>
      </div>
    </Exhibit>
  );
}
