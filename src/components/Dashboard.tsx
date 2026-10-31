"use client";

import { useEffect, useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PRODUCERS, LEVERS, PEER_DEFAULTS, PRODUCTS, benchmarkFor, type Producer, type Sector } from "@/lib/data";
import { AXIS, Card, Grade, Slider, TIP, eur, inr, m, pct } from "./ui";
import { PageHeader } from "./consulting/core";
import { CrossoverCard, RiskCard, TornadoCard } from "./Phase2Cards";
import { H2OptionCard, OptimiserCard } from "./Phase3Cards";
import { DEFAULT_SCENARIO, cumulativeExposure, leverEconomics, producerSummary, trajectory, type Scenario } from "@/lib/model";
import { cbamFactor, defaultMarkup } from "@/lib/cbam";

const CUSTOM_ID = "custom";
// One-click scenarios; each one is also a shareable URL through the state mirror below.
const PRESETS: { label: string; hint: string; s: Partial<Scenario> }[] = [
  { label: "Base", hint: "€82.32 growing 3%/yr, 50% pass-through, law in force", s: {} },
  { label: "Bear", hint: "Price ~€130 by 2030 (+12%/yr), exporter absorbs 70%", s: { growth: 0.12, passThrough: 0.7 } },
  { label: "Bull", hint: "COM(2026) 616 adopted, price falls 5%/yr, 35% pass-through", s: { growth: -0.05, passThrough: 0.35, regime: "proposal" } },
  { label: "India €20", hint: "Explicit €20/t Indian carbon price credited under Article 9", s: { originCarbonPrice: 20 } },
];
const URL_KEYS = ["year", "basePrice", "growth", "passThrough", "originCarbonPrice", "fx"] as const;

function customProducer(sector: Sector, c: { intensity: number; vol: number; ebitda: number }): Producer {
  const g = (value: number) => ({ value, confidence: "D" as const, source: "User input" });
  return {
    id: CUSTOM_ID, name: "Custom producer", sector, route: "User-defined (primary route)", routeShares: [1, 0, 0],
    production: g(Math.max(c.vol, 0.01) * 10), euVolume: g(c.vol), actualDirect: g(c.intensity), indirect: g(sector === "aluminium" ? 14 : sector === "cement" ? 0.05 : 0.3),
    ebitdaEUR: g(c.ebitda), note: "Your own inputs. Production is assumed at 10× EU volume for the lever maths.",
  };
}

