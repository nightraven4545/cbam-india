"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Producer } from "@/lib/data";
import { optimiseAllocation, type Scenario } from "@/lib/model";
import { DEFAULT_H2, h2Option } from "@/lib/options";
import { AXIS, Card, Slider, TIP, eur, m, pct } from "./ui";

export function OptimiserCard({ p, s }: { p: Producer; s: Scenario }) {
  const [cap, setCap] = useState(p.euVolume.value);
  const [premium, setPremium] = useState(100);
  const capUsed = Math.min(cap, (p.plants ?? []).reduce((a, x) => a + x.capacity, 0));
  const r = useMemo(() => optimiseAllocation(p, s, { euCap: capUsed, euPremium: premium }), [p, s, capUsed, premium]);
  if (!p.plants?.length) return null;
  const data = r.plants.map((x) => ({
    name: x.name,
    "Pro-rata": +(r.prorata.find((y) => y.name === x.name)!.eu).toFixed(2),
    Optimised: +(r.optimised.find((y) => y.name === x.name)!.eu).toFixed(2),
  }));
  const uplift = r.valueOptimised - r.valueProrata;
  return (
    <Card title={`Trade-allocation optimiser: which plants should serve Europe? (${s.year})`}
      sub="Two markets. EU tonnes earn the EU price premium minus the exporter's share of CBAM, which differs by plant intensity and route. Rest-of-world tonnes earn the base price. Greedy ranking is exactly optimal here.">
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <Slider label="EU volume cap (Mt/yr, within quota)" value={cap} min={0} max={3} step={0.05} fmt={(v) => v.toFixed(2)} onChange={setCap} />
        <Slider label="EU price premium over rest of world (€/t)" value={premium} min={0} max={250} step={5} fmt={(v) => eur(v)} onChange={setPremium} />
      </div>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: 0, right: 12 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="name" tick={{ ...AXIS, fontSize: 11 }} tickLine={false} interval={0} />
            <YAxis tick={AXIS} tickFormatter={(v) => `${v} Mt`} tickLine={false} axisLine={false} />
            <Tooltip {...TIP} formatter={(v: number) => `${v} Mt to EU`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Pro-rata" fill="var(--neutral)" radius={4} isAnimationActive={false} />
            <Bar dataKey="Optimised" fill="var(--s1)" radius={4} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-sm mt-3">
        <thead className="text-left text-ink-3"><tr><th className="py-1 pr-3 font-medium">Plant</th><th className="pr-3 font-medium">tCO₂/t</th><th className="pr-3 font-medium">CBAM €/t</th><th className="pr-3 font-medium">EU net premium €/t</th></tr></thead>
        <tbody>{r.plants.map((x) => <tr key={x.name} className="border-t border-line"><td className="py-1 pr-3">{x.name}</td><td className="pr-3">{x.intensity}</td><td className="pr-3">{eur(x.cbam)}</td><td className={`pr-3 ${x.netPremium < 0 ? "text-s2i" : ""}`}>{eur(x.netPremium)}</td></tr>)}</tbody>
      </table>
      <p className="text-sm mt-3">
        Re-allocating EU tonnes adds <strong>{m(uplift)}/yr</strong> of EBITDA against a capacity-weighted mix
        ({m(r.valueProrata)} → {m(r.valueOptimised)}). {r.plants.every((x) => x.netPremium <= 0) && "At this premium no plant clears its CBAM cost: the EU is not worth serving."}
      </p>
      <p className="text-xs text-ink-3 mt-1">Plant intensities are CCTS baselines × 0.85 (grade D). The model ignores customer qualification and logistics differences between plants.</p>
    </Card>
  );
}

export function H2OptionCard({ s }: { s: Scenario }) {
  const [premium, setPremium] = useState(0);
  const [decline, setDecline] = useState(DEFAULT_H2.h2Decline);
  const [sigma, setSigma] = useState(DEFAULT_H2.sigma);
  const r = useMemo(() => h2Option(s, { ...DEFAULT_H2, greenPremium: premium, h2Decline: decline, sigma }), [s, premium, decline, sigma]);
  const first = r.thresholds.find((t) => t.price !== null);
  return (
    <Card title="Real option: when to build a green H₂-DRI line?"
      sub={`Binomial carbon-price lattice (σ ${pct(sigma)}), an American option to invest in any year 2026–34, and a dedicated EU line. Capex €${DEFAULT_H2.capex}/t; H₂ OPEX premium €${DEFAULT_H2.baseOpex}/t falling with the H₂ cost.`}>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <Slider label="Green premium (€/t steel)" value={premium} min={0} max={300} step={10} fmt={(v) => eur(v)} onChange={setPremium} />
        <Slider label="H₂ cost decline / yr" value={decline} min={0} max={0.15} step={0.01} fmt={pct} onChange={setDecline} />
        <Slider label="Carbon-price volatility" value={sigma} min={0.05} max={0.5} step={0.05} fmt={pct} onChange={setSigma} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        {[
          { k: "NPV if built in 2026", v: eur(r.npvNow) + "/t" },
          { k: "Value of the option to wait", v: eur(r.optionValue) + "/t" },
          { k: "Worth of flexibility", v: eur(r.waitValue) + "/t" },
        ].map((x) => <div key={x.k} className="rounded-lg border border-line p-3"><p className="text-xs text-ink-3">{x.k}</p><p className="text-xl font-semibold">{x.v}</p></div>)}
      </div>
      <p className="text-sm mt-3">
        {first ? <>Earliest optimal build: <strong>{first.year}</strong>, and only if the certificate price is at least <strong>{eur(first.price!)}/t</strong> that year. </> : <>On this lattice it is never optimal to build before 2035. </>}
        Exercise thresholds: {r.thresholds.filter((t) => t.price !== null).map((t) => `${t.year} ≥ ${eur(t.price!)}`).join(" · ") || "none"}.
      </p>
      <p className="text-xs text-ink-3 mt-1">Per tonne of annual capacity. After exercise, prices follow the scenario growth deterministically (a standard simplification). Inputs follow IEA cost ranges (grade D).</p>
    </Card>
  );
}
