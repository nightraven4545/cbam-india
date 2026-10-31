// Data behind the consultant exhibits (Mekko, MACC, driver tree, Harvey assessment, football field, scorecard).
// Pure functions on top of the engine: every number shown is computed, nothing typed by hand.
import { cbamCostPerTonne, cbamFactor, priceIn, YEARS } from "./cbam";
import { COMPETITORS, LEVERS, PRODUCERS, benchmarkFor, type Lever, type Producer } from "./data";
import { DEFAULT_SCENARIO, leverEconomics, producerCost, producerSummary, trajectory, type LeverOpts, type Scenario } from "./model";

type Flag = "IN" | "TR" | "KR";

// EU flat-steel imports by origin, 2025 (EUROFER European Steel in Figures 2026, via cbam.clarion.engineer). Grade C.
// Default values: Commission defaults per country (Türkiye has no 7208 value; its bars/rods default is used as a proxy, grade D).
export const EU_FLAT_IMPORTS_2025 = {
  totalMt: 23.1,
  source: "EUROFER European Steel in Figures 2026 (flat products), via cbam.clarion.engineer, 2025",
  origins: [
    { flag: "TR" as Flag, name: "Türkiye", mt: 3.28, defaultValue: 2.31, defaultNote: "bars/rods default used as proxy", comp: "Türkiye · EAF-heavy" },
    { flag: "KR" as Flag, name: "South Korea", mt: 3.24, defaultValue: 2.118, defaultNote: "HR flat default", comp: "South Korea · BF-BOF" },
    { flag: "IN" as Flag, name: "India", mt: 2.26, defaultValue: 4.28, defaultNote: "HR flat default", comp: "India · verified BF-BOF" },
  ],
};

export interface MekkoCol { name: string; flag?: Flag; mt: number; share: number; x0: number; verified: number | null; penalty: number | null; note: string }

// Width = share of EU flat-steel imports; height = CBAM €/t in `year`, split into the verified cost and the extra paid on defaults.
export function mekko(year = 2030, s: Scenario = DEFAULT_SCENARIO): MekkoCol[] {
  const price = priceIn(year, s.basePrice, s.growth);
  const { totalMt, origins } = EU_FLAT_IMPORTS_2025;
  let x0 = 0;
  const cols: MekkoCol[] = origins.map((o) => {
    const c = COMPETITORS.find((k) => k.origin === o.comp)!;
    const base = { year, price, benchmark: c.benchmark, regime: s.regime, defaultValue: o.defaultValue, actual: c.intensity };
    const verified = cbamCostPerTonne({ ...base, mode: "actual" }).net;
    const onDefault = cbamCostPerTonne({ ...base, mode: "default" }).net;
    const col = { name: o.name, flag: o.flag, mt: o.mt, share: o.mt / totalMt, x0, verified, penalty: Math.max(0, onDefault - verified), note: o.defaultNote };
    x0 += col.share;
    return col;
  });
  const otherMt = totalMt - origins.reduce((a, o) => a + o.mt, 0);
  cols.push({ name: "Other origins", mt: otherMt, share: otherMt / totalMt, x0, verified: null, penalty: null, note: "China, Taiwan, Vietnam, Japan and others: origin split not published" });
  return cols;
}

// True MACC: one block per lever, width = tCO₂ abated per year on the producer's EU-bound tonnes, height = € per tCO₂.
export interface MaccBar { id: string; name: string; widthMt: number; x0: number; mac: number; cbamRelevant: boolean }
export function macc(p: Producer, s: Scenario, o: LeverOpts) {
  const bars = LEVERS.filter((l) => l.sector === p.sector)
    .map((l) => ({ l, e: leverEconomics(p, l, s, o) }))
    .filter(({ e }) => e.mac !== null)
    .sort((a, b) => a.e.mac! - b.e.mac!);
  let x0 = 0;
  const out: MaccBar[] = bars.map(({ l, e }) => {
    const widthMt = (l.abatement + l.scope2Cut) * p.euVolume.value;
    const b = { id: l.id, name: l.name, widthMt, x0, mac: e.mac!, cbamRelevant: e.cbamRelevant };
    x0 += widthMt;
    return b;
  });
  return { bars: out, totalMt: x0, price: priceIn(s.year, s.basePrice, s.growth) };
}

