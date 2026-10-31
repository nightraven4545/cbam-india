// Carbon-price risk: Monte Carlo of mean-reverting log-price deviations around the scenario's deterministic path.
// ln P_t = ln(path_t) + y_t, with y_{t+1} = (1 − κ) y_t + σ ε, y_2026 = 0 (2026 prices are largely published).
import { YEARS, priceIn } from "./cbam";
import type { Producer } from "./data";
import { cumulativeExposure, type Scenario } from "./model";
import type { Mode } from "./cbam";

// mulberry32: small seeded PRNG, so runs are reproducible and testable.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RiskOpts { n: number; sigma: number; kappa: number; seed: number }
export const DEFAULT_RISK: RiskOpts = { n: 2000, sigma: 0.3, kappa: 0.3, seed: 42 };

export function pricePaths(s: Scenario, o: RiskOpts): number[][] {
  const r = rng(o.seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: o.n }, () => {
    let y = 0;
    return YEARS.map((yr, i) => {
      if (i > 0) y = (1 - o.kappa) * y + o.sigma * normal();
      return priceIn(yr, s.basePrice, s.growth) * Math.exp(y);
    });
  });
}

const q = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];

export function exposureStats(p: Producer, s: Scenario, mode: Mode, paths: number[][]) {
  const xs = paths.map((pr) => cumulativeExposure(p, s, mode, pr)).sort((a, b) => a - b);
  const tail = xs.slice(Math.floor(0.95 * xs.length));
  return { p5: q(xs, 0.05), p50: q(xs, 0.5), p95: q(xs, 0.95), cvar95: tail.reduce((a, b) => a + b, 0) / tail.length };
}

// Price fan: P5 / P50 / P95 per year.
export function priceFan(paths: number[][]) {
  return YEARS.map((year, i) => {
    const col = paths.map((pp) => pp[i]).sort((a, b) => a - b);
    return { year, p5: q(col, 0.05), p50: q(col, 0.5), p95: q(col, 0.95), band: [q(col, 0.05), q(col, 0.95)] as [number, number] };
  });
}
