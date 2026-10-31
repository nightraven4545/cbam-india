"use client";

import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PRODUCERS, LEVERS, PEER_DEFAULTS, STEEL_HR, benchmarkFor, type Confidence } from "@/lib/data";
import { DEFAULT_SCENARIO, cumulativeExposure, leverEconomics, producerSummary, trajectory, type Scenario } from "@/lib/model";
import { YEARS, cbamFactor, defaultMarkup } from "@/lib/cbam";

const eur = (n: number, d = 0) => `€${n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d })}`;
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const m = (n: number) => `€${(n / 1e6).toLocaleString("en-IN", { maximumFractionDigits: 0 })}m`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const AXIS = { stroke: "var(--ink-3)", fontSize: 12 };
const TIP = { contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }, labelStyle: { color: "var(--ink)" } };

function Grade({ c }: { c: Confidence }) {
  return <span title={`Confidence ${c}`} className="ml-1 inline-block rounded border border-line px-1 text-[10px] text-ink-3 align-middle">{c}</span>;
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-semibold">{title}</h2>
      {sub && <p className="text-sm text-ink-2 mt-1">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Slider(props: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-ink-2"><span>{props.label}</span><span className="text-ink font-medium">{props.fmt(props.value)}</span></span>
      <input type="range" className="w-full accent-[var(--s1)]" min={props.min} max={props.max} step={props.step} value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))} aria-label={props.label} />
    </label>
  );
}

