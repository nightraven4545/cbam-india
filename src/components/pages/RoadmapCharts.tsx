"use client";

import { Matrix2x2, type MPoint } from "@/components/consulting/charts";

// Impact is plotted on a log10 scale so the €bn verification lever and €m levers share one chart.
export function Prioritisation({ points }: { points: MPoint[] }) {
  return (
    <Matrix2x2 points={points} labelKey="label" xMid={3} yMid={Math.log10(300)} height={460} zRange={[160, 160]}
      xLabel="Ease of implementation (1 hard – 5 easy)" yLabel="2026–34 value, € m (log scale)"
      xFmt={(v) => v.toFixed(1)} yFmt={(v) => `€${Math.round(Math.pow(10, v)).toLocaleString("en-IN")}m`}
      quadrants={["Big bets: plan and stage", "Quick wins: do now", "Deprioritise", "Easy fillers: bundle"]} />
  );
}
