import { YEARS, cbamCostPerTonne, priceIn, npv, irr, paybackYears, type Mode, type Regime } from "./cbam";
import { PRODUCTS, INDIRECT_IN_LAW, benchmarkFor, type Producer, type Lever, type Competitor, type Plant } from "./data";

export interface Scenario {
  year: number;
  basePrice: number; // €/tCO2e in 2026
  growth: number; // annual price growth
  passThrough: number; // share of the importer's CBAM cost borne by the Indian exporter
  originCarbonPrice: number; // €/tCO2e effectively paid in India
  regime: Regime;
  fx: number; // ₹ per €
  includeIndirect: boolean; // stress test: indirect (electricity) emissions brought into CBAM scope
}

export const DEFAULT_SCENARIO: Scenario = {
  year: 2026, basePrice: 82.32, growth: 0.03, passThrough: 0.5, originCarbonPrice: 0, regime: "law", fx: 100, includeIndirect: false,
};

export interface CostOpts { year?: number; direct?: number; indirect?: number; price?: number }

// Indirect emissions count when the law says so (cement) or under the stress test. Cement defaults already include them.
function indirectFor(p: Producer, s: Scenario, mode: Mode, override?: number) {
  const inLaw = INDIRECT_IN_LAW[p.sector];
  if (!inLaw && !s.includeIndirect) return 0;
  if (inLaw && mode === "default") return 0;
  return override ?? p.indirect.value;
}

export function producerCost(p: Producer, s: Scenario, mode: Mode, o: CostOpts = {}) {
  const year = o.year ?? s.year;
  return cbamCostPerTonne({
    year, mode,
    defaultValue: PRODUCTS[p.sector].defaultValue.value,
    actual: o.direct ?? p.actualDirect.value,
    indirect: indirectFor(p, s, mode, o.indirect),
    benchmark: benchmarkFor(p),
    price: o.price ?? priceIn(year, s.basePrice, s.growth),
    originCarbonPrice: s.originCarbonPrice,
    regime: s.regime,
  });
}

export function producerSummary(p: Producer, s: Scenario) {
  const def = producerCost(p, s, "default");
  const act = producerCost(p, s, "actual");
  const hitDefault = def.net * s.passThrough; // € / t to the exporter
  const hitActual = act.net * s.passThrough;
  const vol = p.euVolume.value * 1e6;
  return {
    def, act, hitDefault, hitActual,
    marginLeftDefault: (p.ebitdaEUR.value - hitDefault) / p.ebitdaEUR.value,
    marginLeftActual: (p.ebitdaEUR.value - hitActual) / p.ebitdaEUR.value,
    annualDefault: hitDefault * vol, // €
    annualActual: hitActual * vol,
    verificationValue: (def.net - act.net) * vol, // € / yr saved for the EU importer by verified data
  };
}

// Year-by-year path 2026–2034 for one producer (€/t, legal cost before pass-through).
export function trajectory(p: Producer, s: Scenario) {
  return YEARS.map((y) => ({
    year: y,
    default: producerCost(p, s, "default", { year: y }).net,
    actual: producerCost(p, s, "actual", { year: y }).net,
    price: priceIn(y, s.basePrice, s.growth),
  }));
}

// Exporter's 2026–34 cash exposure (€). `prices` overrides the deterministic path (used by the Monte Carlo).
export function cumulativeExposure(p: Producer, s: Scenario, mode: Mode, prices?: number[]) {
  const vol = p.euVolume.value * 1e6;
  return YEARS.reduce((sum, y, i) => sum + producerCost(p, s, mode, { year: y, price: prices?.[i] }).net * s.passThrough * vol, 0);
}

export interface LeverOpts { dedicatedEU: boolean; cctsPrice: number; greenPremium: number; discount: number }

// Lever economics per tonne of capacity the lever applies to. Cash flows: year 0 = capex (2026), years 1..life from 2027.
// The CBAM benefit is the cut in certificates on the EU share of that tonne, capped at the certificates still owed.
export function leverEconomics(p: Producer, l: Lever, s: Scenario, o: LeverOpts) {
  const euShare = o.dedicatedEU ? 1 : Math.min(1, p.euVolume.value / p.production.value);
  const flows = [-l.capex];
  for (let t = 1; t <= l.life; t++) {
    const y = 2026 + t;
    const before = producerCost(p, s, "actual", { year: y });
    const after = producerCost(p, s, "actual", {
      year: y,
      direct: Math.max(0, p.actualDirect.value - l.abatement),
      indirect: Math.max(0, p.indirect.value - l.scope2Cut),
    });
    const cbamSaved = (before.net - after.net) * s.passThrough * euShare;
    const ccts = (l.abatement + l.scope2Cut) * o.cctsPrice;
    const premium = o.greenPremium * l.abatement * euShare; // buyer premium, € per tCO2 avoided on EU tonnes
    flows.push(cbamSaved + ccts + premium - l.opexDelta);
  }
  const annualCost = (l.capex * o.discount) / (1 - Math.pow(1 + o.discount, -l.life)) + l.opexDelta;
  const abated = l.abatement + l.scope2Cut;
  return {
    flows,
    npv: npv(o.discount, flows),
    irr: irr(flows),
    payback: paybackYears(flows),
    mac: abated > 0 ? annualCost / abated : null, // € / tCO2 avoided (excluding CBAM and CCTS revenue)
    cbamRelevant: l.abatement > 0 || ((s.includeIndirect || INDIRECT_IN_LAW[p.sector]) && l.scope2Cut > 0),
  };
}

