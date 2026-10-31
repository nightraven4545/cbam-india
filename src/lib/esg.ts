// ESG & carbon-markets module: carbon-price ladder, disclosure-framework map, producer ESG scorecard,
// net-zero arithmetic and greenwashing tests. Every figure carries a source and a grade; gaps stay "Not disclosed".
import { CERT_PRICES_2026 } from "./cbam";
import type { Confidence } from "./data";

// shortcut: one FX rate for converting USD-quoted prices; refine with a dated ECB reference rate if prices are compared over time.
export const USD_PER_EUR = 1.16;

export interface PricePoint { id: string; name: string; flag: "EU" | "CN" | "KR" | "IN"; eur: number | null; native: string; kind: "Compliance" | "Border" | "Baseline-and-credit"; source: string; grade: Confidence }
export const PRICE_LADDER: PricePoint[] = [
  { id: "eua", name: "EU ETS allowance (spot, 30 Oct 2026)", flag: "EU", eur: 89.19, native: "€89.19", kind: "Compliance", source: "Trading Economics EU Carbon Permits, 30 Oct 2026", grade: "C" },
  { id: "cbam", name: "CBAM certificate (Q3 2026)", flag: "EU", eur: CERT_PRICES_2026.Q3, native: `€${CERT_PRICES_2026.Q3}`, kind: "Border", source: "European Commission, DG TAXUD", grade: "B" },
  { id: "cn", name: "China national ETS", flag: "CN", eur: 9.85 / USD_PER_EUR, native: "¥70.78 ($9.85)", kind: "Compliance", source: "ICAP, China National ETS factsheet", grade: "C" },
  { id: "kr", name: "Korea ETS (auction average)", flag: "KR", eur: 6.99 / USD_PER_EUR, native: "₩9,956 ($6.99)", kind: "Compliance", source: "ICAP, Korea ETS factsheet", grade: "C" },
  { id: "in", name: "India CCTS (credits not yet traded)", flag: "IN", eur: null, native: "No price discovered", kind: "Baseline-and-credit", source: "MoEFCC/BEE CCTS notifications; ICAP", grade: "C" },
];
// The border gap: what CBAM still collects per chargeable tonne after crediting the origin price (Article 9).
export const borderGap = (p: PricePoint) => CERT_PRICES_2026.Q3 - Math.min(CERT_PRICES_2026.Q3, p.eur ?? 0);

// Disclosure frameworks × what they require. ✓ = required, ◐ = partial / phased / optional, – = not covered. Analyst mapping (grade C).
export type Mark = "yes" | "part" | "no";
export const REQUIREMENTS = ["Scope 1", "Scope 2", "Scope 3", "Product footprint", "Installation-level data", "Transition plan", "Third-party assurance", "Target validation"] as const;
export const FRAMEWORKS: { id: string; name: string; owner: string; flag: "EU" | "IN" | null; marks: Mark[]; note: string }[] = [
  { id: "ghgp", name: "GHG Protocol", owner: "WRI / WBCSD", flag: null, marks: ["yes", "yes", "part", "part", "no", "no", "no", "no"], note: "The accounting base every other framework builds on; Scope 3 and product footprints sit in separate standards." },
  { id: "brsr", name: "BRSR Core", owner: "SEBI", flag: "IN", marks: ["yes", "yes", "part", "no", "no", "no", "yes", "no"], note: "Top 1,000 listed companies; GHG intensity under reasonable assurance, value-chain disclosure phasing in." },
  { id: "issb", name: "IFRS S2", owner: "ISSB", flag: null, marks: ["yes", "yes", "yes", "no", "no", "yes", "part", "part"], note: "Investor-facing climate disclosure; assurance depends on the adopting jurisdiction." },
  { id: "esrs", name: "ESRS E1 (CSRD)", owner: "EU", flag: "EU", marks: ["yes", "yes", "yes", "no", "no", "yes", "yes", "part"], note: "What EU buyers report, and therefore ask suppliers for." },
  { id: "cbam", name: "CBAM declaration", owner: "EU", flag: "EU", marks: ["yes", "part", "part", "yes", "yes", "no", "yes", "no"], note: "Embedded emissions per good from accredited installation-level verification; indirect charged for cement only." },
  { id: "gst", name: "Green Steel Taxonomy", owner: "Ministry of Steel", flag: "IN", marks: ["yes", "yes", "part", "yes", "yes", "no", "yes", "no"], note: "Star rating per tonne of finished steel; covers Scope 1, 2 and part of Scope 3 to the finished product." },
  { id: "sbti", name: "SBTi steel guidance", owner: "SBTi", flag: null, marks: ["yes", "yes", "yes", "no", "no", "part", "no", "yes"], note: "Validates 1.5 °C-aligned targets; no Indian integrated steelmaker had a validated target in our search." },
  { id: "rs", name: "ResponsibleSteel", owner: "ResponsibleSteel", flag: null, marks: ["yes", "yes", "part", "yes", "yes", "yes", "yes", "part"], note: "Site certification plus certified-steel product claims." },
];
// How many frameworks a dataset feeds: the reuse argument for building installation-level data once.
export const reuse = (req: number) => FRAMEWORKS.filter((f) => f.marks[req] !== "no").length;

