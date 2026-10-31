// Value at stake: the 2026–34 CBAM bill for the modelled steel producers, from "do nothing" (EU defaults)
// down to the residual after each move. Every step is computed from the engine, sequentially (no double counting).
import { YEARS, cbamCostPerTonne, priceIn } from "./cbam";
import { PRODUCERS, PRODUCTS, type Producer } from "./data";
import { producerCost, type Scenario, DEFAULT_SCENARIO } from "./model";
import { paidPerTonne } from "./policy";

export interface Moves { efficiency: number; scrapBio: number; art9Price: number; art9Qualifying: number }
export const DEFAULT_MOVES: Moves = { efficiency: 0.2, scrapBio: 0.25, art9Price: 20, art9Qualifying: 0.6 };

const steel = () => PRODUCERS.filter((p) => p.sector === "steel");

// Lowest-carbon routing of a producer's EU tonnes across its plants: the average direct intensity and benchmark served to the EU.
function routedIntensity(p: Producer, s: Scenario, year: number) {
  const b = PRODUCTS.steel.benchmarks;
  const plants = (p.plants ?? []).map((pl) => {
    const bench = (1 - pl.driShare) * b[0].value + pl.driShare * b[1].value;
    const cost = cbamCostPerTonne({ year, mode: "actual", defaultValue: 0, actual: pl.intensity, benchmark: bench, price: 1, regime: s.regime }).net;
    return { ...pl, bench, cost };
  }).sort((a, b) => a.cost - b.cost);
  let left = p.euVolume.value, costSum = 0, base = 0;
  const total = plants.reduce((a, x) => a + x.capacity, 0);
  for (const pl of plants) {
    const take = Math.min(left, pl.capacity); left -= take; costSum += take * pl.cost;
    base += (p.euVolume.value * pl.capacity / total) * pl.cost;
  }
  return base > 0 ? costSum / base : 1; // ratio of routed to pro-rata certificate cost
}

export function valueAtStake(s: Scenario = { ...DEFAULT_SCENARIO, passThrough: 1 }, m: Moves = DEFAULT_MOVES) {
  let doNothing = 0, verified = 0, eff = 0, scrap = 0, routed = 0, art9 = 0;
  for (const p of steel()) {
    const vol = p.euVolume.value * 1e6;
    for (const year of YEARS) {
      const cost = (direct?: number) => producerCost(p, { ...s, originCarbonPrice: 0 }, direct === undefined ? "default" : "actual", { year, direct }).net;
      const a = p.actualDirect.value;
      const cDefault = cost(), cVerified = cost(a);
      const cEff = year >= 2027 ? cost(Math.max(0, a - m.efficiency)) : cVerified;
      const cScrap = year >= 2028 ? cost(Math.max(0, a - m.efficiency - m.scrapBio)) : cEff;
      const cRouted = cScrap * (p.plants?.length ? routedIntensity(p, s, year) : 1);
      const eAfter = Math.max(0, a - (year >= 2027 ? m.efficiency : 0) - (year >= 2028 ? m.scrapBio : 0));
      const credit = Math.min(cRouted, paidPerTonne(eAfter, { price: m.art9Price, mechanism: "explicit", targetCut: 0, qualifying: 1 })) * m.art9Qualifying;
      doNothing += cDefault * vol; verified += cVerified * vol; eff += cEff * vol; scrap += cScrap * vol; routed += cRouted * vol; art9 += (cRouted - credit) * vol;
    }
  }
  const steps = [
    { label: "Do nothing (EU defaults)", value: doNothing, total: true },
    { label: "Verify emissions", value: verified - doNothing },
    { label: "Efficiency stack", value: eff - verified },
    { label: "Scrap + biochar", value: scrap - eff },
    { label: "Route low-carbon plants to EU", value: routed - scrap },
    { label: "Art. 9: pay in India", value: art9 - routed },
    { label: "Residual paid to EU", value: art9, total: true },
  ];
  return { steps, doNothing, residual: art9 };
}

export const ETS_PRICES = [
  { year: 2018, price: 15.8 }, { year: 2019, price: 24.8 }, { year: 2020, price: 24.8 }, { year: 2021, price: 53.5 },
  { year: 2022, price: 80.9 }, { year: 2023, price: 83.5 }, { year: 2024, price: 65.0 }, { year: 2025, price: 74.4 },
  { year: 2026, price: +((75.36 + 75.28 + 82.32) / 3).toFixed(1) },
];

// 2026–34 annual CBAM bill per producer (stacked area on the summary page).
export function annualBill(mode: "default" | "actual", s: Scenario = { ...DEFAULT_SCENARIO, passThrough: 1 }) {
  return YEARS.map((year) => {
    const row: Record<string, number> = { year };
    for (const p of steel()) row[p.name] = Math.round((producerCost(p, s, mode, { year }).net * p.euVolume.value * 1e6) / 1e6);
    row.price = +priceIn(year, s.basePrice, s.growth).toFixed(1);
    return row;
  });
}
