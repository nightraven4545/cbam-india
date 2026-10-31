// Real option to build a green H2-DRI line any year 2026–2034 (American-style), on a binomial carbon-price lattice.
// The project's value at exercise uses the then-current price growing at g, and an H2 cost that falls each year.
import { cbamCostPerTonne } from "./cbam";
import type { Scenario } from "./model";

export interface H2Opts {
  sigma: number; // annual carbon-price volatility
  discount: number;
  h2Decline: number; // annual fall in green H2 cost
  capex: number; // € / t capacity
  baseOpex: number; // € / t extra OPEX at today's H2 cost (scales with H2 cost)
  abatement: number; // tCO2 / t direct cut
  intensity: number; // current direct intensity of the displaced route
  benchmark: number;
  life: number;
  greenPremium: number; // € / t product on EU sales
}
export const DEFAULT_H2: H2Opts = { sigma: 0.25, discount: 0.1, h2Decline: 0.07, capex: 650, baseOpex: 180, abatement: 1.6, intensity: 2.1, benchmark: 1.37, life: 25, greenPremium: 0 };

// NPV (at the exercise date) of starting the project in `start` with carbon price `p0` that year. Dedicated EU line.
export function projectValue(start: number, p0: number, s: Scenario, o: H2Opts) {
  let v = -o.capex;
  for (let k = 1; k <= o.life; k++) {
    const y = start + k;
    const price = p0 * Math.pow(1 + s.growth, k);
    const before = cbamCostPerTonne({ year: y, mode: "actual", defaultValue: 0, actual: o.intensity, benchmark: o.benchmark, price, regime: s.regime }).net;
    const after = cbamCostPerTonne({ year: y, mode: "actual", defaultValue: 0, actual: Math.max(0, o.intensity - o.abatement), benchmark: o.benchmark, price, regime: s.regime }).net;
    const opex = o.baseOpex * Math.pow(1 - o.h2Decline, y - 2026);
    v += ((before - after) * s.passThrough + o.greenPremium - opex) / Math.pow(1 + o.discount, k);
  }
  return v;
}

export function h2Option(s: Scenario, o: H2Opts, first = 2026, last = 2034) {
  const n = last - first;
  const u = Math.exp(Math.max(o.sigma, 1e-9)), d = 1 / u;
  const q = Math.min(1, Math.max(0, (1 + s.growth - d) / (u - d)));
  const priceAt = (t: number, j: number) => s.basePrice * Math.pow(u, j) * Math.pow(d, t - j);
  let vals = Array.from({ length: n + 1 }, (_, j) => Math.max(0, projectValue(last, priceAt(n, j), s, o)));
  const thresholds: { year: number; price: number | null }[] = [{ year: last, price: null }];
  thresholds[0].price = minExercisePrice(n, (j) => projectValue(last, priceAt(n, j), s, o) > 0, priceAt);
  for (let t = n - 1; t >= 0; t--) {
    const next: number[] = [];
    const exercise: boolean[] = [];
    for (let j = 0; j <= t; j++) {
      const cont = (q * vals[j + 1] + (1 - q) * vals[j]) / (1 + o.discount);
      const now = projectValue(first + t, priceAt(t, j), s, o);
      next.push(Math.max(now, cont));
      exercise.push(now > 0 && now >= cont);
    }
    thresholds.unshift({ year: first + t, price: minExercisePrice(t, (j) => exercise[j], priceAt) });
    vals = next;
  }
  const npvNow = projectValue(first, s.basePrice, s, o);
  return { optionValue: vals[0], npvNow, waitValue: vals[0] - Math.max(0, npvNow), thresholds };
}

function minExercisePrice(t: number, ex: (j: number) => boolean, priceAt: (t: number, j: number) => number) {
  for (let j = 0; j <= t; j++) if (ex(j)) return priceAt(t, j);
  return null;
}