// Producer climate disclosures (FY = Indian fiscal year ending March). null = not disclosed in the sources we found.
export interface EsgProfile {
  id: string; name: string;
  intensity: number | null; intensityYear: string | null; intensityHistory?: { year: number; v: number }[];
  target2030: number | null; targetNote: string;
  netZero: number | null; netZeroNote?: string;
  reShare: number | null;
  source: string; grade: Confidence;
}
export const ESG: EsgProfile[] = [
  {
    id: "tata", name: "Tata Steel (India)",
    intensity: 2.46, intensityYear: "FY25",
    intensityHistory: [{ year: 2021, v: 2.32 }, { year: 2022, v: 2.43 }, { year: 2023, v: 2.38 }, { year: 2024, v: 2.43 }, { year: 2025, v: 2.46 }],
    target2030: 1.8, targetNote: "< 1.8 tCO₂/tcs by 2030", netZero: 2045, reShare: null,
    source: "Tata Steel IR 2024-25 ESG factsheet (Tata Steel standalone, Scope 1+2)", grade: "B",
  },
  {
    id: "jsw", name: "JSW Steel", intensity: 2.36, intensityYear: "FY23",
    // 2005 base derived from the stated target: 1.95 = 58% of base (−42%).
    intensityHistory: [{ year: 2005, v: +(1.95 / 0.58).toFixed(2) }, { year: 2023, v: 2.36 }],
    target2030: 1.95, targetNote: "< 1.95 tCO₂/tcs by 2030 (three integrated plants, −42% vs FY2005)", netZero: 2050, reShare: null,
    source: "JSW Climate Action Report 2024", grade: "C",
  },
  {
    id: "jspl", name: "Jindal Steel (JSPL)", intensity: 2.79, intensityYear: "FY25",
    intensityHistory: [{ year: 2005, v: 3.0 }, { year: 2025, v: 2.79 }],
    target2030: 2.1, targetNote: "−30% vs the 2005 base of 3.0 tCO₂/tcs by 2030", netZero: 2047, netZeroNote: "aspiration 2035", reShare: 0.000097,
    source: "Jindal Steel ESG profile and FY2024-25 GRI Sustainability Report", grade: "B",
  },
  {
    id: "amns", name: "AM/NS India", intensity: null, intensityYear: null,
    target2030: null, targetNote: "−25% intensity by 2030 (base not stated in our source)", netZero: 2050, reShare: null,
    source: "IEEFA, Steel Decarbonisation in India; AM/NS Climate Action Report 2024", grade: "C",
  },
  {
    id: "sail", name: "SAIL", intensity: null, intensityYear: null,
    target2030: 1.8, targetNote: "1.8 tCO₂/tcs by 2030 (−20%)", netZero: 2070, reShare: null,
    source: "Indian Steel Association roadmap (worldsteel); IEEFA", grade: "C",
  },
];

// India Green Steel Taxonomy (Ministry of Steel, Dec 2024): tCO₂e per tonne of finished steel.
export const TAXONOMY = { green: 2.2, bands: [{ stars: 5, below: 1.6 }, { stars: 4, below: 2.0 }, { stars: 3, below: 2.2 }] };
// shortcut: corporate Scope 1+2 per tonne of crude steel is used as a proxy for the taxonomy's finished-steel boundary.
export function taxonomyStars(intensity: number | null): number | null {
  if (intensity === null) return null;
  return TAXONOMY.bands.find((b) => intensity < b.below)?.stars ?? 0;
}

// Annual rate of change needed to move from the latest intensity to the 2030 target (negative = cut).
export function requiredRate(p: EsgProfile, toYear = 2030): number | null {
  if (p.intensity === null || p.target2030 === null || !p.intensityYear) return null;
  const from = 2000 + Number(p.intensityYear.slice(2));
  return Math.pow(p.target2030 / p.intensity, 1 / (toYear - from)) - 1;
}
// Historical compound rate over the disclosed series.
export function historicRate(p: EsgProfile): number | null {
  const h = p.intensityHistory;
  if (!h || h.length < 2) return null;
  const a = h[0], b = h[h.length - 1];
  return Math.pow(b.v / a.v, 1 / (b.year - a.year)) - 1;
}

