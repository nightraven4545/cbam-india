"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import { AXIS, TIP, Matrix2x2, SankeyChart, type MPoint, type SNode } from "@/components/consulting/charts";

export function Flows({ nodes, links }: { nodes: SNode[]; links: { source: number; target: number; value: number }[] }) {
  return <SankeyChart nodes={nodes} links={links} height={420} fmt={(v) => `${Math.round(v)} kt`} />;
}

export function ExposureMatrix({ points, xMid, yMid }: { points: MPoint[]; xMid: number; yMid: number }) {
  return (
    <Matrix2x2 points={points} xMid={xMid} yMid={yMid} height={420} zRange={[200, 1600]}
      xLabel="2030 CBAM cost, verified, €/t" yLabel="EBITDA on EU sales, €/t"
      xFmt={(v) => `€${Math.round(v)}`} yFmt={(v) => `€${Math.round(v)}`}
      quadrants={["Advantaged: hold share", "Exposed but able: invest to defend", "Thin margin: watch", "Most at risk: reposition or exit EU"]} />
  );
}

export function RouteMix({ data }: { data: { name: string; "BF-BOF": number; "DRI-EAF": number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" tick={AXIS} tickFormatter={(v) => `${Math.round(v * 100)}%`} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={AXIS} width={130} tickLine={false} />
          <Tooltip {...TIP} formatter={(v: number) => `${Math.round(v * 100)}%`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="BF-BOF" stackId="r" fill="var(--neutral)" isAnimationActive={false} />
          <Bar dataKey="DRI-EAF" stackId="r" fill="var(--s1)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gap above free allocation: verified intensity vs what the benchmark covers in 2026 and 2030.
export function GapChart({ data }: { data: { name: string; covered2026: number; gap2026: number; covered2030: number; gap2030: number }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["2026", "2030"] as const).map((y) => (
        <div key={y}>
          <p className="text-sm font-medium mb-2">{y}: tCO₂ per tonne, covered by free allocation vs charged</p>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
                <CartesianGrid horizontal={false} stroke="var(--line)" />
                <XAxis type="number" tick={AXIS} domain={[0, 3]} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={AXIS} width={130} tickLine={false} />
                <Tooltip {...TIP} formatter={(v: number) => `${v.toFixed(2)} t`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={`covered${y}`} name="Covered (free)" stackId="g" fill="var(--neutral)" isAnimationActive={false} />
                <Bar dataKey={`gap${y}`} name="Charged" stackId="g" fill="var(--s2)" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey={`gap${y}`} position="right" formatter={(v: number) => v.toFixed(2)} style={{ fill: "var(--ink-2)", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Spark({ data }: { data: { year: number; actual: number }[] }) {
  return (
    <div className="h-12" aria-hidden>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
          <YAxis hide domain={[0, 320]} />
          <Line dataKey="actual" stroke="var(--s2)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Footprint({ data }: { data: { name: string; charged: number; uncharged: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" tick={AXIS} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={AXIS} width={140} tickLine={false} />
          <Tooltip {...TIP} formatter={(v: number) => `${v.toFixed(2)} tCO₂/t`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="charged" name="Charged by CBAM today" stackId="f" fill="var(--s2)" isAnimationActive={false} />
          <Bar dataKey="uncharged" name="Not charged (electricity)" stackId="f" fill="var(--neutral)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
