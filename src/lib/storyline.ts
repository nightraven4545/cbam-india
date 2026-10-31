// The engagement storyline: issue tree, hypotheses, workplan and initiatives.
// Numbers quoted in the narrative are computed here from the engine, never typed by hand.
import { COMPETITORS, DOWNSTREAM, PRODUCERS } from "./data";
import { DEFAULT_SCENARIO as S, crossoverPrice, cumulativeExposure, optimiseAllocation, producerSummary, tornado, trajectory } from "./model";
import { article9 } from "./policy";
import { DEFAULT_H2, h2Option } from "./options";
import { DEFAULT_RISK, exposureStats, pricePaths } from "./risk";
import { valueAtStake } from "./roadmap";
import type { INode, GRow } from "@/components/consulting/charts";

const full = { ...S, passThrough: 1 };
const eur = (n: number) => `${n < 0 ? "−" : ""}€${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
const m = (n: number) => `€${Math.round(n / 1e6).toLocaleString("en-IN")}m`;
const bn = (n: number) => `€${(n / 1e9).toFixed(1)}bn`;

export function facts() {
  const steel = PRODUCERS.filter((p) => p.sector === "steel");
  const sums = steel.map((p) => ({ p, r: producerSummary(p, full), t: trajectory(p, full), cumA: cumulativeExposure(p, full, "actual"), cumD: cumulativeExposure(p, full, "default") }));
  const tata = sums.find((x) => x.p.id === "tata")!, jsw = sums.find((x) => x.p.id === "jsw")!;
  const verification = sums.reduce((a, x) => a + x.r.verificationValue, 0);
  const [iv, idf] = COMPETITORS;
  const eu = COMPETITORS.find((c) => c.origin.startsWith("EU"))!;
  const paths = pricePaths(S, DEFAULT_RISK);
  const risk = exposureStats(jsw.p, S, "actual", paths);
  const tor = tornado(jsw.p, S);
  const pol = (mech: "explicit" | "ccts") => article9(S, "steel", { price: 20, mechanism: mech, targetCut: 0.05, qualifying: 0.6 }).reduce((a, r) => a + r.retained, 0);
  const h2 = h2Option(S, DEFAULT_H2);
  const h2first = h2.thresholds.find((t) => t.price !== null);
  const opt = optimiseAllocation(jsw.p, { ...S, year: 2030 }, { euCap: jsw.p.euVolume.value, euPremium: 100 });
  const vas = valueAtStake();
  const dsIn = DOWNSTREAM.filter((d) => d.status === "inScope").reduce((a, d) => a + d.usdM, 0) / 1000;
  const dsProp = DOWNSTREAM.filter((d) => d.status === "proposed").reduce((a, d) => a + d.usdM, 0) / 1000;
  const vedanta = PRODUCERS.find((p) => p.id === "vedanta")!;
  return {
    sums, verification, tata, jsw,
    defaultPerT: tata.r.def.net, verifiedPerT: tata.r.act.net,
    x2034: [Math.min(...sums.map((x) => x.t[8].actual)), Math.max(...sums.map((x) => x.t[8].actual))] as const,
    xEUdefault: crossoverPrice(idf, eu, 2026, "law"), xEUverified: crossoverPrice(iv, eu, 2026, "law"),
    risk, topDriver: tor.rows[0].driver.replace(" ±20%", ""), polExplicit: pol("explicit"), polCcts: pol("ccts"),
    h2, h2first, optUplift: opt.valueOptimised - opt.valueProrata, vas, dsIn, dsProp,
    alVerified: producerSummary(vedanta, full).act.net, alIndirect: producerSummary(vedanta, { ...full, includeIndirect: true }).act.net,
    fmt: { eur, m, bn },
  };
}

export function issueTree(): INode {
  const f = facts();
  return {
    id: "root", q: "How should Indian steel and aluminium producers, and the Indian state, respond to the EU CBAM to protect EU margins over 2026–34?",
    children: [
      { id: "a", q: "A. How large is the exposure, and when does it bite?", status: "answered", children: [
        { id: "a1", q: "What does the regulation actually charge per tonne in 2026?", status: "answered", finding: `${eur(f.defaultPerT)}/t on defaults vs ${eur(f.verifiedPerT)}/t verified for an efficient BF-BOF mill; the "2.5% year" is a myth.`, href: "/model" },
        { id: "a2", q: "How does the bill evolve as free allocation phases out?", status: "answered", finding: `The cliff is 2030 (factor 77.5% → 51.5%); verified BF-BOF steel pays ${eur(f.x2034[0])}–${eur(f.x2034[1])}/t by 2034.`, href: "/" },
        { id: "a3", q: "How uncertain is it?", status: "answered", finding: `JSW 2026–34 exposure: median ${m(f.risk.p50)}, worst-5% average ${m(f.risk.cvar95)} (Monte Carlo).`, href: "/model" },
      ] },
      { id: "b", q: "B. Who is most exposed, and why?", status: "answered", children: [
        { id: "b1", q: "Which producers carry the most € and €/t?", status: "answered", finding: "JSW leads in € (largest EU volume); JSPL and AM/NS lead per tonne (DRI routes get a 0.481 benchmark).", href: "/industry" },
        { id: "b2", q: "Where does India stand against competing origins?", status: "answered", finding: `On defaults India loses to EU mills above ${eur(f.xEUdefault ?? 0)}/tCO₂; verified, it holds until ${eur(f.xEUverified ?? 0)}.`, href: "/model" },
        { id: "b3", q: "Who else is exposed beyond the big mills?", status: "answered", finding: `MSME goods worth US$${f.dsIn.toFixed(1)}bn are already in scope; the 2028 proposal adds US$${f.dsProp.toFixed(1)}bn.`, href: "/policy" },
      ] },
      { id: "c", q: "C. Which levers restore margin, and in what order?", status: "answered", children: [
        { id: "c1", q: "What is verified data worth?", status: "answered", finding: `${m(f.verification)} a year across the five exporters; the highest-return lever in the sector.`, href: "/roadmap" },
        { id: "c2", q: "Which decarbonisation levers pay back?", status: "answered", finding: "Efficiency pays now; scrap and biochar break even on a dedicated EU line; gas DRI, CCUS and H₂ need a premium or a carbon price.", href: "/model" },
        { id: "c3", q: "Can trade allocation and contracts help?", status: "answered", finding: `Routing EU orders to the lowest-carbon plant is worth ${m(f.optUplift)}/yr for JSW in 2030.`, href: "/model" },
        { id: "c4", q: "When should H₂-DRI be built?", status: "partly", finding: f.h2first ? `Option value ${eur(f.h2.optionValue)}/t; optimal only from ${f.h2first.year} above ${eur(f.h2first.price!)}/t.` : "Not before 2035 on current inputs.", href: "/model" },
      ] },
      { id: "d", q: "D. What should government and industry bodies do?", status: "partly", children: [
        { id: "d1", q: "Can India keep the CBAM revenue?", status: "answered", finding: `Explicit €20/t price: ${bn(f.polExplicit)} kept in India; CCTS as designed: ${m(f.polCcts)}.`, href: "/policy" },
        { id: "d2", q: "How should MSMEs be supported?", status: "partly", finding: "Mill-to-MSME verified data sharing beats subsidies; cluster-level MRV desks.", href: "/policy" },
        { id: "d3", q: "What should India negotiate in the FTA?", status: "open", finding: "Article 9 recognition of Indian carbon prices; phasing of the downstream scope.", href: "/roadmap" },
      ] },
    ],
  };
}

export interface Hypothesis { h: string; verdict: "confirmed" | "rejected" | "refined"; evidence: string }
export function hypotheses(): Hypothesis[] {
  const f = facts();
  return [
    { h: "2026 is a cheap \"2.5% year\"", verdict: "rejected", evidence: `The 2.5% applies to the benchmark. Verified BF-BOF already pays ${eur(f.verifiedPerT)}/t; defaults pay ${eur(f.defaultPerT)}/t.` },
    { h: "Verified data is worth more than any furnace upgrade before 2030", verdict: "confirmed", evidence: `${m(f.verification)}/yr for five exporters, against tens of thousands of € per installation to verify.` },
    { h: "Renewable PPAs cut steel CBAM", verdict: "rejected", evidence: "Iron and steel are charged on direct emissions only (Annex II). PPAs matter for CCTS and buyers, not for CBAM." },
    { h: "India is cost-competitive in the EU regardless of CBAM", verdict: "refined", evidence: `True only with verified data (until ${eur(f.xEUverified ?? 0)}/tCO₂). On defaults the edge vanishes above ${eur(f.xEUdefault ?? 0)}.` },
    { h: "Aluminium is the bigger risk than steel", verdict: "refined", evidence: `Today aluminium pays only ${eur(f.alVerified)}/t; if electricity entered scope it would pay ${eur(f.alIndirect)}/t. It is a tail risk, not a current one.` },
    { h: "Green hydrogen DRI pays back on CBAM savings alone", verdict: "rejected", evidence: `NPV ${eur(f.h2.npvNow)}/t if built in 2026; it only works as a staged option, or with a green premium.` },
    { h: "CCTS will let India keep the money", verdict: "rejected", evidence: `An intensity scheme pays only on above-target tonnes: ${m(f.polCcts)} kept vs ${bn(f.polExplicit)} with an explicit price.` },
    { h: "Only large integrated mills are affected", verdict: "rejected", evidence: `Fasteners, tubes and structures (US$${f.dsIn.toFixed(1)}bn) are already in scope, much of it from MSME clusters.` },
  ];
}

export const WORKPLAN: GRow[] = [
  { stream: "Diagnose", task: "Regulation decoded; engine built and unit-tested", start: 1, end: 1, milestone: "Engine signed off" },
  { stream: "Diagnose", task: "Data gathering: defaults, Comtrade, BRSR, CCTS", start: 1, end: 2 },
  { stream: "Deep dives", task: "Producer exposure, risk and sensitivity", start: 2, end: 3 },
  { stream: "Deep dives", task: "Competitiveness, aluminium, cement", start: 3, end: 4, milestone: "Hypotheses tested" },
  { stream: "Solutions", task: "Lever economics, optimiser, H₂ real option", start: 4, end: 5 },
  { stream: "Solutions", task: "Policy: Article 9, MSME radar", start: 4, end: 5 },
  { stream: "Roadmap", task: "Value at stake, prioritisation, roadmap", start: 5, end: 6 },
  { stream: "Roadmap", task: "Executive deck and steering committee", start: 6, end: 6, milestone: "SteerCo" },
];

export interface Initiative {
  id: string; name: string; owner: "Company" | "Government" | "MSME clusters"; horizon: "Now" | "2026–29" | "2030+";
  impact: number; ease: number; kpi: string; first90: string;
}
export function initiatives(): Initiative[] {
  const f = facts();
  const step = (label: string) => -(f.vas.steps.find((s) => s.label === label)?.value ?? 0) / 1e6;
  return [
    { id: "i1", name: "CBAM-grade MRV + accredited verification", owner: "Company", horizon: "Now", impact: step("Verify emissions"), ease: 4.5, kpi: "% of EU tonnes with verified data", first90: "Appoint verifier; map installations to CN codes; submit first verified report" },
    { id: "i2", name: "CBAM cost-sharing clauses in EU contracts", owner: "Company", horizon: "Now", impact: 400, ease: 3.5, kpi: "Pass-through share borne by exporter", first90: "Index clause to the weekly certificate price; renegotiate top-10 EU accounts" },
    { id: "i3", name: "Efficiency stack (WHR, TRT, CDQ, PCI)", owner: "Company", horizon: "2026–29", impact: step("Efficiency stack"), ease: 3.5, kpi: "Direct tCO₂/t at EU-supplying plants", first90: "Energy audit; shortlist projects with < 4-year payback" },
    { id: "i4", name: "Scrap and biochar in BF/BOF", owner: "Company", horizon: "2026–29", impact: step("Scrap + biochar"), ease: 2.5, kpi: "Scrap share; biochar t/yr", first90: "Secure scrap contracts; biochar trials at one BF" },
    { id: "i5", name: "Route lowest-carbon plants to EU orders", owner: "Company", horizon: "Now", impact: step("Route low-carbon plants to EU"), ease: 4, kpi: "EU-weighted intensity vs group average", first90: "Plant-level CBAM cost in S&OP; re-allocate the next EU quarter" },
    { id: "i6", name: "H₂-ready DRI as a staged option", owner: "Company", horizon: "2030+", impact: 250, ease: 1.5, kpi: "Option triggers: certificate price, H₂ cost, premium", first90: "Reserve site and power; gas-DRI FEED with H₂-ready spec" },
    { id: "i7", name: "Explicit, Article 9-creditable carbon price on exports", owner: "Government", horizon: "2026–29", impact: step("Art. 9: pay in India"), ease: 2, kpi: "€ CBAM retained in India", first90: "Design note; consult the EU on evidence requirements" },
    { id: "i8", name: "National CBAM verifier capacity", owner: "Government", horizon: "Now", impact: 300, ease: 3, kpi: "Accredited verifiers; days to verify", first90: "Fast-track accreditation with NABCB; EU mutual recognition talks" },
    { id: "i9", name: "FTA: CCTS recognition and phased downstream scope", owner: "Government", horizon: "2026–29", impact: 500, ease: 1.5, kpi: "Recognition secured; phase-in years", first90: "Negotiating brief using this model's numbers" },
    { id: "i10", name: "Mill-to-MSME verified data sharing", owner: "MSME clusters", horizon: "Now", impact: 120, ease: 4, kpi: "% of MSME EU shipments with supplier data", first90: "Standard data template; pilot in the Ludhiana fastener cluster" },
    { id: "i11", name: "Cluster MRV help-desks (Ludhiana, Rajkot, Moradabad)", owner: "MSME clusters", horizon: "Now", impact: 80, ease: 3.5, kpi: "Firms reporting; cost per report", first90: "Set up with EEPC/FIEO; shared verifier panel" },
    { id: "i12", name: "Green premium offtakes with EU buyers", owner: "Company", horizon: "2030+", impact: 200, ease: 2, kpi: "€/t premium on low-carbon tonnes", first90: "Target automotive and white-goods buyers with Scope 3 targets" },
  ];
}