// Pathway series for the chart: reported history, then a straight line to the 2030 target and to zero at the net-zero year.
export function pathway(p: EsgProfile) {
  if (p.intensity === null || !p.intensityYear) return [];
  const start = 2000 + Number(p.intensityYear.slice(2));
  const pts: { year: number; reported?: number; target?: number }[] = (p.intensityHistory ?? [{ year: start, v: p.intensity }]).map((h) => ({ year: h.year, reported: h.v }));
  const anchors = [{ year: start, v: p.intensity }, ...(p.target2030 !== null ? [{ year: 2030, v: p.target2030 }] : []), ...(p.netZero ? [{ year: p.netZero, v: 0 }] : [])];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i], b = anchors[i + 1];
    for (let y = a.year; y <= b.year; y++) {
      const v = a.v + ((b.v - a.v) * (y - a.year)) / (b.year - a.year);
      const row = pts.find((r) => r.year === y);
      if (row) row.target = v; else pts.push({ year: y, target: v });
    }
  }
  return pts.sort((x, y) => x.year - y.year);
}

// Greenwashing-risk tests derived from the disclosures, following CCPA (India, 2024) and EU Directive 2024/825 principles:
// claims must be specific, substantiated, consistent with the trajectory and boundary-explicit.
export type Rag = "red" | "amber" | "green";
export const GW_TESTS = [
  { id: "disclosed", label: "Intensity disclosed with year and boundary", basis: "CCPA 2024: claims must be backed by verifiable data" },
  { id: "trajectory", label: "Recent trend consistent with the 2030 target", basis: "Directive 2024/825: future claims need a realistic, monitored plan" },
  { id: "absolute", label: "Absolute target alongside the intensity target", basis: "Intensity-only targets allow emissions to grow with output" },
  { id: "netzero", label: "Net-zero year 2050 or earlier", basis: "Paris-aligned corporate standards" },
  { id: "re", label: "Renewable share disclosed", basis: "Scope 2 claims need a stated energy mix" },
] as const;
export function greenwashTests(p: EsgProfile): Record<(typeof GW_TESTS)[number]["id"], Rag> {
  const req = requiredRate(p), hist = historicRate(p);
  const trajectory: Rag = req === null ? "amber" : hist === null ? "amber" : hist > 0 ? "red" : hist <= req ? "green" : "amber";
  return {
    disclosed: p.intensity === null ? "red" : "green",
    trajectory,
    absolute: "amber", // none of the five states an absolute steel target in the sources we found
    netzero: p.netZero === null ? "red" : p.netZero <= 2050 ? "green" : "red",
    re: p.reShare === null ? "red" : p.reShare < 0.05 ? "amber" : "green",
  };
}

export const CASES = [
  { who: "DWS (Deutsche Bank asset management)", where: "US SEC, 2023", what: "US$19m penalty for misstating how ESG factors were integrated into investment decisions.", lesson: "Process claims need evidence that the process actually runs." },
  { who: "KLM \"Fly Responsibly\"", where: "Amsterdam District Court, 2024", what: "Ads implying offsets and sustainable fuel made flying sustainable were held misleading.", lesson: "Offsets cannot carry a product sustainability claim, and they do nothing for CBAM." },
  { who: "HSBC", where: "UK Advertising Standards Authority, 2022", what: "Climate ads banned for omitting the bank's continued fossil-fuel financing.", lesson: "Selective disclosure is misleading even when every stated fact is true." },
];

// India's carbon-pricing stack, bottom (oldest) to top (the CBAM link).
export const STACK = [
  { id: "pat", name: "PAT and ESCerts", years: "2012 onwards", what: "Energy-intensity targets for designated consumers; over-achievers earn tradable Energy Saving Certificates.", status: "Being folded into CCTS" },
  { id: "ccts", name: "CCTS compliance market", years: "Notified 2023; targets for FY2025-26 and FY2026-27", what: "GHG-intensity targets for nine sectors including steel, aluminium and cement; surplus earns Carbon Credit Certificates.", status: "Targets notified; trading not yet started" },
  { id: "offset", name: "CCTS offset mechanism", years: "From 2024", what: "Voluntary projects outside the compliance sectors can issue credits under approved methodologies.", status: "Methodologies being approved" },
  { id: "art9", name: "Article 9 link to CBAM", years: "Open question", what: "A carbon price effectively paid in India can be deducted from CBAM. An intensity scheme only creates a price on tonnes above target.", status: "Not recognised by the EU yet" },
];
