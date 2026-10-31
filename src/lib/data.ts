// Inputs with provenance. Confidence: A verified installation data · B regulation / official statistic ·
// C company disclosure · D analyst estimate or derived · E Commission default value.
export type Confidence = "A" | "B" | "C" | "D" | "E";
export interface Sourced { value: number; confidence: Confidence; source: string }
const d = (value: number, confidence: Confidence, source: string): Sourced => ({ value, confidence, source });

const S = {
  defaults: "Implementing Reg. (EU) 2025/2621 Annex, as replaced by (EU) 2026/1740 (via cbamguide.com)",
  bench: "Implementing Reg. (EU) 2025/2620 Annex, Column B (EUR-Lex OJ L 2025/2620)",
  alDefault: "Argus Media, 'EU lowers CBAM benchmarks for aluminium' (India 1.87 t), consistent with cbamguide.com",
  are: "Asia Research & Engagement, 'The CBAM Test: Indian Steel's Future in Europe' (1 Sep 2026)",
  ccts: "CCTS draft GHG-intensity target schedule, FY2023-24 plant baselines (MoEFCC/BEE); direct share 0.85 assumed",
  jsw26: "JSW Steel Q4FY26 press release (14 May 2026): 30.14 Mt crude steel, reported EBITDA ₹29,821 cr (≈₹9,900/t)",
  sail26: "SAIL FY26 results: 19.43 Mt crude steel, EBITDA ₹13,146 cr (≈₹6,765/t)",
  euAl: "Eurostat Comext 2025: 313 kt Indian aluminium to EU (via cbamguide.com); split by producer estimated",
  est: "Analyst estimate from FY26 results/annual reports; illustrative, edit before relying on it",
};

export type Sector = "steel" | "aluminium" | "cement";

export interface Product {
  cn: string;
  name: string;
  defaultValue: Sourced; // India country default, direct emissions
  benchmarks: { route: string; value: number }[]; // CBAM Column B benchmarks by route
}

export const PRODUCTS: Record<Sector, Product> = {
  steel: {
    cn: "7208", name: "Hot-rolled flat steel",
    defaultValue: d(4.28, "E", S.defaults),
    benchmarks: [{ route: "BF-BOF", value: 1.37 }, { route: "DRI-EAF", value: 0.481 }, { route: "Scrap-EAF", value: 0.072 }],
  },
  aluminium: {
    cn: "7601", name: "Unwrought aluminium",
    defaultValue: d(1.87, "E", S.alDefault),
    benchmarks: [{ route: "Primary", value: 1.423 }, { route: "Secondary", value: 0.091 }],
  },
  cement: {
    cn: "2523 29", name: "Grey Portland cement",
    defaultValue: d(1.48, "E", "Implementing Reg. (EU) 2025/2621/2026/1740 India value, via cbamguide.com/countries/india"),
    benchmarks: [{ route: "Grey cement", value: 0.666 }],
  },
};

// Cement is the one modelled sector where indirect (electricity) emissions are charged by law (not in Annex II).
export const INDIRECT_IN_LAW: Record<Sector, boolean> = { steel: false, aluminium: false, cement: true };

export interface Producer {
  id: string;
  name: string;
  sector: Sector;
  route: string;
  routeShares: number[]; // aligned with PRODUCTS[sector].benchmarks; sets the route-weighted benchmark
  production: Sourced; // Mt / yr
  euVolume: Sourced; // Mt / yr shipped to the EU
  actualDirect: Sourced; // tCO2e/t, CBAM-boundary direct embedded emissions
  indirect: Sourced; // tCO2e/t, electricity-related emissions (not charged today for steel / aluminium)
  ebitdaEUR: Sourced; // € / t EBITDA on EU sales, before CBAM
  note: string;
  plants?: Plant[]; // site-level split for the trade-allocation optimiser
}

export interface Plant { name: string; capacity: number; intensity: number; driShare: number } // Mt, tCO2e/t direct

