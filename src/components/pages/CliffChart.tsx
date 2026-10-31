"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, TIP } from "@/components/consulting/charts";

// Five producers, so five fills: the validated categorical order (blue, orange, aqua, yellow, magenta).
const FILLS = ["#2a78d6", "#e8590c", "#1baf7a", "#eda100", "#e87ba4"];

export default function CliffChart({ verified, defaults, names }: { verified: Record<string, number>[]; defaults: Record<string, number>[]; names: string[] }) {
  const [mode, setMode] = useState<"default" | "actual">("actual");
  const data = mode === "default" ? defaults : verified;
  return (
    <div>
      <div className="inline-flex rounded-md border border-line p-0.5 text-sm mb-3" role="group" aria-label="Emissions data basis">
        {(["actual", "default"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}
            className={`rounded-[5px] px-3 py-1 ${mode === k ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}>
            {k === "default" ? "Unverified (EU default values)" : "Verified emissions data"}
          </button>
        ))}
      </div>
      <div className="h-[340px] sm:h-[400px]">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="year" tick={AXIS} tickLine={false} />
            <YAxis tick={AXIS} tickFormatter={(v) => `€${v}m`} tickLine={false} axisLine={false} width={64} />
            <Tooltip {...TIP} formatter={(v: number, n: string) => [`€${v.toLocaleString("en-IN")}m`, n]} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: "var(--ink-2)" }}>{v}</span>} />
            <ReferenceLine x={2030} stroke="var(--ink)" strokeDasharray="4 3" label={{ value: "2030: free allocation 77.5% → 51.5%", position: "insideTopLeft", fill: "var(--ink)", fontSize: 12 }} />
            {names.map((n, i) => (
              <Area key={n} type="monotone" dataKey={n} stackId="1" stroke={FILLS[i]} strokeWidth={0.5} fill={FILLS[i]} fillOpacity={0.9} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
