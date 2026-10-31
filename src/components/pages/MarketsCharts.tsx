"use client";

import { CartesianGrid, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { AXIS, TIP } from "@/components/consulting/charts";

const KIND_C: Record<string, string> = { Compliance: "var(--s1)", Tax: "var(--s3)", Offset: "var(--s2)" };

export function Landscape({ points }: { points: { name: string; x: number; y: number; kind: string }[] }) {
  const data = points.map((p) => ({ ...p, lx: Math.log10(p.x) }));
  return (
    <div>
      <div className="h-[360px]">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 16, right: 40, bottom: 28, left: 4 }}>
            <CartesianGrid stroke="var(--line)" />
            <XAxis type="number" dataKey="lx" domain={[1.4, 4.1]} ticks={[1.5, 2, 2.5, 3, 3.5, 4]} tickFormatter={(v) => Math.round(Math.pow(10, v)).toLocaleString("en-IN")} tick={AXIS} tickLine={false}
              label={{ value: "Emissions covered, MtCO₂ (log)", position: "bottom", offset: 8, fill: "var(--ink-2)", fontSize: 12 }} />
            <YAxis type="number" dataKey="y" domain={[0, 90]} tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} />
            <ReferenceLine y={82.32} stroke="var(--s2)" strokeDasharray="4 4" label={{ value: "CBAM Q3 2026 €82.32", position: "insideTopRight", fill: "var(--ink-2)", fontSize: 11 }} />
            <Tooltip {...TIP} content={({ payload }) => { const p = payload?.[0]?.payload; return p ? <div style={TIP.contentStyle} className="px-3 py-2"><p className="font-medium">{p.name}</p><p className="text-ink-2">{p.kind} · ~{p.x.toLocaleString("en-IN")} Mt · ~€{p.y}/t</p></div> : null; }} />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((p) => <Cell key={p.name} fill={KIND_C[p.kind]} stroke="var(--surface)" strokeWidth={2} />)}
              <LabelList dataKey="name" content={(lp) => { const { x, y, value } = lp as { x: number; y: number; value: string }; return <text x={Number(x) + 12} y={Number(y)} dy={4} fontSize={12} fill="var(--ink)">{value}</text>; }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="flex flex-wrap gap-4 text-xs text-ink-2 mt-2">
        {Object.entries(KIND_C).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{k}</span>)}
      </p>
    </div>
  );
}

export function EtsHistory({ data }: { data: { year: number; price: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="year" tick={AXIS} tickLine={false} />
          <YAxis tick={AXIS} tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip {...TIP} formatter={(v: number) => `€${v}/t`} />
          <ReferenceLine x={2026} stroke="var(--ink)" strokeDasharray="4 3" label={{ value: "CBAM payable", position: "left", fill: "var(--ink)", fontSize: 11 }} />
          <Line dataKey="price" stroke="var(--s1)" strokeWidth={2} dot={{ r: 4, fill: "var(--s1)" }} isAnimationActive={false}>
            <LabelList dataKey="price" position="top" formatter={(v: number) => `€${Math.round(v)}`} style={{ fill: "var(--ink-2)", fontSize: 11 }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const EVENTS: { when: string; t: string; law: boolean }[] = [
  { when: "Oct 2023", t: "Transitional phase: reporting only", law: true },
  { when: "Jan 2026", t: "Definitive regime: certificates payable; defaults +10%", law: true },
  { when: "Feb 2027", t: "Certificate sales open; weekly prices; defaults +20%", law: true },
  { when: "Sep 2027", t: "First annual declaration (2026 imports) due", law: true },
  { when: "2028", t: "Default mark-up reaches 30%", law: true },
  { when: "2028", t: "Downstream extension to ~180+ steel and aluminium goods", law: false },
  { when: "2028", t: "COM(2026) 616: 15% of phased-out free allocation returned", law: false },
  { when: "2030", t: "Free allocation 77.5% → 51.5%: the cash cliff", law: true },
  { when: "2034", t: "Free allocation reaches 0%", law: true },
  { when: "2038", t: "End of phase-out under the proposal", law: false },
];
export function CbamTimeline() {
  return (
    <ol className="relative ml-2 border-l border-line">
      {EVENTS.map((e, i) => (
        <li key={i} className="relative pl-5 pb-3 last:pb-0">
          <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${e.law ? "bg-s1" : "bg-surface border-2 border-s2"}`} aria-hidden />
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="w-16 shrink-0 text-sm font-medium tabular-nums">{e.when}</span>
            <span className="text-sm text-ink-2 flex-1 min-w-[12rem]">{e.t}</span>
            <span className={`text-[11px] rounded-md border px-1.5 ${e.law ? "border-s1 text-s1" : "border-s2 text-s2"}`}>{e.law ? "Law" : "Proposal"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