export const PRODUCERS: Producer[] = [
  {
    id: "jsw", name: "JSW Steel", sector: "steel", route: "BF-BOF + some Corex/DRI (Vijayanagar, Dolvi)", routeShares: [0.9, 0.1, 0],
    production: d(30.14, "C", S.jsw26), euVolume: d(1.3, "D", S.are),
    actualDirect: d(2.23, "D", S.ccts + " (Vijayanagar 2.618)"), indirect: d(0.3, "D", S.est),
    ebitdaEUR: d(99, "C", S.jsw26 + "; group average, export margin may differ"),
    note: "Largest EU exposure in India; ARE puts its 2030 CBAM cost at €130–160m.",
    plants: [{ name: "Vijayanagar", capacity: 12.5, intensity: 2.23, driShare: 0.1 }, { name: "Dolvi", capacity: 10, intensity: 2.05, driShare: 0.2 }, { name: "BPSL Sambalpur", capacity: 4.5, intensity: 2.6, driShare: 0.3 }], // D: CCTS plant baselines × 0.85; capacities from company reports, rounded
  },
  {
    id: "tata", name: "Tata Steel (India)", sector: "steel", route: "BF-BOF (Jamshedpur, Kalinganagar)", routeShares: [1, 0, 0],
    production: d(22, "D", S.est), euVolume: d(0.9, "D", S.are + " (derived from €90–130m 2030 cost)"),
    actualDirect: d(2.01, "D", S.ccts + " (Jamshedpur 2.363)"), indirect: d(0.3, "D", S.est),
    ebitdaEUR: d(130, "D", "Tata Steel India EBITDA/t ≈ ₹13–19k in FY26 quarters; export margin assumed lower"),
    note: "Most efficient Indian BF-BOF, yet still about 0.65 t above the 2026 free allocation.",
    plants: [{ name: "Jamshedpur", capacity: 11, intensity: 2.01, driShare: 0 }, { name: "Kalinganagar", capacity: 8, intensity: 1.9, driShare: 0 }, { name: "Meramandali", capacity: 5.6, intensity: 2.4, driShare: 0.3 }], // D: CCTS plant baselines × 0.85; capacities from company reports, rounded
  },
  {
    id: "amns", name: "AM/NS India", sector: "steel", route: "Gas/coal DRI-EAF + BF (Hazira)", routeShares: [0.5, 0.5, 0],
    production: d(8.5, "D", S.est), euVolume: d(0.7, "D", S.est),
    actualDirect: d(2.2, "D", S.est), indirect: d(0.4, "D", S.est),
    ebitdaEUR: d(90, "D", S.est),
    note: "Its DRI share lowers the benchmark (0.481 vs 1.370), so it gets less free allocation than a BF-BOF peer with the same emissions.",
    plants: [{ name: "Hazira (DRI-EAF)", capacity: 5, intensity: 1.9, driShare: 1 }, { name: "Hazira (BF-BOF)", capacity: 4, intensity: 2.5, driShare: 0 }], // D: CCTS plant baselines × 0.85; capacities from company reports, rounded
  },
  {
    id: "jspl", name: "Jindal Steel (JSPL)", sector: "steel", route: "Coal-gas DRI + BF (Angul, Raigarh)", routeShares: [0.5, 0.5, 0],
    production: d(8.5, "D", S.est), euVolume: d(0.5, "D", S.are + " (derived from €60–80m 2030 cost)"),
    actualDirect: d(2.64, "D", S.ccts + " (Angul 2.95–3.21 range)"), indirect: d(0.4, "D", S.est),
    ebitdaEUR: d(115, "D", S.est),
    note: "Coal-based DRI combines high intensity with a low route benchmark, giving the steepest unit exposure.",
    plants: [{ name: "Angul", capacity: 9, intensity: 2.64, driShare: 0.5 }, { name: "Raigarh", capacity: 3.6, intensity: 2.85, driShare: 0.6 }], // D: CCTS plant baselines × 0.85; capacities from company reports, rounded
  },
  {
    id: "sail", name: "SAIL", sector: "steel", route: "Integrated BF-BOF (>95%)", routeShares: [1, 0, 0],
    production: d(19.43, "C", S.sail26), euVolume: d(0.25, "D", S.est),
    actualDirect: d(2.55, "D", S.ccts + " (SAIL plants 2.95–3.21)"), indirect: d(0.3, "D", S.est),
    ebitdaEUR: d(68, "C", S.sail26),
    note: "Thin margins and high intensity: ARE calls its €80–120/t exposure potentially unviable.",
    plants: [{ name: "Bhilai", capacity: 7, intensity: 2.55, driShare: 0 }, { name: "Bokaro", capacity: 4.5, intensity: 2.62, driShare: 0 }, { name: "Rourkela", capacity: 4.3, intensity: 2.48, driShare: 0 }], // D: CCTS plant baselines × 0.85; capacities from company reports, rounded
  },
  {
    id: "vedanta", name: "Vedanta Aluminium", sector: "aluminium", route: "Primary smelting on captive coal power (Jharsuguda, BALCO)", routeShares: [1, 0],
    production: d(2.4, "C", "Vedanta annual report: ~2.4 Mt aluminium"), euVolume: d(0.15, "D", S.euAl),
    actualDirect: d(1.8, "D", "Anode consumption + PFC; IAI global direct average ≈1.6–2.0 t"), indirect: d(14.5, "D", "≈14.5 MWh/t × captive coal ≈1.0 t/MWh"),
    ebitdaEUR: d(750, "D", S.est),
    note: "About 20 t CO₂/t corporate footprint, of which only about 1.8 t (anode/PFC) is CBAM-priced today.",
  },
  {
    id: "hindalco", name: "Hindalco (India Al)", sector: "aluminium", route: "Primary smelting on captive coal (Renukoot, Mahan, Aditya)", routeShares: [1, 0],
    production: d(1.35, "C", "Hindalco annual report: ~1.3–1.4 Mt primary aluminium"), euVolume: d(0.1, "D", S.euAl),
    actualDirect: d(1.7, "D", "Anode + PFC estimate"), indirect: d(14, "D", "Captive coal power estimate"),
    ebitdaEUR: d(800, "D", S.est),
    note: "Downstream (Novelis) diversification softens the exposure; India primary metal is the CBAM-relevant part.",
  },
  {
    id: "nalco", name: "NALCO", sector: "aluminium", route: "Integrated bauxite–alumina–smelter, captive coal (Angul)", routeShares: [1, 0],
    production: d(0.46, "C", "NALCO annual report: ~0.46 Mt metal"), euVolume: d(0.06, "D", S.euAl),
    actualDirect: d(1.75, "D", "Anode + PFC estimate"), indirect: d(14.5, "D", "Captive coal power estimate"),
    ebitdaEUR: d(850, "D", S.est),
    note: "A low-cost integrated PSU; the indirect-emissions risk dominates.",
  },
  {
    id: "ultratech", name: "UltraTech Cement", sector: "cement", route: "Dry-process kilns; OPC + PPC/PSC blends", routeShares: [1],
    production: d(150, "D", "UltraTech FY26 sales ≈ 140–150 Mt"), euVolume: d(0.003, "D", "EU imports of Indian cement < €1m (Eurostat 2025)"),
    actualDirect: d(0.79, "D", "OPC basis: clinker factor ≈0.92 × ≈0.86 t/t clinker; BRSR cementitious avg ≈0.56 (blends lower it)"), indirect: d(0.05, "D", "Captive/grid power ≈ 75 kWh/t"),
    ebitdaEUR: d(12, "D", "≈ ₹1,100–1,200/t EBITDA"),
    note: "A methodology contrast: almost nothing goes to the EU, but cement is where electricity counts.",
  },
  {
    id: "shree", name: "Shree Cement", sector: "cement", route: "Dry-process kilns; high RE/WHR share", routeShares: [1],
    production: d(36, "D", "Shree FY26 ≈ 35–37 Mt"), euVolume: d(0.001, "D", "EU imports of Indian cement < €1m"),
    actualDirect: d(0.77, "D", "OPC basis estimate (BRSR blended avg ≈0.53)"), indirect: d(0.02, "D", "High WHR + solar share"),
    ebitdaEUR: d(12, "D", "≈ ₹1,200/t EBITDA"),
    note: "Heavy waste-heat and solar use lowers the indirect component that CBAM charges for cement.",
  },
  {
    id: "dalmia", name: "Dalmia Bharat", sector: "cement", route: "Blended-cement heavy (PSC/PPC)", routeShares: [1],
    production: d(30, "D", "Dalmia FY26 ≈ 29–31 Mt"), euVolume: d(0.001, "D", "EU imports of Indian cement < €1m"),
    actualDirect: d(0.78, "D", "OPC basis estimate (BRSR blended avg ≈0.46)"), indirect: d(0.04, "D", S.est),
    ebitdaEUR: d(10, "D", "≈ ₹1,000/t EBITDA"),
    note: "Its blended cements (CN 2523 90) sit below the EU benchmark; OPC exports under 2523 29 do not.",
  },
];

