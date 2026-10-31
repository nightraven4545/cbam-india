// CBAM definitive-period cost engine. Every rule constant lives here, with its legal source.
// Liability per tonne = max(0, E_applied − F_t × CSCF_t × B); cost = liability × P − origin carbon price credit.

export const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034] as const;

// CBAM factor F_t: share of the EU benchmark still freely allocated.
// Source: Directive 2003/87/EC Art. 10a(1a) (as amended by Directive (EU) 2023/959); Reg. (EU) 2023/956 Art. 31.
const CBAM_FACTOR_LAW: Record<number, number> = {
  2026: 0.975, 2027: 0.95, 2028: 0.9, 2029: 0.775, 2030: 0.515,
  2031: 0.39, 2032: 0.265, 2033: 0.14,
};

export type Regime = "law" | "proposal";

// Proposal COM(2026) 616 (17 Jul 2026): 15% of the allocation phased out by the CBAM factor is reintroduced from 2028.
// Not law; shown as a toggle.
export function cbamFactor(year: number, regime: Regime = "law"): number {
  const f = CBAM_FACTOR_LAW[year] ?? (year < 2026 ? 1 : 0);
  return regime === "proposal" && year >= 2028 ? f + 0.15 * (1 - f) : f;
}

// Mark-up on default values for steel, aluminium, cement, hydrogen.
// Source: Implementing Reg. (EU) 2025/2621 (as replaced by (EU) 2026/1740).
export function defaultMarkup(year: number): number {
  return year <= 2026 ? 0.1 : year === 2027 ? 0.2 : 0.3;
}

// Official quarterly CBAM certificate prices, €/tCO2e (European Commission, DG TAXUD).
export const CERT_PRICES_2026 = { Q1: 75.36, Q2: 75.28, Q3: 82.32 } as const;

export type Mode = "default" | "actual";

export interface CostInput {
  year: number;
  mode: Mode;
  defaultValue: number; // tCO2e/t, Commission default for country × CN code
  actual: number; // tCO2e/t, verified installation-level embedded emissions (CBAM boundary)
  benchmark: number; // tCO2e/t, CBAM benchmark for the product (route-weighted)
  price: number; // €/tCO2e certificate price
  originCarbonPrice?: number; // €/tCO2e effectively paid in India (Art. 9 deduction)
  regime?: Regime;
  indirect?: number; // tCO2e/t added on top (stress test: indirect emissions brought into scope)
}

export interface CostResult {
  applied: number;
  freeAllocation: number;
  certificates: number; // per tonne of product
  gross: number; // € per tonne before origin credit
  originCredit: number;
  net: number; // € per tonne, legal liability of the EU importer
}

export function cbamCostPerTonne(i: CostInput): CostResult {
  const applied = (i.mode === "default" ? i.defaultValue * (1 + defaultMarkup(i.year)) : i.actual) + (i.indirect ?? 0);
  const freeAllocation = cbamFactor(i.year, i.regime) * i.benchmark; // CSCF = 1 for 2026
  const certificates = Math.max(0, applied - freeAllocation);
  const gross = certificates * i.price;
  // shortcut: Art. 9 credit modelled as price × chargeable tonnes, capped at gross; refine once the CCTS–CBAM deduction rules are set.
  const originCredit = Math.min(gross, (i.originCarbonPrice ?? 0) * certificates);
  return { applied, freeAllocation, certificates, gross, originCredit, net: gross - originCredit };
}

// Certificate price in a future year, from a base price and an annual growth rate.
export function priceIn(year: number, base: number, growth: number): number {
  return base * Math.pow(1 + growth, Math.max(0, year - 2026));
}

export function npv(rate: number, flows: number[]): number {
  return flows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}

// IRR by bisection; null when the flows never change sign (no meaningful IRR).
export function irr(flows: number[]): number | null {
  let lo = -0.99, hi = 2;
  if (npv(lo, flows) * npv(hi, flows) > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (npv(lo, flows) * npv(mid, flows) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function paybackYears(flows: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < flows.length; t++) {
    const prev = cum;
    cum += flows[t];
    if (t > 0 && cum >= 0) return t - 1 + (flows[t] ? -prev / flows[t] : 0);
  }
  return null;
}
