// Article 9 policy simulator: how much of CBAM could stay in India if an Indian carbon price is "effectively paid"?
import { YEARS, cbamFactor, defaultMarkup, priceIn } from "./cbam";
import { DOWNSTREAM, PRODUCERS, PRODUCTS, type Sector } from "./data";
import { DEFAULT_SCENARIO, producerCost, type Scenario } from "./model";

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

// Downstream radar rows: annual CBAM on the metal content of each heading, verified vs India's default.
// shortcut: verified intensities (steel 2.2, aluminium 1.8) and BF-BOF / primary benchmarks are grade-D proxies.
export const USD_PER_EUR_DS = 1.08;
export function downstreamRows(year: number, adopted: boolean, s: Scenario = DEFAULT_SCENARIO) {
  const P = priceIn(year, s.basePrice, s.growth), F = cbamFactor(year);
  const certs = (metal: "steel" | "aluminium", mode: "v" | "d") => {
    const b = PRODUCTS[metal].benchmarks[0].value;
    const e = mode === "v" ? (metal === "steel" ? 2.2 : 1.8) : PRODUCTS[metal].defaultValue.value * (1 + defaultMarkup(year));
    return Math.max(0, e - F * b);
  };
  return DOWNSTREAM.map((d) => {
    const live = d.status === "inScope" || (adopted && year >= 2028);
    const t = d.kt * 1e3 * d.metalShare;
    const v = live ? t * certs(d.metal, "v") * P : 0, df = live ? t * certs(d.metal, "d") * P : 0;
    return { ...d, live, v, df, pctValue: d.usdM ? df / USD_PER_EUR_DS / (d.usdM * 1e6) : 0 };
  }).sort((a, b) => b.usdM - a.usdM);
}

// MSME clusters ranked by annual CBAM on defaults. shortcut: a heading's cost is split equally across the clusters it lists.
export function clusterExposure(rows: ReturnType<typeof downstreamRows>) {
  const m = new Map<string, { cluster: string; inScope: number; proposed: number; headings: string[] }>();
  for (const r of rows) {
    const cs = r.cluster.split(",").map((c) => c.trim()).filter(Boolean);
    for (const c of cs) {
      const e = m.get(c) ?? { cluster: c, inScope: 0, proposed: 0, headings: [] };
      e[r.status === "inScope" ? "inScope" : "proposed"] += r.df / cs.length;
      e.headings.push(r.hs);
      m.set(c, e);
    }
  }
  return [...m.values()].sort((a, b) => b.inScope + b.proposed - (a.inScope + a.proposed));
}

// Three Article 9 designs side by side at one price and evidence share.
export function policyOptions(price = 20, qualifying = 0.6, s: Scenario = DEFAULT_SCENARIO) {
  const sum = (o: PolicyOpts) => article9(s, "steel", o).reduce((a, r) => ({ kept: a.kept + r.retained, toEU: a.toEU + r.toEU }), { kept: 0, toEU: 0 });
  const none = sum({ price: 0, mechanism: "explicit", targetCut: 0.05, qualifying });
  return [
    { id: "none", ...none },
    { id: "ccts", ...sum({ price, mechanism: "ccts", targetCut: 0.05, qualifying }) },
    { id: "explicit", ...sum({ price, mechanism: "explicit", targetCut: 0.05, qualifying }) },
  ];
}