function toCSV(rows: (string | number)[][]) {
  return rows.map((r) => r.map((x) => (typeof x === "string" && /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x)).join(",")).join("\n");
}
function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Dashboard() {
  const [s, setS] = useState<Scenario>(DEFAULT_SCENARIO);
  const [sector, setSector] = useState<Sector>("steel");
  const [pid, setPid] = useState("jsw");
  const [custom, setCustom] = useState({ intensity: 2.3, vol: 0.2, ebitda: 90 });
  const [dedicatedEU, setDedicatedEU] = useState(false);
  const [cctsPrice, setCcts] = useState(0);
  const [greenPremium, setPremium] = useState(0);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Scenario>(k: K) => (v: Scenario[K]) => setS((o) => ({ ...o, [k]: v }));

  // Shareable scenario: read the query string once, then mirror state into it.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const num = (k: string) => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : undefined);
    setS((o) => {
      const n = { ...o };
      for (const k of URL_KEYS) n[k] = num(k) ?? o[k];
      if (q.get("regime") === "proposal") n.regime = "proposal";
      if (q.get("indirect") === "1") n.includeIndirect = true;
      return n;
    });
    const sec = q.get("sector");
    if (sec === "steel" || sec === "aluminium" || sec === "cement") setSector(sec);
    if (q.get("p")) setPid(q.get("p")!);
    if (q.has("ci")) setCustom({ intensity: num("ci") ?? 2.3, vol: num("cv") ?? 0.2, ebitda: num("ce") ?? 90 });
  }, []);
  useEffect(() => {
    const q = new URLSearchParams();
    for (const k of URL_KEYS) if (s[k] !== DEFAULT_SCENARIO[k]) q.set(k, String(s[k]));
    if (s.regime !== "law") q.set("regime", s.regime);
    if (s.includeIndirect) q.set("indirect", "1");
    if (sector !== "steel") q.set("sector", sector);
    q.set("p", pid);
    if (pid === CUSTOM_ID) { q.set("ci", String(custom.intensity)); q.set("cv", String(custom.vol)); q.set("ce", String(custom.ebitda)); }
    window.history.replaceState(null, "", `?${q.toString()}`);
  }, [s, sector, pid, custom]);

  const list = useMemo(() => [...PRODUCERS.filter((x) => x.sector === sector), customProducer(sector, custom)], [sector, custom]);
  const p = list.find((x) => x.id === pid) ?? list[0];
  const product = PRODUCTS[sector];
  const rows = useMemo(() => list.map((x) => ({ p: x, r: producerSummary(x, s), cumD: cumulativeExposure(x, s, "default"), cumA: cumulativeExposure(x, s, "actual") })), [list, s]);
  const r = rows.find((x) => x.p.id === p.id)!.r;
  const traj = useMemo(() => trajectory(p, s), [p, s]);
  const levers = useMemo(
    () => LEVERS.filter((l) => l.sector === sector).map((l) => ({ l, e: leverEconomics(p, l, s, { dedicatedEU, cctsPrice, greenPremium, discount: 0.1 }) }))
      .sort((a, b) => (b.e.irr ?? -9) - (a.e.irr ?? -9) || b.e.npv - a.e.npv),
    [p, s, sector, dedicatedEU, cctsPrice, greenPremium],
  );
  const switchSector = (sec: Sector) => { setSector(sec); setPid(PRODUCERS.find((x) => x.sector === sec)!.id); };
  const exportLeaderboard = () => download(`cbam-${sector}-${s.year}.csv`, toCSV([
    ["Producer", "Direct tCO2/t", "CBAM EUR/t default", "CBAM EUR/t verified", "Exporter hit EUR/t (verified)", "EU EBITDA kept (verified)", "Verification value EUR/yr", "Cum 2026-34 verified EUR", "Cum 2026-34 default EUR"],
    ...rows.map(({ p: x, r: y, cumA, cumD }) => [x.name, x.actualDirect.value, y.def.net.toFixed(2), y.act.net.toFixed(2), y.hitActual.toFixed(2), y.marginLeftActual.toFixed(3), Math.round(y.verificationValue), Math.round(cumA), Math.round(cumD)]),
  ]));
  const exportLevers = () => download(`cbam-levers-${p.id}.csv`, toCSV([
    ["Lever", "Direct cut t/t", "Capex EUR/t", "NPV EUR/t", "IRR", "Payback yrs", "MAC EUR/tCO2", "CBAM relevant", "TRL"],
    ...levers.map(({ l, e }) => [l.name, l.abatement, l.capex, e.npv.toFixed(1), e.irr === null ? "" : e.irr.toFixed(4), e.payback === null ? "" : e.payback.toFixed(2), e.mac === null ? "" : e.mac.toFixed(1), e.cbamRelevant ? "yes" : "no", l.trl]),
  ]));
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked: URL bar still has the link */ } };

  // EBITDA bridge per tonne of EU sales (floating bars as [low, high]).
  const base = p.ebitdaEUR.value;
  const afterDefault = base - r.def.net;
  const afterVerify = afterDefault + (r.def.net - r.act.net);
  const close = afterVerify + r.act.net * (1 - s.passThrough);
  const bridge = [
    { name: "EBITDA before CBAM", range: [0, base], kind: "total" },
    { name: "CBAM on defaults", range: [afterDefault, base], kind: "cost" },
    { name: "Verified data", range: [afterDefault, afterVerify], kind: "gain" },
    { name: "Importer absorbs", range: [afterVerify, close], kind: "gain" },
    { name: "EBITDA after CBAM", range: [Math.min(0, close), Math.max(0, close)], kind: "total" },
  ];
  const fill = (k: string) => (k === "cost" ? "var(--s2)" : k === "gain" ? "var(--s1)" : "var(--neutral)");

  const peer = PEER_DEFAULTS[sector].map((d) => ({ ...d, marked: d.value * (1 + defaultMarkup(s.year)) }));
  const macData = levers.filter((x) => x.e.mac !== null).map((x) => ({ name: x.l.name.split(" (")[0], mac: Math.round(x.e.mac!) })).sort((a, b) => a.mac - b.mac);
  const price = s.basePrice * Math.pow(1 + s.growth, s.year - 2026);

  return (
    <div>
      <PageHeader step="model" title="Scenario model: test any producer, price path or policy, and every exhibit updates"
        lede={sector === "steel"
          ? <>Unverified steel is charged on India&apos;s default of {product.defaultValue.value} tCO₂/t plus a mark-up; verified BF-BOF steel runs at about 2.0–2.6. Every number below is computed live from the regulation&apos;s formula.</>
          : sector === "cement"
          ? <>Cement is the contrast case: India barely exports it to the EU, but electricity emissions are charged by law, so renewables and waste-heat recovery cut CBAM directly.</>
          : <>For aluminium, only anode and PFC emissions (about 1.7–1.8 t) are charged today, not the 14–15 t from captive coal power. Use the indirect-emissions stress test to see what changes if that rule moves.</>} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-[10px] border border-line bg-surface p-4 h-fit lg:sticky lg:top-20">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-bg p-1 text-sm" role="tablist" aria-label="Sector">
            {(["steel", "aluminium", "cement"] as const).map((sec) => (
              <button key={sec} role="tab" aria-selected={sector === sec} onClick={() => switchSector(sec)}
                className={`rounded-md py-1.5 capitalize ${sector === sec ? "bg-surface shadow-sm font-medium" : "text-ink-2"}`}>{sec}</button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="text-ink-2">Producer</span>
            <select className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5" value={p.id} onChange={(e) => setPid(e.target.value)}>
              {list.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          {p.id === CUSTOM_ID && (
            <div className="space-y-3 rounded-lg border border-line p-3">
              <Slider label="Direct intensity (tCO₂/t)" value={custom.intensity} min={0.2} max={sector === "steel" ? 4 : sector === "cement" ? 1.5 : 3} step={0.05} fmt={(v) => v.toFixed(2)} onChange={(v) => setCustom((c) => ({ ...c, intensity: v }))} />
              <Slider label="EU volume (Mt/yr)" value={custom.vol} min={0.01} max={2} step={0.01} fmt={(v) => v.toFixed(2)} onChange={(v) => setCustom((c) => ({ ...c, vol: v }))} />
              <Slider label="EBITDA on EU sales (€/t)" value={custom.ebitda} min={20} max={sector === "steel" ? 250 : sector === "cement" ? 40 : 1500} step={5} fmt={(v) => eur(v)} onChange={(v) => setCustom((c) => ({ ...c, ebitda: v }))} />
            </div>
          )}
          <fieldset>
            <legend className="text-sm text-ink-2 mb-1.5">Scenario preset</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((pr) => {
                const target = { ...DEFAULT_SCENARIO, year: s.year, fx: s.fx, includeIndirect: s.includeIndirect, ...pr.s };
                const active = (Object.keys(target) as (keyof Scenario)[]).every((k) => target[k] === s[k]);
                return (
                  <button key={pr.label} type="button" title={pr.hint} aria-pressed={active} onClick={() => setS(target)}
                    className={`rounded-md border px-2 py-1.5 text-sm ${active ? "bg-ink text-bg border-ink" : "border-line text-ink-2 hover:border-ink-3"}`}>{pr.label}</button>
                );
              })}
            </div>
          </fieldset>
          <Slider label="Year" value={s.year} min={2026} max={2034} step={1} fmt={String} onChange={set("year")} />
          <Slider label="Certificate price 2026 (€/t)" value={s.basePrice} min={50} max={150} step={0.01} fmt={(v) => eur(v, 2)} onChange={set("basePrice")} />
          <Slider label="Price growth / yr" value={s.growth} min={-0.05} max={0.1} step={0.01} fmt={pct} onChange={set("growth")} />
          <Slider label="Pass-through to exporter" value={s.passThrough} min={0} max={1} step={0.05} fmt={pct} onChange={set("passThrough")} />
          <Slider label="India carbon price credited (Art. 9)" value={s.originCarbonPrice} min={0} max={60} step={1} fmt={(v) => eur(v)} onChange={set("originCarbonPrice")} />
          <Slider label="₹ per €" value={s.fx} min={85} max={115} step={0.5} fmt={(v) => `₹${v}`} onChange={set("fx")} />
          <fieldset className="text-sm">
            <legend className="text-ink-2 mb-1">Free-allocation path</legend>
            {(["law", "proposal"] as const).map((g) => (
              <label key={g} className="mr-4"><input type="radio" name="regime" checked={s.regime === g} onChange={() => set("regime")(g)} /> {g === "law" ? "Law in force" : "COM(2026) 616 proposal"}</label>
            ))}
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={s.includeIndirect} onChange={(e) => set("includeIndirect")(e.target.checked)} />
            <span>Stress test: charge indirect (electricity) emissions too<span className="block text-xs text-ink-3">Not law for steel or aluminium today; it is under review.</span></span>
          </label>
          <button onClick={copyLink} className="w-full rounded-md border border-line py-1.5 text-sm hover:bg-bg">{copied ? "Link copied ✓" : "Copy link to this scenario"}</button>
          <a href="/cbam-india-model.xlsx" download className="block w-full rounded-md bg-ink text-bg py-1.5 text-sm text-center font-medium">Download the Excel model</a>
          <p className="text-xs text-ink-3">{s.year}: CBAM factor {pct(cbamFactor(s.year, s.regime))} · default mark-up {pct(defaultMarkup(s.year))} · price {eur(price, 2)}</p>
        </aside>

        <div className="space-y-6 min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { k: "EU margin at risk, verified data", v: inr(r.hitActual * s.fx) + "/t", sub: `${eur(r.hitActual)}/t · ${pct(1 - r.marginLeftActual)} of EU EBITDA` },
              { k: "…and on EU default values", v: inr(r.hitDefault * s.fx) + "/t", sub: `${eur(r.hitDefault)}/t · ${r.marginLeftDefault < 0 ? "wipes out EU EBITDA" : pct(1 - r.marginLeftDefault) + " of EU EBITDA"}` },
              { k: "Value of verification / yr", v: m(r.verificationValue), sub: `Importer's saving on ${p.euVolume.value} Mt, before any pass-through` },
            ].map((t) => (
              <div key={t.k} className="rounded-[10px] border border-line bg-surface p-4">
                <p className="text-xs text-ink-3">{t.k}</p>
                <p className="text-2xl font-semibold mt-1">{t.v}</p>
                <p className="text-xs text-ink-2 mt-1">{t.sub}</p>
              </div>
            ))}
          </div>

          <Tabs.Root defaultValue="exposure" className="min-w-0">
            <Tabs.List aria-label="Model views" className="flex gap-1 overflow-x-auto border-b border-line mb-5">
              {[["exposure","Exposure"],["risk","Risk"],["competitiveness","Competitiveness"],["levers","Levers"],["trade","Trade"],["timeline","Timeline"]].map(([v,l]) => (
                <Tabs.Trigger key={v} value={v} className="px-3 py-2 text-sm whitespace-nowrap text-ink-3 border-b-2 border-transparent -mb-px data-[state=active]:text-ink data-[state=active]:border-ink data-[state=active]:font-medium hover:text-ink">{l}</Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="exposure" className="space-y-6">
              <Card title={`${p.name}: EBITDA bridge per tonne sold to the EU (${s.year})`} sub={`${p.route}. Benchmark ${benchmarkFor(p).toFixed(3)} t (route-weighted, CN ${product.cn}); verified direct intensity ${p.actualDirect.value} t${s.includeIndirect ? ` + ${p.indirect.value} t indirect (stress test)` : ""}.`}>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={bridge} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="name" tick={AXIS} interval={0} height={50} tickLine={false} />
                      <YAxis tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} />
                      <ReferenceLine y={0} stroke="var(--ink-3)" />
                      <Tooltip {...TIP} formatter={(v: number[]) => eur(v[1] - v[0])} />
                      <Bar dataKey="range" radius={4} isAnimationActive={false}>
                        {bridge.map((b) => <Cell key={b.name} fill={fill(b.kind)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-ink-2">{p.note} EBITDA {eur(base)}/t<Grade c={p.ebitdaEUR.confidence} />, EU volume {p.euVolume.value} Mt<Grade c={p.euVolume.confidence} />.</p>
              </Card>
              <Card title="Producer leaderboard" sub={`Year ${s.year}, ${pct(s.passThrough)} pass-through. "Cum." covers 2026–2034 at this pass-through. Click a row to select it.`}>
                <button onClick={exportLeaderboard} className="mb-3 rounded-md border border-line px-3 py-1 text-xs hover:bg-bg">Download CSV</button>
                <div tabIndex={0} className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-ink-3">
                      <tr>{["Producer", "Intensity t/t", "CBAM €/t default", "CBAM €/t verified", "EU EBITDA kept (verified)", "Verification €/yr", "Cum. verified", "Cum. default"].map((h) => <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.map(({ p: x, r: y, cumA, cumD }) => (
                        <tr key={x.id} onClick={() => setPid(x.id)} className={`border-t border-line cursor-pointer hover:bg-bg ${x.id === p.id ? "bg-bg font-medium" : ""}`}>
                          <td className="py-2 pr-3 whitespace-nowrap">{x.name}</td>
                          <td className="pr-3">{x.actualDirect.value}<Grade c={x.actualDirect.confidence} /></td>
                          <td className="pr-3">{eur(y.def.net)}</td>
                          <td className="pr-3">{eur(y.act.net)}</td>
                          <td className="pr-3">{y.marginLeftActual < 0 ? "negative" : pct(y.marginLeftActual)}</td>
                          <td className="pr-3">{m(y.verificationValue)}</td>
                          <td className="pr-3">{m(cumA)}</td>
                          <td className="pr-3">{m(cumD)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="grid gap-6 xl:grid-cols-2">
                <Card title="CBAM cost path, € per tonne" sub="The legal cost per tonne before pass-through. The free allocation falls from 97.5% to 0% by 2034.">
                  <div className="h-64">
                    <ResponsiveContainer>
                      <LineChart data={traj} margin={{ left: 0, right: 12 }}>
                        <CartesianGrid vertical={false} stroke="var(--line)" />
                        <XAxis dataKey="year" tick={AXIS} tickLine={false} />
                        <YAxis tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} />
                        <Tooltip {...TIP} formatter={(v: number) => eur(v)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <ReferenceLine x={s.year} stroke="var(--ink-3)" strokeDasharray="3 3" />
                        <Line dataKey="default" name="EU default + mark-up" stroke="var(--s2)" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                        <Line dataKey="actual" name="Verified actual" stroke="var(--s1)" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card title="Country default values, tCO₂/t" sub={`Commission defaults incl. the ${pct(defaultMarkup(s.year))} mark-up in ${s.year}. ${sector === "steel" ? "India's default is the steepest, which hands an advantage to verified competitors." : "India sits mid-pack; China's coal-based default is higher, Korea's far lower."}`}>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={peer} layout="vertical" margin={{ left: 40, right: 16 }}>
                        <CartesianGrid horizontal={false} stroke="var(--line)" />
                        <XAxis type="number" tick={AXIS} tickLine={false} />
                        <YAxis type="category" dataKey="country" tick={AXIS} width={120} tickLine={false} />
                        <Tooltip {...TIP} formatter={(v: number) => v.toFixed(2)} />
                        <Bar dataKey="marked" name="Default incl. mark-up" fill="var(--s2)" radius={4} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </Tabs.Content>
            <Tabs.Content value="risk" className="space-y-6">
              <TornadoCard p={p} s={s} />
              <RiskCard p={p} s={s} />
            </Tabs.Content>
            <Tabs.Content value="competitiveness" className="space-y-6">
              {sector === "steel" && <CrossoverCard s={s} />}
              {sector !== "steel" && <p className="text-sm text-ink-2">The delivered-cost crossover is modelled for hot-rolled steel. Switch the sector to steel to see it.</p>}
            </Tabs.Content>
            <Tabs.Content value="levers" className="space-y-6">
              <Card title="Decarbonisation lab: which levers pay back?" sub={`${p.name}, 10% discount rate, capex in 2026, benefits from 2027. CBAM saving = avoided certificates × pass-through × EU share of output.`}>
                <button onClick={exportLevers} className="mb-3 rounded-md border border-line px-3 py-1 text-xs hover:bg-bg">Download CSV</button>
                <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm mb-4">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={dedicatedEU} onChange={(e) => setDedicatedEU(e.target.checked)} /> Dedicated EU line (all low-carbon output sold to the EU)</label>
                  <div className="w-56"><Slider label="CCTS credit price (€/t)" value={cctsPrice} min={0} max={40} step={1} fmt={(v) => eur(v)} onChange={setCcts} /></div>
                  <div className="w-56"><Slider label="Green premium (€ per tCO₂ avoided)" value={greenPremium} min={0} max={150} step={5} fmt={(v) => eur(v)} onChange={setPremium} /></div>
                </div>
                <div tabIndex={0} className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-ink-3">
                      <tr>{["Lever", "Direct cut t/t", "Capex €/t", "NPV €/t", "IRR", "Payback", "MAC €/tCO₂", "Steel CBAM?", "TRL"].map((h) => <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {levers.map(({ l, e }) => (
                        <tr key={l.id} className="border-t border-line align-top">
                          <td className="py-2 pr-3"><span className="font-medium">{l.name}</span><br /><span className="text-xs text-ink-3">{l.note}</span></td>
                          <td className="pr-3">{l.abatement}</td>
                          <td className="pr-3">{eur(l.capex)}</td>
                          <td className={`pr-3 ${e.npv >= 0 ? "text-accent" : ""}`}>{eur(e.npv)}</td>
                          <td className="pr-3">{e.irr === null ? (e.npv >= 0 ? "n/a (no capex)" : "never") : pct(e.irr)}</td>
                          <td className="pr-3">{e.payback === null ? "–" : e.payback < 0.05 ? "immediate" : `${e.payback.toFixed(1)} y`}</td>
                          <td className="pr-3">{e.mac === null ? "–" : eur(e.mac)}</td>
                          <td className="pr-3">{e.cbamRelevant ? "yes" : "no"}</td>
                          <td className="pr-3">{l.trl}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Marginal abatement cost (ex-CBAM revenue) vs the {s.year} certificate price</p>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <BarChart data={macData} layout="vertical" margin={{ left: 8, right: 24 }}>
                        <CartesianGrid horizontal={false} stroke="var(--line)" />
                        <XAxis type="number" tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 11 }} width={150} tickLine={false} />
                        <Tooltip {...TIP} formatter={(v: number) => `${eur(v)}/tCO₂`} />
                        <ReferenceLine x={price} stroke="var(--s2)" strokeDasharray="4 4" label={{ value: `certificate ${eur(price)}`, fill: "var(--ink-2)", fontSize: 11, position: "top" }} />
                        <ReferenceLine x={0} stroke="var(--ink-3)" />
                        <Bar dataKey="mac" name="€/tCO₂" fill="var(--s1)" radius={4} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-ink-3 mt-2">Levers left of the dashed line cost less per tonne of CO₂ than buying certificates. Only levers that cut direct emissions avoid steel CBAM.</p>
                </div>
              </Card>
              {sector === "steel" && <H2OptionCard s={s} />}
            </Tabs.Content>
            <Tabs.Content value="trade" className="space-y-6">
              {sector === "steel" && <OptimiserCard key={p.id} p={p} s={s} />}
              {sector !== "steel" && <p className="text-sm text-ink-2">Plant-level allocation is modelled for steel producers. Switch the sector to steel to see it.</p>}
            </Tabs.Content>
            <Tabs.Content value="timeline" className="space-y-6">
              <Card title="Timeline: law today vs proposals">
                <ol className="text-sm space-y-2">
                  {[
                    ["1 Oct 2023 – 31 Dec 2025", "Transitional period: reporting only, no payment.", "law"],
                    ["1 Jan 2026", "Definitive regime: authorised declarants, 50 t de minimis (Omnibus Reg. 2025/2083), defaults + 10% mark-up.", "law"],
                    ["7 Apr / 6 Jul / 5 Oct 2026", "Quarterly certificate prices: €75.36, €75.28, €82.32.", "law"],
                    ["1 Jul 2026", "EU steel safeguard replaced by tariff-rate quotas: India ≈ 2.8 Mt, 50% tariff above quota; CBAM applies within quota.", "law"],
                    ["17 Jul 2026", "COM(2026) 616 (ETS Phase 5) proposes reintroducing 15% of phased-out free allocation from 2028 and ending the phase-out in 2038.", "proposal"],
                    ["2027", "Certificate sales from 1 Feb; weekly pricing; 50% quarterly holding; 2026 declaration due 30 Sep 2027; mark-up 20%.", "law"],
                    ["2028", "Mark-up reaches 30%; extension to ~180 downstream steel and aluminium goods proposed.", "proposal"],
                    ["2030 → 2034", "Free allocation falls 77.5% → 51.5% → 0%: the cash cliff.", "law"],
                  ].map(([d, t, k]) => (
                    <li key={d} className="grid grid-cols-[150px_1fr] gap-3">
                      <span className="text-ink-3">{d}</span>
                      <span>{t} <span className={`ml-1 text-[10px] uppercase rounded px-1 border ${k === "law" ? "border-s1 text-s1i" : "border-s2 text-s2i"}`}>{k}</span></span>
                    </li>
                  ))}
                </ol>
              </Card>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>
    </div>
  );
}
