"use client";

import { Gauge, Landmark, Recycle, Route, ShieldCheck, TriangleAlert, Euro } from "lucide-react";
import { Waterfall, type WStep } from "@/components/consulting/charts";

// One icon per value-at-stake step (labels come from roadmap.ts valueAtStake).
const ICONS = {
  "Do nothing (EU defaults)": TriangleAlert, "Verify emissions": ShieldCheck, "Efficiency stack": Gauge, "Scrap + biochar": Recycle,
  "Route low-carbon plants to EU": Route, "Art. 9: pay in India": Landmark, "Residual paid to EU": Euro,
};

export default function MiniWaterfall({ steps, height }: { steps: WStep[]; height?: number }) {
  return <Waterfall steps={steps.map((s) => ({ ...s, value: s.value / 1e6 }))} height={height} icons={ICONS} />;
}