export function benchmarkFor(p: Producer): number {
  return PRODUCTS[p.sector].benchmarks.reduce((s, b, i) => s + b.value * (p.routeShares[i] ?? 0), 0);
}

// Country default values (direct, before mark-up). Source per row.
export const PEER_DEFAULTS: Record<Sector, { country: string; value: number; source: string }[]> = {
  steel: [
    { country: "India (HR flat)", value: 4.28, source: S.defaults },
    { country: "China (HR flat)", value: 3.187, source: "cbamguide.com/countries/china" },
    { country: "Türkiye (bars/rods)", value: 2.31, source: "cbamguide.com/countries/turkey (no 7208 value listed)" },
    { country: "South Korea (HR flat)", value: 2.118, source: "cbamguide.com/countries/south-korea; Projet Celsius" },
  ],
  cement: [
    { country: "India", value: 1.48, source: "cbamguide.com/countries/india" },
    { country: "Other / Türkiye", value: 1.44, source: "cbamguide.com/compliance/default-values" },
  ],
  aluminium: [
    { country: "China", value: 3.0, source: "Argus Media; cbamguide.com/countries/china" },
    { country: "India", value: 1.87, source: S.alDefault },
    { country: "UAE / Bahrain", value: 1.87, source: "cbamguide.com/compliance/default-values" },
    { country: "South Korea", value: 0.36, source: "cbamguide.com/countries/south-korea" },
  ],
};