// Sensitivity: change in cumulative verified exposure when each driver moves ±20% (growth ±2 pp; regime flipped).
export function tornado(p: Producer, s: Scenario) {
  const base = cumulativeExposure(p, s, "actual");
  const run = (pp: Producer, ss: Scenario) => cumulativeExposure(pp, ss, "actual") - base;
  const scaleP = (k: "actualDirect" | "euVolume", f: number): Producer => ({ ...p, [k]: { ...p[k], value: p[k].value * f } });
  const rows = [
    { driver: "Certificate price ±20%", lo: run(p, { ...s, basePrice: s.basePrice * 0.8 }), hi: run(p, { ...s, basePrice: s.basePrice * 1.2 }) },
    { driver: "Price growth ±2 pp/yr", lo: run(p, { ...s, growth: s.growth - 0.02 }), hi: run(p, { ...s, growth: s.growth + 0.02 }) },
    { driver: "Direct intensity ±20%", lo: run(scaleP("actualDirect", 0.8), s), hi: run(scaleP("actualDirect", 1.2), s) },
    { driver: "EU volume ±20%", lo: run(scaleP("euVolume", 0.8), s), hi: run(scaleP("euVolume", 1.2), s) },
    { driver: "Pass-through ±20%", lo: run(p, { ...s, passThrough: s.passThrough * 0.8 }), hi: run(p, { ...s, passThrough: Math.min(1, s.passThrough * 1.2) }) },
    { driver: "Free-allocation path (law ↔ proposal)", lo: run(p, { ...s, regime: "proposal" }), hi: run(p, { ...s, regime: "law" }) },
  ];
  return { base, rows: rows.sort((a, b) => Math.abs(b.hi - b.lo) - Math.abs(a.hi - a.lo)) };
}

// Delivered cost into the EU per tonne: FOB + freight + chargeable tCO2 × price. Linear in price.
export function deliveredCost(c: Competitor, price: number, year: number, regime: Regime) {
  return c.fob + c.freight + cbamCostPerTonne({ year, mode: "actual", defaultValue: 0, actual: c.intensity, benchmark: c.benchmark, price, regime }).net;
}

// Carbon price at which a's delivered cost equals b's (null if parallel or crossing outside 0–1000 €/t).
export function crossoverPrice(a: Competitor, b: Competitor, year: number, regime: Regime): number | null {
  const at0 = deliveredCost(a, 0, year, regime) - deliveredCost(b, 0, year, regime);
  const slope = (deliveredCost(a, 1, year, regime) - deliveredCost(b, 1, year, regime)) - at0;
  if (Math.abs(slope) < 1e-9) return null;
  const p = -at0 / slope;
  return p >= 0 && p <= 1000 ? p : null;
}

// Two-market allocation (EU vs rest of world) across plants under an EU volume cap.
// With linear margins the greedy rank by EU net premium per tonne is exactly optimal.
export interface AllocOpts { euCap: number; euPremium: number } // Mt; € / t EU price premium over rest-of-world
export function plantCbam(p: Producer, pl: Plant, s: Scenario) {
  const b = PRODUCTS.steel.benchmarks;
  return cbamCostPerTonne({
    year: s.year, mode: "actual", defaultValue: 0, actual: pl.intensity,
    benchmark: (1 - pl.driShare) * b[0].value + pl.driShare * b[1].value,
    price: priceIn(s.year, s.basePrice, s.growth), originCarbonPrice: s.originCarbonPrice, regime: s.regime,
  }).net;
}
export function optimiseAllocation(p: Producer, s: Scenario, o: AllocOpts) {
  const plants = (p.plants ?? []).map((pl) => {
    const cbam = plantCbam(p, pl, s);
    return { ...pl, cbam, netPremium: o.euPremium - cbam * s.passThrough };
  });
  const total = plants.reduce((a, x) => a + x.capacity, 0);
  // Pro-rata baseline: the cap spread across plants by capacity, regardless of carbon.
  const prorata = plants.map((x) => ({ name: x.name, eu: total ? (o.euCap * x.capacity) / total : 0 }));
  let left = o.euCap;
  const ranked = [...plants].sort((a, b) => b.netPremium - a.netPremium);
  const opt = new Map<string, number>();
  for (const x of ranked) {
    const take = x.netPremium > 0 ? Math.min(left, x.capacity) : 0;
    opt.set(x.name, take);
    left -= take;
  }
  const value = (alloc: { name: string; eu: number }[]) =>
    alloc.reduce((a, r) => a + r.eu * 1e6 * plants.find((x) => x.name === r.name)!.netPremium, 0);
  const optimised = plants.map((x) => ({ name: x.name, eu: opt.get(x.name) ?? 0 }));
  return { plants, prorata, optimised, valueProrata: value(prorata), valueOptimised: value(optimised) };
}