export default function Dashboard() {
  const [s, setS] = useState<Scenario>(DEFAULT_SCENARIO);
  const [pid, setPid] = useState("jsw");
  const [dedicatedEU, setDedicatedEU] = useState(false);
  const [cctsPrice, setCcts] = useState(0);
  const [greenPremium, setPremium] = useState(0);
  const set = <K extends keyof Scenario>(k: K) => (v: Scenario[K]) => setS((o) => ({ ...o, [k]: v }));

  const p = PRODUCERS.find((x) => x.id === pid)!;
  const rows = useMemo(() => PRODUCERS.map((x) => ({ p: x, r: producerSummary(x, s), cumD: cumulativeExposure(x, s, "default"), cumA: cumulativeExposure(x, s, "actual") })), [s]);
  const r = rows.find((x) => x.p.id === pid)!.r;
  const traj = useMemo(() => trajectory(p, s), [p, s]);
  const levers = useMemo(
    () => LEVERS.map((l) => ({ l, e: leverEconomics(p, l, s, { dedicatedEU, cctsPrice, greenPremium, discount: 0.1 }) }))
      .sort((a, b) => (b.e.irr ?? -9) - (a.e.irr ?? -9) || b.e.npv - a.e.npv),
    [p, s, dedicatedEU, cctsPrice, greenPremium],
  );

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

  const peer = PEER_DEFAULTS.map((d) => ({ ...d, marked: d.value * (1 + defaultMarkup(s.year)) }));
  const macData = levers.filter((x) => x.e.mac !== null).map((x) => ({ name: x.l.name.split(" (")[0], mac: Math.round(x.e.mac!) })).sort((a, b) => a.mac - b.mac);
  const price = s.basePrice * Math.pow(1 + s.growth, s.year - 2026);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-ink-3">EU CBAM · definitive regime since 1 Jan 2026 · steel MVP</p>
        <h1 className="text-2xl sm:text-4xl font-semibold leading-tight max-w-3xl">Which Indian steelmakers lose as Europe prices carbon, and what should they do about it?</h1>
        <p className="text-ink-2 max-w-3xl">
          The EU importer pays CBAM, but the Indian exporter bears it through lower prices. The cheapest lever is not a furnace: it is <strong className="text-ink">verified emissions data</strong>.
          Unverified steel is charged on India&apos;s default of {STEEL_HR.defaultValue.value} tCO₂/t plus a mark-up. Verified BF-BOF steel runs at about 2.0–2.6.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-xl border border-line bg-surface p-4 h-fit lg:sticky lg:top-20">
          <label className="block text-sm">
            <span className="text-ink-2">Producer</span>
            <select className="mt-1 w-full rounded-md border border-line bg-bg px-2 py-1.5" value={pid} onChange={(e) => setPid(e.target.value)}>
              {PRODUCERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
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
          <p className="text-xs text-ink-3">{s.year}: CBAM factor {pct(cbamFactor(s.year, s.regime))} · default mark-up {pct(defaultMarkup(s.year))} · price {eur(price, 2)}</p>
        </aside>

        <div className="space-y-6 min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { k: "EU margin at risk, verified data", v: inr(r.hitActual * s.fx) + "/t", sub: `${eur(r.hitActual)}/t · ${pct(1 - r.marginLeftActual)} of EU EBITDA` },
              { k: "…and on EU default values", v: inr(r.hitDefault * s.fx) + "/t", sub: `${eur(r.hitDefault)}/t · ${r.marginLeftDefault < 0 ? "wipes out EU EBITDA" : pct(1 - r.marginLeftDefault) + " of EU EBITDA"}` },
              { k: "Value of verification / yr", v: m(r.verificationValue), sub: `Importer's saving on ${p.euVolume.value} Mt, before any pass-through` },
            ].map((t) => (
              <div key={t.k} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs text-ink-3">{t.k}</p>
                <p className="text-2xl font-semibold mt-1">{t.v}</p>
                <p className="text-xs text-ink-2 mt-1">{t.sub}</p>
              </div>
            ))}
          </div>

          <Card title={`${p.name}: EBITDA bridge per tonne sold to the EU (${s.year})`} sub={`${p.route}. Benchmark ${benchmarkFor(p).toFixed(3)} t (route-weighted); verified direct intensity ${p.actualDirect.value} t.`}>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-ink-3">
                  <tr>{["Producer", "Intensity t/t", "CBAM €/t default", "CBAM €/t verified", "EU EBITDA kept (verified)", "Verification €/yr", "Cum. verified", "Cum. default"].map((h) => <th key={h} className="py-2 pr-3 font-medium whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map(({ p: x, r: y, cumA, cumD }) => (
                    <tr key={x.id} onClick={() => setPid(x.id)} className={`border-t border-line cursor-pointer hover:bg-bg ${x.id === pid ? "bg-bg font-medium" : ""}`}>
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
            <Card title="Country default values, tCO₂/t" sub={`Commission defaults incl. the ${pct(defaultMarkup(s.year))} mark-up in ${s.year}. India's default is the steepest, which hands an advantage to verified competitors.`}>
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

          <Card title="Decarbonisation lab: which levers pay back?" sub={`${p.name}, 10% discount rate, capex in 2026, benefits from 2027. CBAM saving = avoided certificates × pass-through × EU share of output.`}>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm mb-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={dedicatedEU} onChange={(e) => setDedicatedEU(e.target.checked)} /> Dedicated EU line (all low-carbon output sold to the EU)</label>
              <div className="w-56"><Slider label="CCTS credit price (€/t)" value={cctsPrice} min={0} max={40} step={1} fmt={(v) => eur(v)} onChange={setCcts} /></div>
              <div className="w-56"><Slider label="Green premium (€ per tCO₂ avoided)" value={greenPremium} min={0} max={150} step={5} fmt={(v) => eur(v)} onChange={setPremium} /></div>
            </div>
            <div className="overflow-x-auto">
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
                  <span>{t} <span className={`ml-1 text-[10px] uppercase rounded px-1 border ${k === "law" ? "border-s1 text-s1" : "border-s2 text-s2"}`}>{k}</span></span>
                </li>
              ))}
            </ol>
          </Card>
          <p className="text-xs text-ink-3">Years modelled: {YEARS[0]}–{YEARS[YEARS.length - 1]}. Grades: A verified · B regulation · C company disclosure · D estimate · E EU default. See Methodology.</p>
        </div>
      </div>
    </div>
  );
}