// Delivered-cost competitors into the EU (HR coil). FOB and freight are illustrative D-grade 2026 levels;
// intensity is the direct tCO2e/t the importer would declare (verified-equivalent estimate unless stated).
export interface Competitor { origin: string; fob: number; freight: number; intensity: number; benchmark: number; note: string }
export const COMPETITORS: Competitor[] = [
  { origin: "India · verified BF-BOF", fob: 520, freight: 35, intensity: 2.1, benchmark: 1.37, note: "Efficient BF-BOF with verified data" },
  { origin: "India · on defaults", fob: 520, freight: 35, intensity: 4.28 * 1.1, benchmark: 1.37, note: "4.28 default + 2026 mark-up" },
  { origin: "Türkiye · EAF-heavy", fob: 545, freight: 15, intensity: 1.0, benchmark: 0.481, note: "Mostly scrap/DRI-EAF; short haul" },
  { origin: "South Korea · BF-BOF", fob: 540, freight: 45, intensity: 2.0, benchmark: 1.37, note: "POSCO/Hyundai-type verified BF-BOF" },
  { origin: "China · on defaults", fob: 480, freight: 45, intensity: 3.187 * 1.1, benchmark: 1.37, note: "3.187 default + mark-up" },
  { origin: "EU mill · BF-BOF (ETS)", fob: 600, freight: 10, intensity: 1.8, benchmark: 1.37, note: "Same free-allocation formula under the EU ETS" },
];

export interface Lever {
  id: string;
  sector: Sector;
  name: string;
  abatement: number; // tCO2/t direct (CBAM-relevant) emissions cut
  scope2Cut: number; // tCO2/t indirect cut (CCTS / corporate targets; CBAM only if indirect is added)
  capex: number; // € per t of annual capacity
  opexDelta: number; // € per t, + is extra cost, − is a saving
  life: number; // years
  trl: number;
  note: string;
}

