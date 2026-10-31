"use client";

import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ReferenceLine, ResponsiveContainer, Sankey, Scatter, ScatterChart,
  Tooltip, Treemap, XAxis, YAxis, ZAxis, Layer, Rectangle,
} from "recharts";

export const AXIS = { stroke: "var(--ink-3)", fontSize: 12 };
export const TIP = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", fontSize: 12 },
  labelStyle: { color: "var(--ink)", fontWeight: 500 },
  itemStyle: { color: "var(--ink-2)" },
  cursor: { fill: "var(--sunken)" },
};
const fmtM = (n: number) => `${n < 0 ? "−" : ""}€${Math.abs(Math.round(n)).toLocaleString("en-IN")}m`;

// Waterfall: first and last steps are totals, the rest are signed deltas. Direct labels on every bar.
export interface WStep { label: string; value: number; total?: boolean }
export function Waterfall({ steps, height = 320, fmt = fmtM }: { steps: WStep[]; height?: number; fmt?: (n: number) => string }) {
  let run = 0;
  const data = steps.map((s) => {
    if (s.total) { run = s.value; return { ...s, range: [Math.min(0, s.value), Math.max(0, s.value)], kind: "total" }; }
    const from = run; run += s.value;
    return { ...s, range: [Math.min(from, run), Math.max(from, run)], kind: s.value < 0 ? "down" : "up" };
  });
  const color = (k: string) => (k === "total" ? "var(--neutral)" : k === "down" ? "var(--s3)" : "var(--s2)");
  return (
    <div tabIndex={0} className="overflow-x-auto">
    <div style={{ height }} className="min-w-[640px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 24, left: 4, right: 8, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="label" tick={{ ...AXIS, fontSize: 11 }} interval={0} height={56} tickLine={false} />
          <YAxis tick={AXIS} tickFormatter={(v) => fmt(v)} tickLine={false} axisLine={false} width={72} />
          <ReferenceLine y={0} stroke="var(--ink-3)" />
          <Tooltip {...TIP} formatter={(_v, _n, p) => fmt((p.payload as WStep).value)} />
          <Bar dataKey="range" radius={4} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.label} fill={color(d.kind)} />)}
            <LabelList dataKey="value" position="top" formatter={(v: number) => fmt(v)} style={{ fill: "var(--ink-2)", fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}

// 2×2 matrix: bubble scatter with labelled quadrants and direct point labels.
export interface MPoint { name: string; x: number; y: number; z: number; tone?: "s1" | "s2" | "s3" | "neutral"; label?: string }
export function Matrix2x2({ points, xLabel, yLabel, xMid, yMid, quadrants, xFmt = String, yFmt = String, height = 380, zRange = [80, 900], labelKey = "name" }: {
  points: MPoint[]; xLabel: string; yLabel: string; xMid: number; yMid: number;
  quadrants: [string, string, string, string]; // top-left, top-right, bottom-left, bottom-right
  xFmt?: (n: number) => string; yFmt?: (n: number) => string; height?: number; zRange?: [number, number]; labelKey?: "name" | "label";
}) {
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const pad = (a: number[], f = 0.15) => { const lo = Math.min(...a), hi = Math.max(...a); const d = (hi - lo || 1) * f; return [lo - d, hi + d] as [number, number]; };
  const [x0, x1] = pad([...xs, xMid]), [y0, y1] = pad([...ys, yMid]);
  const q = { fill: "var(--ink-3)", fontSize: 12 };
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 8 }}>
          <CartesianGrid stroke="var(--line)" />
          <ReferenceArea x1={x0} x2={xMid} y1={yMid} y2={y1} fill="var(--sunken)" fillOpacity={0.5} label={{ value: quadrants[0], position: "insideTopLeft", ...q }} />
          <ReferenceArea x1={xMid} x2={x1} y1={yMid} y2={y1} fill="transparent" label={{ value: quadrants[1], position: "insideTopRight", ...q }} />
          <ReferenceArea x1={x0} x2={xMid} y1={y0} y2={yMid} fill="transparent" label={{ value: quadrants[2], position: "insideBottomLeft", ...q }} />
          <ReferenceArea x1={xMid} x2={x1} y1={y0} y2={yMid} fill="var(--sunken)" fillOpacity={0.5} label={{ value: quadrants[3], position: "insideBottomRight", ...q }} />
          <XAxis type="number" dataKey="x" domain={[x0, x1]} tick={AXIS} tickFormatter={xFmt} tickLine={false}
            label={{ value: xLabel, position: "bottom", offset: 8, fill: "var(--ink-2)", fontSize: 12 }} />
          <YAxis type="number" dataKey="y" domain={[y0, y1]} tick={AXIS} tickFormatter={yFmt} tickLine={false} axisLine={false}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--ink-2)", fontSize: 12, dy: 60 }} />
          <ZAxis type="number" dataKey="z" range={zRange} />
          <ReferenceLine x={xMid} stroke="var(--ink-3)" strokeDasharray="4 4" />
          <ReferenceLine y={yMid} stroke="var(--ink-3)" strokeDasharray="4 4" />
          <Tooltip {...TIP} cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as MPoint | undefined;
              return p ? <div style={TIP.contentStyle} className="px-3 py-2"><p className="font-medium">{p.name}</p><p className="text-ink-2">{xLabel}: {xFmt(p.x)}</p><p className="text-ink-2">{yLabel}: {yFmt(p.y)}</p></div> : null;
            }} />
          <Scatter data={points} isAnimationActive={false}
            shape={(sp: { cx?: number; cy?: number; size?: number; payload?: MPoint }) => (
              <><title>{sp.payload?.name}</title>
                <circle cx={sp.cx} cy={sp.cy} r={Math.sqrt((sp.size ?? 64) / Math.PI)} fill={`var(--${sp.payload?.tone ?? "s1"})`} fillOpacity={0.85} stroke="var(--surface)" strokeWidth={2} /></>
            )}>
            <LabelList dataKey={labelKey} content={(lp) => {
              const { x, y, value } = lp as { x: number; y: number; value: string };
              return <text x={Number(x) + 14} y={Number(y)} dy={4} fontSize={12} fontWeight={500} fill="var(--ink)">{value}</text>;
            }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sankey with coloured nodes and outside labels.
export interface SNode { name: string; color?: string }
export function SankeyChart({ nodes, links, height = 380, fmt = (v: number) => v.toLocaleString("en-IN") }: {
  nodes: SNode[]; links: { source: number; target: number; value: number }[]; height?: number; fmt?: (v: number) => string;
}) {
  const NodeShape = (props: { x: number; y: number; width: number; height: number; index: number; payload: SNode & { value: number; depth: number } }) => {
    const { x, y, width, height: h, payload } = props;
    const left = payload.depth === 0;
    return (
      <Layer>
        <Rectangle x={x} y={y} width={width} height={h} fill={payload.color ?? "var(--ink-2)"} radius={2} />
        <text x={left ? x - 8 : x + width + 8} y={y + h / 2} textAnchor={left ? "end" : "start"} dominantBaseline="middle" fontSize={12} fill="var(--ink)">
          {payload.name}
          <tspan fill="var(--ink-3)"> {fmt(payload.value)}</tspan>
        </text>
      </Layer>
    );
  };
  return (
    <div tabIndex={0} className="overflow-x-auto">
    <div style={{ height }} className="min-w-[680px]">
      <ResponsiveContainer>
        <Sankey data={{ nodes, links }} nodePadding={18} nodeWidth={12} margin={{ left: 150, right: 190, top: 8, bottom: 8 }}
          link={{ stroke: "var(--s1)", strokeOpacity: 0.22 }} node={NodeShape as never} iterations={64}>
          <Tooltip {...TIP} formatter={(v: number) => fmt(v)} />
        </Sankey>
      </ResponsiveContainer>
    </div>
    </div>
  );
}

// Treemap with category colouring and in-cell labels where they fit.
export interface TItem { name: string; size: number; color: string; sub?: string }
export function TreemapChart({ items, height = 360, fmt = (v: number) => String(v) }: { items: TItem[]; height?: number; fmt?: (v: number) => string }) {
  const Cellx = (p: { x: number; y: number; width: number; height: number; name: string; size: number; color: string; sub?: string }) => (
    <g>
      <rect x={p.x} y={p.y} width={p.width} height={p.height} fill={p.color} stroke="var(--surface)" strokeWidth={2} rx={3} />
      {p.width > 70 && p.height > 34 && (
        <text x={p.x + 8} y={p.y + 18} fontSize={12} fill="#fff" fontWeight={500}>{p.name}</text>
      )}
      {p.width > 70 && p.height > 52 && (
        <text x={p.x + 8} y={p.y + 34} fontSize={11} fill="#fff" fillOpacity={0.85}>{fmt(p.size)}{p.sub ? ` · ${p.sub}` : ""}</text>
      )}
    </g>
  );
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <Treemap data={items} dataKey="size" isAnimationActive={false} content={<Cellx x={0} y={0} width={0} height={0} name="" size={0} color="" />}>
          <Tooltip {...TIP} formatter={(v: number) => fmt(v)} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

// Gantt: rows of bars over a week grid, with milestone diamonds.
export interface GRow { stream: string; task: string; start: number; end: number; milestone?: string }
export function Gantt({ rows, weeks }: { rows: GRow[]; weeks: number }) {
  return (
    <div tabIndex={0} className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid text-xs text-ink-3 border-b border-line pb-1" style={{ gridTemplateColumns: `220px repeat(${weeks}, 1fr)` }}>
          <span>Workstream · activity</span>
          {Array.from({ length: weeks }, (_, i) => <span key={i} className="text-center">Week {i + 1}</span>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid items-center border-b border-line/70 py-1.5" style={{ gridTemplateColumns: `220px repeat(${weeks}, 1fr)` }}>
            <span className="text-sm pr-3"><span className="text-ink-3">{r.stream}</span><br />{r.task}</span>
            <div className="relative h-6" style={{ gridColumn: `2 / span ${weeks}` }}>
              {Array.from({ length: weeks - 1 }, (_, k) => <span key={k} className="absolute top-0 bottom-0 w-px bg-line/70" style={{ left: `${((k + 1) / weeks) * 100}%` }} />)}
              <span className="absolute top-1 h-4 rounded-[4px] bg-s1/85" style={{ left: `${((r.start - 1) / weeks) * 100}%`, width: `${((r.end - r.start + 1) / weeks) * 100}%` }} />
              {r.milestone && (
                r.end >= weeks ? (
                  <span className="absolute -top-0.5 text-[11px] text-ink whitespace-nowrap flex items-center gap-1" style={{ right: 0 }}>
                    <span className="bg-surface px-1">{r.milestone}</span><span className="inline-block h-3 w-3 rotate-45 bg-s2" aria-hidden />
                  </span>
                ) : (
                  <span className="absolute -top-0.5 text-[11px] text-ink whitespace-nowrap flex items-center gap-1" style={{ left: `calc(${(r.end / weeks) * 100}% - 7px)` }}>
                    <span className="inline-block h-3 w-3 rotate-45 bg-s2" aria-hidden />{r.milestone}
                  </span>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Issue tree: key question → branches → sub-questions → analyses, collapsible.
export interface INode { id: string; q: string; status?: "answered" | "partly" | "open"; finding?: string; href?: string; children?: INode[] }
const STATUS: Record<string, string> = { answered: "Answered", partly: "Partly answered", open: "Open" };
const STATUS_C: Record<string, string> = { answered: "border-s3 text-s3i", partly: "border-s2 text-s2i", open: "border-line text-ink-3" };
export function IssueTree({ root }: { root: INode }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries((root.children ?? []).map((c) => [c.id, true])));
  const node = (n: INode, depth: number) => {
    const has = !!n.children?.length;
    const isOpen = open[n.id] ?? false;
    return (
      <li key={n.id} className="relative">
        <div className={`flex items-start gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 ${depth === 1 ? "border-l-4 border-l-ink" : ""}`}>
          {has ? (
            <button type="button" aria-expanded={isOpen} aria-label={isOpen ? "Collapse" : "Expand"} onClick={() => setOpen((o) => ({ ...o, [n.id]: !isOpen }))}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border border-line text-ink-2 text-xs leading-none">{isOpen ? "−" : "+"}</button>
          ) : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />}
          <div className="min-w-0 flex-1">
            <p className={depth === 1 ? "font-semibold" : "text-sm"}>{n.q}</p>
            {n.finding && <p className="text-sm text-ink-2 mt-1">{n.finding}</p>}
            {n.href && <a href={n.href} className="text-xs text-s1i underline underline-offset-2 mt-1 inline-block">See the analysis</a>}
          </div>
          {n.status && <span className={`shrink-0 text-[11px] rounded-md border px-1.5 py-0.5 ${STATUS_C[n.status]}`}>{STATUS[n.status]}</span>}
        </div>
        {has && isOpen && (
          <ul className="mt-2 ml-4 pl-4 border-l border-line space-y-2">{n.children!.map((c) => node(c, depth + 1))}</ul>
        )}
      </li>
    );
  };
  return (
    <div>
      <div className="rounded-lg bg-ink text-bg px-4 py-3 mb-3">
        <p className="text-xs opacity-70">Key question</p>
        <p className="font-cond text-lg font-semibold leading-snug">{root.q}</p>
      </div>
      <ul className="space-y-2">{root.children?.map((c) => node(c, 1))}</ul>
    </div>
  );
}

// Simple horizontal bar list with direct labels (used for small rankings).
export function BarList({ items, fmt = String, max }: { items: { label: string; value: number; color?: string; note?: string }[]; fmt?: (n: number) => string; max?: number }) {
  const m = max ?? Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(110px,180px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate" title={i.label}>{i.label}</span>
          <span className="h-3 rounded-[3px] bg-sunken overflow-hidden"><span className="block h-full rounded-[3px]" style={{ width: `${(Math.abs(i.value) / m) * 100}%`, background: i.color ?? "var(--s1)" }} /></span>
          <span className="tabular-nums text-ink-2">{fmt(i.value)}</span>
        </li>
      ))}
    </ul>
  );
}

// Y-axis tick with a country flag before the label (for category axes).
import { Flag, type FlagCode } from "@/components/visual/indicators";
export function FlagTick(props: { x?: number; y?: number; payload?: { value: string }; flags: Record<string, FlagCode>; width?: number }) {
  const { x = 0, y = 0, payload, flags } = props;
  const label = payload?.value ?? "";
  const code = flags[label];
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={code ? -24 : -4} y={0} dy={4} textAnchor="end" fontSize={11} fill="var(--ink-3)">{label}</text>
      {code && <foreignObject x={-20} y={-7} width={18} height={14}><Flag code={code} size={12} /></foreignObject>}
    </g>
  );
}
