import { YEARS, cbamCostPerTonne, priceIn, npv, irr, paybackYears, type Mode, type Regime } from "./cbam";
import { STEEL_HR, benchmarkFor, type Producer, type Lever } from "./data";

export interface Scenario {
  year: number;
  basePrice: number; // €/tCO2e in 2026
  growth: number; // annual price growth
  passThrough: number; // share of the importer's CBAM cost borne by the Indian exporter
  originCarbonPrice: number; // €/tCO2e effectively paid in India
  regime: Regime;
  fx: number; // ₹ per €
}

export const DEFAULT_SCENARIO: Scenario = {
  year: 2026, basePrice: 82.32, growth: 0.03, passThrough: 0.5, originCarbonPrice: 0, regime: "law", fx: 100,
};

export function producerCost(p: Producer, s: Scenario, mode: Mode, year = s.year, actualOverride?: number) {
  return cbamCostPerTonne({
    year, mode,
    defaultValue: STEEL_HR.defaultValue.value,
    actual: actualOverride ?? p.actualDirect.value,
    benchmark: benchmarkFor(p),
    price: priceIn(year, s.basePrice, s.growth),
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
    importerCostActual: act.net * vol,
  };
}

// Year-by-year path 2026–2034 for one producer (€/t, legal cost before pass-through).
export function trajectory(p: Producer, s: Scenario) {
  return YEARS.map((y) => {
    const d = producerCost(p, s, "default", y);
    const a = producerCost(p, s, "actual", y);
    return { year: y, default: d.net, actual: a.net, price: priceIn(y, s.basePrice, s.growth) };
  });
}

export function cumulativeExposure(p: Producer, s: Scenario, mode: Mode) {
  const vol = p.euVolume.value * 1e6;
  return YEARS.reduce((sum, y) => sum + producerCost(p, s, mode, y).net * s.passThrough * vol, 0);
}

export interface LeverOpts { dedicatedEU: boolean; cctsPrice: number; greenPremium: number; discount: number }

// Lever economics per tonne of capacity the lever applies to. Cash flows: year 0 = capex (2026), years 1..life from 2027.
// The CBAM benefit is the cut in certificates on the EU share of that tonne, capped at the certificates still owed.
export function leverEconomics(p: Producer, l: Lever, s: Scenario, o: LeverOpts) {
  const euShare = o.dedicatedEU ? 1 : Math.min(1, p.euVolume.value / p.production.value);
  const flows = [-l.capex];
  for (let t = 1; t <= l.life; t++) {
    const y = 2026 + t;
    const before = producerCost(p, s, "actual", y);
    const after = producerCost(p, s, "actual", y, Math.max(0, p.actualDirect.value - l.abatement));
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
    cbamRelevant: l.abatement > 0,
  };
}