// Steel ranges: IEA Iron & Steel Technology Roadmap; MoS 'Greening the Steel Sector' (2024); TERI/CSTEP.
// Aluminium ranges: IAI, IEA Aluminium tracking, CEEW smelter studies. All D grade.
export const LEVERS: Lever[] = [
  { id: "ee", sector: "steel", name: "Energy efficiency (WHR, TRT, CDQ, PCI)", abatement: 0.2, scope2Cut: 0.05, capex: 30, opexDelta: -8, life: 15, trl: 9, note: "Pays for itself on energy savings; CBAM avoidance comes on top." },
  { id: "scrap", sector: "steel", name: "Higher scrap charge in BOF (15→25%)", abatement: 0.15, scope2Cut: 0, capex: 5, opexDelta: 6, life: 10, trl: 9, note: "Scrap is scarce and dear in India; it is the cost, not the capex, that limits this." },
  { id: "bio", sector: "steel", name: "Biochar / biomass injection in BF", abatement: 0.1, scope2Cut: 0, capex: 8, opexDelta: 4, life: 10, trl: 7, note: "Limited by the biomass supply chain." },
  { id: "re", sector: "steel", name: "Round-the-clock renewable PPA", abatement: 0, scope2Cut: 0.3, capex: 0, opexDelta: -3, life: 25, trl: 9, note: "Zero steel CBAM benefit today: indirect emissions of iron & steel are outside the charge (Annex II)." },
  { id: "ngdri", sector: "steel", name: "Shift part of output to gas DRI-EAF", abatement: 0.6, scope2Cut: 0, capex: 250, opexDelta: 40, life: 25, trl: 9, note: "Imported LNG makes this OPEX-heavy in India." },
  { id: "ccus", sector: "steel", name: "CCUS on BF/coke-oven gas", abatement: 0.8, scope2Cut: 0, capex: 300, opexDelta: 55, life: 20, trl: 6, note: "Needs storage clusters that do not exist yet." },
  { id: "h2", sector: "steel", name: "Green H₂-DRI-EAF (new line)", abatement: 1.6, scope2Cut: 0, capex: 650, opexDelta: 180, life: 25, trl: 6, note: "IEA: 50–140% costlier than BF-BOF. Viable only with a premium or a dedicated EU line." },
  { id: "pfc", sector: "aluminium", name: "PFC / anode-effect control & point feeders", abatement: 0.3, scope2Cut: 0.2, capex: 25, opexDelta: -4, life: 15, trl: 9, note: "Cuts the direct emissions that CBAM does charge; also saves power." },
  { id: "inert", sector: "aluminium", name: "Inert anode retrofit", abatement: 1.4, scope2Cut: 0, capex: 450, opexDelta: 25, life: 20, trl: 6, note: "Removes anode CO₂ entirely; still pre-commercial (ELYSIS)." },
  { id: "alre", sector: "aluminium", name: "RTC renewables for 50% of smelter load", abatement: 0, scope2Cut: 7, capex: 0, opexDelta: 90, life: 25, trl: 9, note: "Halves the real footprint but earns zero CBAM saving unless indirect emissions are added." },
];
LEVERS.push(
  { id: "lc3", sector: "cement", name: "Clinker substitution / LC3 (fly ash, slag, calcined clay)", abatement: 0.12, scope2Cut: 0.01, capex: 10, opexDelta: -3, life: 15, trl: 9, note: "India's strongest lever, already widely used (PPC/PSC)." },
  { id: "afr", sector: "cement", name: "Alternative fuels (RDF, biomass) in kiln", abatement: 0.05, scope2Cut: 0, capex: 8, opexDelta: 0, life: 15, trl: 9, note: "Limited by the quality of the waste supply chain." },
  { id: "whr", sector: "cement", name: "Waste-heat recovery power", abatement: 0, scope2Cut: 0.03, capex: 15, opexDelta: -4, life: 20, trl: 9, note: "Counts for cement CBAM, because indirect emissions are in scope." },
  { id: "cre", sector: "cement", name: "Renewable PPA for grinding & kiln drives", abatement: 0, scope2Cut: 0.03, capex: 0, opexDelta: -1, life: 25, trl: 9, note: "Unlike steel and aluminium, this does reduce cement CBAM today." },
  { id: "cccs", sector: "cement", name: "CCUS on kiln flue gas", abatement: 0.45, scope2Cut: -0.05, capex: 150, opexDelta: 45, life: 20, trl: 7, note: "The only route to deep cuts in process (calcination) CO₂." },
);

