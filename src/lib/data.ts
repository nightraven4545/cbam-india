// Inputs with provenance. Confidence: A verified installation data · B regulation / official statistic ·
// C company disclosure · D analyst estimate or derived · E Commission default value.
export type Confidence = "A" | "B" | "C" | "D" | "E";
export interface Sourced { value: number; confidence: Confidence; source: string }

const S = {
  defaults: "Implementing Reg. (EU) 2025/2621, Annex (as replaced by (EU) 2026/1740), via cbamguide.com/compliance/default-values",
  bench: "Implementing Reg. (EU) 2025/2620 (CBAM benchmarks), via cbamguide.com/compliance/default-values",
  are: "Asia Research & Engagement, 'The CBAM Test: Indian Steel's Future in Europe' (1 Sep 2026)",
  ccts: "CCTS draft GHG-intensity target schedule, FY2023-24 plant baselines (MoEFCC/BEE); direct share 0.85 assumed",
  est: "Analyst estimate from FY26 results/annual reports; illustrative, edit before relying on it",
};

// Steel CN 7208 (hot-rolled flat): India default and route benchmarks.
export const STEEL_HR = {
  cn: "7208",
  name: "Hot-rolled flat steel",
  defaultValue: { value: 4.28, confidence: "E", source: S.defaults } as Sourced,
  benchmarkBFBOF: { value: 1.37, confidence: "B", source: S.bench } as Sourced,
  benchmarkDRIEAF: { value: 0.481, confidence: "B", source: S.bench } as Sourced,
  benchmarkScrapEAF: { value: 0.072, confidence: "B", source: S.bench } as Sourced,
};

export interface Producer {
  id: string;
  name: string;
  route: string;
  driShare: number; // share of output via DRI-EAF; sets the route-weighted benchmark
  production: Sourced; // Mt crude steel / yr
  euVolume: Sourced; // Mt / yr shipped to the EU
  actualDirect: Sourced; // tCO2e/t, CBAM direct embedded emissions estimate
  priceEUR: Sourced; // € / t realised on EU sales
  ebitdaEUR: Sourced; // € / t EBITDA on EU sales, before CBAM
  note: string;
}

export const PRODUCERS: Producer[] = [
  {
    id: "jsw", name: "JSW Steel", route: "BF-BOF + some Corex/DRI (Vijayanagar, Dolvi)", driShare: 0.1,
    production: { value: 28, confidence: "D", source: S.est },
    euVolume: { value: 1.3, confidence: "D", source: S.are },
    actualDirect: { value: 2.23, confidence: "D", source: S.ccts + " (Vijayanagar 2.618)" },
    priceEUR: { value: 600, confidence: "D", source: S.est },
    ebitdaEUR: { value: 95, confidence: "D", source: S.est },
    note: "Largest EU exposure in India; ARE puts its 2030 CBAM cost at €130–160m.",
  },
  {
    id: "tata", name: "Tata Steel (India)", route: "BF-BOF (Jamshedpur, Kalinganagar)", driShare: 0,
    production: { value: 22, confidence: "D", source: S.est },
    euVolume: { value: 0.9, confidence: "D", source: S.are + " (derived from €90–130m 2030 cost)" },
    actualDirect: { value: 2.01, confidence: "D", source: S.ccts + " (Jamshedpur 2.363)" },
    priceEUR: { value: 610, confidence: "D", source: S.est },
    ebitdaEUR: { value: 110, confidence: "D", source: S.est },
    note: "Most efficient Indian BF-BOF; still about 0.65 t above the 2026 free allocation.",
  },
  {
    id: "amns", name: "AM/NS India", route: "Gas/coal DRI-EAF + BF (Hazira)", driShare: 0.5,
    production: { value: 8.5, confidence: "D", source: S.est },
    euVolume: { value: 0.7, confidence: "D", source: S.est },
    actualDirect: { value: 2.2, confidence: "D", source: S.est },
    priceEUR: { value: 600, confidence: "D", source: S.est },
    ebitdaEUR: { value: 90, confidence: "D", source: S.est },
    note: "The DRI share lowers its benchmark (0.481 vs 1.370), so it gets less free allocation than a BF-BOF peer with the same emissions.",
  },
  {
    id: "jspl", name: "Jindal Steel (JSPL)", route: "Coal-gas DRI + BF (Angul, Raigarh)", driShare: 0.5,
    production: { value: 8.5, confidence: "D", source: S.est },
    euVolume: { value: 0.5, confidence: "D", source: S.are + " (derived from €60–80m 2030 cost)" },
    actualDirect: { value: 2.64, confidence: "D", source: S.ccts + " (Angul 2.95–3.21 range)" },
    priceEUR: { value: 590, confidence: "D", source: S.est },
    ebitdaEUR: { value: 115, confidence: "D", source: S.est },
    note: "Coal-based DRI: high intensity and a low route benchmark make for the steepest unit exposure.",
  },
  {
    id: "sail", name: "SAIL", route: "Integrated BF-BOF (>95%)", driShare: 0,
    production: { value: 19.5, confidence: "D", source: S.est },
    euVolume: { value: 0.25, confidence: "D", source: S.est },
    actualDirect: { value: 2.55, confidence: "D", source: S.ccts + " (SAIL plants 2.95–3.21)" },
    priceEUR: { value: 580, confidence: "D", source: S.est },
    ebitdaEUR: { value: 60, confidence: "D", source: S.est },
    note: "Thin margins plus high intensity: ARE calls its €80–120/t exposure potentially unviable.",
  },
];