// Value-driver tree for the exporter's annual CBAM hit (verified data). Sensitivity = change in the hit when the driver rises 10%.
export interface DriverNode { id: string; label: string; value: number; unit: string; delta?: number; children?: DriverNode[] }
export function driverTree(p: Producer, s: Scenario): DriverNode {
  const r = producerSummary(p, s);
  const base = r.annualActual;
  const up = (pp: Producer, ss: Scenario) => producerSummary(pp, ss).annualActual - base;
  const scale = (k: "actualDirect" | "euVolume"): Producer => ({ ...p, [k]: { ...p[k], value: p[k].value * 1.1 } });
  // shortcut: the benchmark is route-weighted (Σ benchmark × share), so scaling every route share by 10% scales it by 10%.
  const benchUp: Producer = { ...p, routeShares: p.routeShares.map((x) => x * 1.1) };
  const a = r.act;
  const price = priceIn(s.year, s.basePrice, s.growth);
  const freeDelta = up(benchUp, s);
  return {
    id: "hit", label: "Exporter's annual CBAM hit", value: base, unit: "€/yr",
    children: [
      { id: "vol", label: "EU volume", value: p.euVolume.value, unit: "Mt", delta: up(scale("euVolume"), s) },
      { id: "pt", label: "Pass-through to exporter", value: s.passThrough, unit: "%", delta: up(p, { ...s, passThrough: Math.min(1, s.passThrough * 1.1) }) },
      {
        id: "net", label: "CBAM cost per tonne", value: a.net, unit: "€/t",
        children: [
          {
            id: "certs", label: "Certificates per tonne", value: a.certificates, unit: "tCO₂/t",
            children: [
              { id: "e", label: "Verified emissions", value: a.applied, unit: "tCO₂/t", delta: up(scale("actualDirect"), s) },
              {
                id: "free", label: "Free allocation", value: a.freeAllocation, unit: "tCO₂/t", delta: freeDelta,
                children: [
                  { id: "f", label: `CBAM factor ${s.year}`, value: cbamFactor(s.year, s.regime), unit: "%" },
                  { id: "b", label: "Route benchmark", value: benchmarkFor(p), unit: "tCO₂/t" },
                ],
              },
            ],
          },
          { id: "price", label: "Certificate price", value: price, unit: "€/t", delta: up(p, { ...s, basePrice: s.basePrice * 1.1 }) },
          ...(a.originCredit > 0 ? [{ id: "art9", label: "Article 9 credit", value: a.originCredit, unit: "€/t", delta: up(p, { ...s, originCarbonPrice: s.originCarbonPrice * 1.1 }) }] : []),
        ],
      },
    ],
  };
}

// Harvey-ball lever assessment: 0–4 on each criterion, all derived from model values.
export type Score = 0 | 1 | 2 | 3 | 4;
export const CRITERIA = ["CBAM relevance", "Cost vs certificate", "Payback", "Maturity (TRL)", "Capex-light"] as const;
const bucket = (v: number, steps: number[]): Score => steps.filter((t) => v >= t).length as Score; // count of thresholds passed
export function leverScores(l: Lever, e: ReturnType<typeof leverEconomics>, price: number): Score[] {
  const relevance: Score = !e.cbamRelevant ? 0 : (Math.max(1, bucket(l.abatement, [0.05, 0.15, 0.5, 1])) as Score);
  const cost: Score = e.mac === null ? 0 : e.mac <= 0 ? 4 : e.mac <= 0.5 * price ? 3 : e.mac <= price ? 2 : e.mac <= 2 * price ? 1 : 0;
  const payback: Score = e.payback === null ? 0 : e.payback < 0.05 ? 4 : e.payback <= 3 ? 3 : e.payback <= 7 ? 2 : e.payback <= 15 ? 1 : 0;
  const trl: Score = Math.max(0, Math.min(4, l.trl - 5)) as Score;
  const capex: Score = l.capex <= 10 ? 4 : l.capex <= 50 ? 3 : l.capex <= 200 ? 2 : l.capex <= 400 ? 1 : 0;
  return [relevance, cost, payback, trl, capex];
}
export function leverAssessment(p: Producer, s: Scenario, o: LeverOpts) {
  const price = priceIn(2030, s.basePrice, s.growth);
  return LEVERS.filter((l) => l.sector === p.sector).map((l) => {
    const e = leverEconomics(p, l, s, o);
    const scores = leverScores(l, e, price);
    return { l, e, scores, total: scores.reduce<number>((a, b) => a + b, 0) };
  }).sort((a, b) => Number(b.scores[0] > 0) - Number(a.scores[0] > 0) || b.total - a.total); // CBAM-relevant levers first
}