// EU imports from India, 2024 (UN Comtrade, reporter EU-27 = 97, partner India = 699, CIF US$, net kt).
// status: "inScope" = already in CBAM Annex I since 2026; "proposed" = in the 2028 downstream proposal (COM(2025) 989, partial lines).
export interface Downstream { hs: string; product: string; usdM: number; kt: number; metal: "steel" | "aluminium"; metalShare: number; status: "inScope" | "proposed"; cluster: string }
export const DOWNSTREAM: Downstream[] = [
  { hs: "8708", product: "Motor-vehicle parts (wheels, gearboxes, body parts)", usdM: 1414.2, kt: 258.0, metal: "steel", metalShare: 0.7, status: "proposed", cluster: "Chennai, Pune, NCR" },
  { hs: "8483", product: "Transmission shafts, bearings housings, gears", usdM: 788.0, kt: 114.5, metal: "steel", metalShare: 0.85, status: "proposed", cluster: "Rajkot, Coimbatore, Pune" },
  { hs: "8481", product: "Taps, valves and similar appliances", usdM: 488.4, kt: 36.8, metal: "steel", metalShare: 0.7, status: "proposed", cluster: "Coimbatore, Ahmedabad" },
  { hs: "8431", product: "Parts for cranes, earth-moving, lifting machinery", usdM: 158.4, kt: 36.7, metal: "steel", metalShare: 0.85, status: "proposed", cluster: "Pune, Chennai" },
  { hs: "7320", product: "Springs", usdM: 31.4, kt: 11.7, metal: "steel", metalShare: 0.95, status: "proposed", cluster: "Pune, Chennai" },
  { hs: "7315", product: "Chains", usdM: 14.1, kt: 3.6, metal: "steel", metalShare: 0.95, status: "proposed", cluster: "Ludhiana" },
  { hs: "7318", product: "Screws, bolts, nuts, washers", usdM: 305.9, kt: 88.2, metal: "steel", metalShare: 0.95, status: "inScope", cluster: "Ludhiana, Jalandhar, Rajkot" },
  { hs: "7326", product: "Other articles of iron or steel", usdM: 294.3, kt: 70.9, metal: "steel", metalShare: 0.95, status: "inScope", cluster: "Moradabad, Ludhiana" },
  { hs: "7304", product: "Seamless tubes and pipes", usdM: 222.6, kt: 30.3, metal: "steel", metalShare: 1, status: "inScope", cluster: "Gujarat, Maharashtra" },
  { hs: "7308", product: "Structures and parts of structures", usdM: 144.0, kt: 67.1, metal: "steel", metalShare: 0.95, status: "inScope", cluster: "Gujarat, Tamil Nadu" },
  { hs: "7306", product: "Welded tubes and pipes", usdM: 138.1, kt: 113.0, metal: "steel", metalShare: 1, status: "inScope", cluster: "Gujarat, Maharashtra" },
  { hs: "7616", product: "Other articles of aluminium", usdM: 77.3, kt: 5.5, metal: "aluminium", metalShare: 0.95, status: "inScope", cluster: "Moradabad" },
  { hs: "7610", product: "Aluminium structures", usdM: 9.5, kt: 1.3, metal: "aluminium", metalShare: 0.95, status: "inScope", cluster: "Gujarat" },
  { hs: "7217", product: "Wire of iron or non-alloy steel", usdM: 2.4, kt: 1.8, metal: "steel", metalShare: 1, status: "inScope", cluster: "Gujarat, Punjab" },
];
