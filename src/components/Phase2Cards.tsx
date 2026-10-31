"use client";

import { useMemo, useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COMPETITORS, type Producer } from "@/lib/data";
import { crossoverPrice, deliveredCost, tornado, type Scenario } from "@/lib/model";
import { DEFAULT_RISK, exposureStats, priceFan, pricePaths } from "@/lib/risk";
import { AXIS, Card, Slider, TIP, eur, m, pct } from "./ui";

export function TornadoCard({ p, s }: { p: Producer; s: Scenario }) {
  const t = useMemo(() => tornado(p, s), [p, s]);
  const data = t.rows.map((r) => ({ driver: r.driver, range: [Math.min(r.lo, r.hi, 0) / 1e6, Math.max(r.lo, r.hi, 0) / 1e6] }));
  return (
    <Card title="What drives the exposure? Sensitivity of 2026–34 verified cost" sub={`${p.name}. Base case ${m(t.base)} to the exporter at ${pct(s.passThrough)} pass-through. Bars show the change (€m) when each driver moves.`}>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid horizontal={false} stroke="var(--line)" />
            <XAxis type="number" tick={AXIS} tickFormatter={(v) => `€${Math.round(v)}m`} tickLine={false} />
            <YAxis type="category" dataKey="driver" tick={{ ...AXIS, fontSize: 11 }} width={170} tickLine={false} />
            <Tooltip {...TIP} formatter={(v: number[]) => [`€${Math.round(v[0])}m to +€${Math.round(v[1])}m`, "Change vs base"]} />
            <ReferenceLine x={0} stroke="var(--ink-3)" />
            <Bar dataKey="range" fill="var(--s1)" radius={4} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function RiskCard({ p, s }: { p: Producer; s: Scenario }) {
  const [sigma, setSigma] = useState(DEFAULT_RISK.sigma);
  const paths = useMemo(() => pricePaths(s, { ...DEFAULT_RISK, sigma }), [s, sigma]);
  const fan = useMemo(() => priceFan(paths), [paths]);
  const act = useMemo(() => exposureStats(p, s, "actual", paths), [p, s, paths]);
  const def = useMemo(() => exposureStats(p, s, "default", paths), [p, s, paths]);
  return (
    <Card title="Carbon-price risk: Monte Carlo of 2026–34 exposure" sub={`${DEFAULT_RISK.n.toLocaleString()} mean-reverting price paths around your price scenario (κ ${DEFAULT_RISK.kappa}, fixed seed). Exposure to the exporter at ${pct(s.passThrough)} pass-through.`}>
      <div className="w-64 mb-3"><Slider label="Price volatility σ (per yr)" value={sigma} min={0} max={0.6} step={0.05} fmt={pct} onChange={setSigma} /></div>
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        {[{ k: "Verified data", v: act, c: "var(--s1)" }, { k: "EU defaults", v: def, c: "var(--s2)" }].map(({ k, v, c }) => (
          <div key={k} className="rounded-lg border border-line p-3 text-sm">
            <p className="font-medium flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />{k}</p>
            <dl className="grid grid-cols-4 gap-2 mt-2">
              {([["P5", v.p5], ["P50", v.p50], ["P95", v.p95], ["CVaR95", v.cvar95]] as const).map(([l, x]) => (
                <div key={l}><dt className="text-xs text-ink-3">{l}</dt><dd className="font-semibold">{m(x)}</dd></div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="text-sm font-medium mb-1">Certificate price fan, €/tCO₂ (P5–P95 band, median line)</p>
      <div className="h-56">
        <ResponsiveContainer>
          <ComposedChart data={fan} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="year" tick={AXIS} tickLine={false} />
            <YAxis tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} />
            <Tooltip {...TIP} formatter={(v: number | number[], n: string) => (Array.isArray(v) ? [`${eur(v[0])} – ${eur(v[1])}`, "P5–P95"] : [eur(v), n])} />
            <Area dataKey="band" name="P5–P95" stroke="none" fill="var(--s1)" fillOpacity={0.18} isAnimationActive={false} />
            <Line dataKey="p50" name="Median" stroke="var(--s1)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-ink-3 mt-2">CVaR95 is the average exposure in the worst 5% of price paths: the number to reserve against. Verification narrows the tail as well as the mean.</p>
    </Card>
  );
}

export function CrossoverCard({ s }: { s: Scenario }) {
  const prices = Array.from({ length: 11 }, (_, i) => 50 + i * 10);
  const data = prices.map((pr) => Object.fromEntries([["price", pr], ...COMPETITORS.map((c) => [c.origin, Math.round(deliveredCost(c, pr, s.year, s.regime))])]));
  const india = COMPETITORS[0];
  const crosses = COMPETITORS.slice(2).map((c) => ({ c, x: crossoverPrice(india, c, s.year, s.regime) }));
  const colors = ["var(--s1)", "var(--s2)", "#1baf7a", "#eda100", "#e87ba4", "#6250d6"];
  return (
    <Card title={`Delivered cost into the EU, HR coil (${s.year}): when does India lose?`} sub="FOB + freight + carbon cost against the certificate price. Inputs are illustrative 2026 levels (grade D); the slopes come from the regulation.">
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="price" tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} />
            <YAxis tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip {...TIP} labelFormatter={(v) => `Certificate price €${v}/t`} formatter={(v: number) => eur(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {COMPETITORS.map((c, i) => (
              <Line key={c.origin} dataKey={c.origin} stroke={colors[i]} strokeWidth={2} dot={false} strokeDasharray={c.origin.includes("defaults") ? "5 4" : undefined} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="text-sm mt-3 space-y-1">
        {crosses.map(({ c, x }) => (
          <li key={c.origin}>
            Verified Indian BF-BOF vs <strong>{c.origin}</strong>:{" "}
            {x === null ? "no crossover in range" : `costs equalise at ${eur(x)}/tCO₂`}
            {x !== null && (deliveredCost(india, x + 1, s.year, s.regime) > deliveredCost(c, x + 1, s.year, s.regime) ? "; India loses above this price." : "; India wins above this price.")}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-3 mt-2">Volume cap: from 1 Jul 2026, India&apos;s EU steel access is about 2.8 Mt in tariff-rate quotas (1.9 Mt country-specific); above quota a 50% tariff applies. CBAM is charged within quota.</p>
    </Card>
  );
}