export function benchmarkFor(p: Producer): number {
  return (1 - p.driShare) * STEEL_HR.benchmarkBFBOF.value + p.driShare * STEEL_HR.benchmarkDRIEAF.value;
}

// Peer comparison at country-default level (Commission defaults, steel slab / HR flat; E).
export const PEER_DEFAULTS = [
  { country: "India (HR flat)", value: 4.28 },
  { country: "India (slab)", value: 4.27 },
  { country: "China (slab)", value: 3.169 },
  { country: "Türkiye (billet)", value: 2.31 },
  { country: "South Korea (HR flat)", value: 2.118 },
];

export interface Lever {
  id: string;
  name: string;
  abatement: number; // tCO2/t direct (CBAM-relevant) emissions cut
  scope2Cut: number; // tCO2/t indirect cut (counts for CCTS / corporate targets, not steel CBAM)
  capex: number; // € per t of annual capacity
  opexDelta: number; // € per t, + is extra cost, − is a saving
  life: number; // years
  trl: number;
  note: string;
}

// Ranges from IEA Iron & Steel Technology Roadmap, MoS 'Greening the Steel Sector' (2024) and TERI/CSTEP studies; D grade.
export const LEVERS: Lever[] = [
  { id: "ee", name: "Energy efficiency (WHR, TRT, CDQ, PCI)", abatement: 0.2, scope2Cut: 0.05, capex: 30, opexDelta: -8, life: 15, trl: 9, note: "Pays for itself on energy savings; CBAM avoidance comes on top." },
  { id: "scrap", name: "Higher scrap charge in BOF (15→25%)", abatement: 0.15, scope2Cut: 0, capex: 5, opexDelta: 6, life: 10, trl: 9, note: "Scrap is scarce and dear in India; it is the cost, not the capex, that limits this." },
  { id: "bio", name: "Biochar / biomass injection in BF", abatement: 0.1, scope2Cut: 0, capex: 8, opexDelta: 4, life: 10, trl: 7, note: "Limited by the biomass supply chain." },
  { id: "re", name: "Round-the-clock renewable PPA", abatement: 0, scope2Cut: 0.3, capex: 0, opexDelta: -3, life: 25, trl: 9, note: "Zero steel CBAM benefit today: indirect emissions of iron & steel are outside the charge (Annex II)." },
  { id: "ngdri", name: "Shift part of output to gas DRI-EAF", abatement: 0.6, scope2Cut: 0, capex: 250, opexDelta: 40, life: 25, trl: 9, note: "Imported LNG makes this OPEX-heavy in India." },
  { id: "ccus", name: "CCUS on BF/coke-oven gas", abatement: 0.8, scope2Cut: 0, capex: 300, opexDelta: 55, life: 20, trl: 6, note: "Needs storage clusters that do not exist yet." },
  { id: "h2", name: "Green H₂-DRI-EAF (new line)", abatement: 1.6, scope2Cut: 0, capex: 650, opexDelta: 180, life: 25, trl: 6, note: "IEA: 50–140% costlier than BF-BOF. Viable only with a premium or a dedicated EU line." },
];