// Football field: 2030 verified €/t per steel producer across price and policy scenarios (100% pass-through).
export const FIELD_SCENARIOS: { label: string; s: Partial<Scenario> }[] = [
  { label: "Low: price −30%, flat, proposal adopted", s: { basePrice: DEFAULT_SCENARIO.basePrice * 0.7, growth: 0, regime: "proposal" } },
  { label: "Proposal adopted", s: { regime: "proposal" } },
  { label: "Base", s: {} },
  { label: "High: price +30%, +6%/yr", s: { basePrice: DEFAULT_SCENARIO.basePrice * 1.3, growth: 0.06 } },
];
export function footballField(year = 2030) {
  return PRODUCERS.filter((p) => p.sector === "steel").map((p) => {
    const vals = FIELD_SCENARIOS.map((f) => producerCost(p, { ...DEFAULT_SCENARIO, ...f.s }, "actual", { year }).net);
    const base = producerCost(p, DEFAULT_SCENARIO, "actual", { year }).net;
    const onDefaults = producerCost(p, DEFAULT_SCENARIO, "default", { year }).net;
    return { p, lo: Math.min(...vals), hi: Math.max(...vals), base, onDefaults };
  });
}

// Executive scorecard: one RAG per dimension, thresholds stated so the call is reproducible.
export type Level = "red" | "amber" | "green";
export const SCORECARD_RULES = [
  { k: "cost2030", label: "2030 cost per tonne", rule: "red > €150/t, amber > €100/t (verified, 100% pass-through)" },
  { k: "margin", label: "EU margin kept in 2030", rule: "red < 25% of EBITDA, amber < 60% (at the base 50% pass-through)" },
  { k: "penalty", label: "Cost of staying on defaults (2026)", rule: "red > €200/t, amber > €100/t" },
  { k: "route", label: "Route benchmark risk", rule: "red > 40% DRI output, amber > 15%" },
  { k: "cliff", label: "2030 vs 2026 cost", rule: "red > 3×, amber > 2×" },
] as const;
export function scorecard() {
  const full = { ...DEFAULT_SCENARIO, passThrough: 1 };
  return PRODUCERS.filter((p) => p.sector === "steel").map((p) => {
    const t = trajectory(p, full);
    const c26 = t[0].actual, c30 = t[YEARS.indexOf(2030)].actual;
    const r = producerSummary(p, full);
    const margin = 1 - (c30 * DEFAULT_SCENARIO.passThrough) / p.ebitdaEUR.value;
    const penalty = r.def.net - r.act.net;
    const dri = p.routeShares[1] ?? 0;
    const cliff = c26 > 0 ? c30 / c26 : Infinity;
    const lvl = (v: number, red: number, amber: number, low = false): Level => (low ? (v < red ? "red" : v < amber ? "amber" : "green") : v > red ? "red" : v > amber ? "amber" : "green");
    return {
      p,
      cells: {
        cost2030: { v: c30, level: lvl(c30, 150, 100) },
        margin: { v: margin, level: lvl(margin, 0.25, 0.6, true) },
        penalty: { v: penalty, level: lvl(penalty, 200, 100) },
        route: { v: dri, level: lvl(dri, 0.4, 0.15) },
        cliff: { v: cliff, level: lvl(cliff, 3, 2) },
      },
    };
  });
}
