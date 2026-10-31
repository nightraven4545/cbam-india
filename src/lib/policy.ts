// Article 9 policy simulator: how much of CBAM could stay in India if an Indian carbon price is "effectively paid"?
import { YEARS } from "./cbam";
import { PRODUCERS, type Sector } from "./data";
import { producerCost, type Scenario } from "./model";

// EU imports from India, Mt (Eurostat 2025 via cbamguide.com): used to scale modelled producers to the sector.
export const SECTOR_EU_MT: Record<Sector, number> = { steel: 4.01, aluminium: 0.313, cement: 0.001 };

export type Mechanism = "ccts" | "explicit";
export interface PolicyOpts {
  price: number; // € / tCO2e (CCC price, or explicit carbon price)
  mechanism: Mechanism; // ccts: only tonnes above the intensity target pay; explicit: every embedded tonne pays
  targetCut: number; // CCTS target as a fractional cut below current intensity (e.g. 0.05)
  qualifying: number; // share of exports with MRV + evidence accepted by the EU (0–1)
}

// € per tonne of product effectively paid in India.
export function paidPerTonne(intensity: number, o: PolicyOpts) {
  return o.price * (o.mechanism === "explicit" ? intensity : intensity * o.targetCut);
}

export function article9(s: Scenario, sector: Sector, o: PolicyOpts) {
  const ps = PRODUCERS.filter((p) => p.sector === sector);
  const scale = SECTOR_EU_MT[sector] / ps.reduce((a, p) => a + p.euVolume.value, 0);
  const base = { ...s, originCarbonPrice: 0 };
  return YEARS.map((year) => {
    let toEU = 0, retained = 0;
    for (const p of ps) {
      const gross = producerCost(p, base, "actual", { year }).net;
      const credit = Math.min(gross, paidPerTonne(p.actualDirect.value, o)) * o.qualifying;
      const vol = p.euVolume.value * scale * 1e6;
      toEU += (gross - credit) * vol;
      retained += credit * vol;
    }
    return { year, toEU, retained };
  });
}

// Downstream / MSME: CBAM € per unit of a metal-containing product.
export function downstreamCostPerUnit(weightKg: number, metalShare: number, certsPerTonneMetal: number, price: number) {
  return (weightKg / 1000) * metalShare * certsPerTonneMetal * price;
}
