"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, TIP } from "@/components/consulting/charts";

export interface PathSeries { id: string; name: string; color: string; points: { year: number; reported?: number; target?: number }[] }

// Reported intensity (solid) and the straight-line path implied by each target (dashed), against India's green-steel line.
export default function PathwayChart({ series, green }: { series: PathSeries[]; green: number }) {
  const years = [...new Set(series.flatMap((s) => s.points.map((p) => p.year)))].sort((a, b) => a - b);
  const data = years.map((y) => {
    const row: Record<string, number> = { year: y };
    for (const s of series) {
      const p = s.points.find((q) => q.year === y);
      if (p?.reported !== undefined) row[`${s.id}_r`] = p.reported;
      if (p?.target !== undefined) row[`${s.id}_t`] = +p.target.toFixed(3);
    }
    return row;
  });
  return (
    <div>
      <div className="h-[340px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} tick={AXIS} tickLine={false} ticks={[2005, 2015, 2025, 2030, 2040, 2050]} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 3.5]} ticks={[0, 1, 2, 3]} tickFormatter={(v) => `${v} t`} />
            <ReferenceArea y1={0} y2={green} fill="var(--s3)" fillOpacity={0.07} />
            <ReferenceLine y={green} stroke="var(--s3)" strokeDasharray="4 4" label={{ value: `Green steel < ${green} t (India taxonomy)`, position: "insideTopRight", fill: "var(--ink-2)", fontSize: 11 }} />
            <ReferenceLine x={2030} stroke="var(--ink-3)" strokeDasharray="2 3" />
            <Tooltip {...TIP} labelFormatter={(v) => `FY${v}`} formatter={(v: number, k: string) => [`${v.toFixed(2)} tCO₂/tcs`, `${series.find((s) => k.startsWith(s.id))?.name} · ${k.endsWith("_r") ? "reported" : "target path"}`]} />
            {series.map((s) => [
              <Line key={`${s.id}r`} dataKey={`${s.id}_r`} stroke={s.color} strokeWidth={2.5} dot={{ r: 3 }} connectNulls isAnimationActive={false} />,
              <Line key={`${s.id}t`} dataKey={`${s.id}_t`} stroke={s.color} strokeWidth={1.75} strokeDasharray="6 4" dot={false} connectNulls isAnimationActive={false} />,
            ])}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2 mt-1" aria-label="Legend">
        {series.map((s) => <li key={s.id} className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block h-0.5 w-5" style={{ background: s.color }} />{s.name}</li>)}
        <li className="inline-flex items-center gap-1.5"><svg aria-hidden width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="var(--ink-2)" strokeWidth="2" /></svg>reported</li>
        <li className="inline-flex items-center gap-1.5"><svg aria-hidden width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="var(--ink-2)" strokeWidth="2" strokeDasharray="5 3" /></svg>straight line to 2030 target and net zero</li>
      </ul>
    </div>
  );
}
