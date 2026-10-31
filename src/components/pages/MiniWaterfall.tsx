"use client";

import { Waterfall, type WStep } from "@/components/consulting/charts";

export default function MiniWaterfall({ steps, height }: { steps: WStep[]; height?: number }) {
  return <Waterfall steps={steps.map((s) => ({ ...s, value: s.value / 1e6 }))} height={height} />;
}
