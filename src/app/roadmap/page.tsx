import type { Metadata } from "next";
import { PageHeader } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import MiniWaterfall from "@/components/pages/MiniWaterfall";
import { Prioritisation } from "@/components/pages/RoadmapCharts";
import { facts, initiatives, type Initiative } from "@/lib/storyline";
import { HarveyTable } from "@/components/consulting/exhibits";
import { leverAssessment } from "@/lib/exhibits";
import { DEFAULT_SCENARIO } from "@/lib/model";
import { KpiStrip } from "@/components/consulting/KpiStrip";
import { Takeaway, Toc } from "@/components/consulting/ApproachParts";
import { HORIZON, InitiativeCard, KpiCards, OWNER, OwnerLegend, RoadmapGantt, type KpiDef } from "@/components/pages/RoadmapParts";
import { Euro, Flame, Handshake, Landmark, ShieldCheck, Target, TriangleAlert, Users, Zap } from "lucide-react";

const TOC = [
  { id: "value", label: "Value at stake" }, { id: "priorities", label: "Priorities" }, { id: "levers", label: "Lever assessment" },
  { id: "timeline", label: "Timeline 2026–34" }, { id: "plan", label: "Owners & first 90 days" }, { id: "kpis", label: "KPIs" },
];

export const metadata: Metadata = { title: "Roadmap", description: "Value at stake, prioritised initiatives and a three-horizon roadmap for responding to EU CBAM." };

const MODELLED = new Set(["i1", "i3", "i4", "i5", "i7"]);
const OWNERS: Initiative["owner"][] = ["Company", "Government", "MSME clusters"];
const HORIZONS: Initiative["horizon"][] = ["Now", "2026–29", "2030+"];
const TONE = Object.fromEntries(Object.entries(OWNER).map(([k, v]) => [k, v.tone])) as Record<Initiative["owner"], "s1" | "s2" | "s3">;

export default function Roadmap() {
  const f = facts();
  const { bn, m } = f.fmt;
  const ins = initiatives();
  const num = new Map(ins.map((x, i) => [x.id, i + 1]));
  const points = ins.map((x) => ({ name: `${num.get(x.id)}. ${x.name}`, label: String(num.get(x.id)), x: x.ease, y: Math.log10(Math.max(10, x.impact)), z: 1, tone: TONE[x.owner] }));
  const jsw = f.jsw.p;
  const assess = leverAssessment(jsw, DEFAULT_SCENARIO, { dedicatedEU: false, cctsPrice: 0, greenPremium: 0, discount: 0.1 });
  const allRound = assess.filter((a) => Math.min(...a.scores) >= 2).map((a) => a.l.name.split(" (")[0]);
  const quickIds = ins.filter((x) => x.ease >= 3 && x.impact >= 300);
  const quick = quickIds.map((x) => num.get(x.id)).join(", ");
  const verifyShare = Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100);
  const nowCount = ins.filter((x) => x.horizon === "Now").length;
  const kpis: KpiDef[] = [
    { I: ShieldCheck, kpi: "EU tonnes with verified CBAM data", why: "Removes the default penalty", steps: ["~0%", "100%", "100%"] },
    { I: Flame, kpi: "EU-weighted direct intensity", why: "Drives the certificates owed", steps: ["2.0–2.6 t", "−0.2 t", "−0.45 t"] },
    { I: Handshake, kpi: "Exporter share of CBAM cost", why: "Contract terms decide who pays", steps: ["~50%", "≤ 40%", "≤ 35%"] },
    { I: Euro, kpi: "CBAM € per EU tonne", why: "Headline exposure (2026 base)", steps: [`${f.fmt.eur(f.verifiedPerT)} / ${f.fmt.eur(f.defaultPerT)}`, "≤ verified path", "≤ verified path"] },
    { I: Landmark, kpi: "€ retained in India via Article 9", why: "Policy outcome", steps: ["€0", "Design agreed", `${m(f.polExplicit / 9)}/yr`], law: "proposal" },
    { I: Users, kpi: "MSME EU shipments with supplier data", why: "Downstream readiness", steps: ["Low", "50%", "90%"] },
  ];

  return (
    <div>
      <PageHeader step="answer" title={`Twelve initiatives across companies, government and MSME clusters; five modelled moves alone cut the 2026–34 bill from ${bn(f.vas.doNothing)} to ${bn(f.vas.residual)}`}
        lede="The roadmap turns the analysis into owned, sequenced work: what it is worth, how hard it is, who does it, when, and the first 90 days." />

      <KpiStrip items={[
        { icon: TriangleAlert, value: bn(f.vas.doNothing), label: "2026–34 bill if the top five do nothing", tone: "s2" },
        { icon: Target, value: bn(f.vas.residual), label: "Residual after the five modelled moves", tone: "s3" },
        { icon: ShieldCheck, value: `${verifyShare}%`, label: "of the saving comes from verified data alone", tone: "s1" },
        { icon: Zap, value: `${nowCount} of ${ins.length}`, label: `initiatives start now; ${quickIds.length} are quick wins`, tone: "ink" },
      ]} />

      <div className="mt-8 xl:grid xl:grid-cols-[1fr_200px] xl:gap-10">
        <div className="grid gap-6 min-w-0">
          <section id="value" className="grid gap-4 scroll-mt-20">
            <Takeaway>{`Verification is the single biggest move: it removes ${bn(-f.vas.steps[1].value)} before any plant is touched. Operations and Article 9 then take the bill to ${bn(f.vas.residual)}.`}</Takeaway>
            <Exhibit n={1} title={`Value at stake: verification removes ${bn(-f.vas.steps[1].value)}; operations and Article 9 take the residual to ${bn(f.vas.residual)}`}
              subtitle="Cumulative CBAM paid to the EU 2026–34 by the five largest steel exporters, € million, moves applied in sequence (grey = bill, green = reduction)"
              source="Model outputs at €82.32/t growing 3%/yr, law-in-force phase-out, 100% pass-through. Efficiency −0.2 t from 2027; scrap + biochar −0.25 t from 2028; plant routing from plant-level intensities; Article 9 at an explicit €20/t on 60% of exports."
              table={{ columns: ["Step", "€ million"], rows: f.vas.steps.map((s) => [s.label, Math.round(s.value / 1e6)]) }}>
              <MiniWaterfall steps={f.vas.steps} height={380} />
            </Exhibit>
          </section>

          <section id="priorities" className="grid gap-4 scroll-mt-20">
            <Exhibit n={2} title={`Initiatives ${quick} are the quick wins: high value and easy to start this quarter`}
              subtitle="Each initiative's 2026–34 value (log scale) against ease of implementation; colour = owner"
              source={`Values for initiatives ${[...MODELLED].map((id) => num.get(id)).join(", ")} come from the model; the others are analyst estimates (grade D). Ease scored 1–5 on capex, time and dependencies.`}
              table={{ columns: ["#", "Initiative", "Owner", "Horizon", "Value € m", "Ease", "Basis"], rows: ins.map((x) => [num.get(x.id)!, x.name, x.owner, x.horizon, Math.round(x.impact), x.ease, MODELLED.has(x.id) ? "Modelled" : "Estimate"]) }}>
              <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div><Prioritisation points={points} /><div className="mt-2"><OwnerLegend /></div></div>
                <ol className="text-sm space-y-1.5 self-center">
                  {ins.map((x) => { const { I } = OWNER[x.owner]; return (
                    <li key={x.id} className="flex items-start gap-2">
                      <span className="w-5 shrink-0 text-right font-semibold tabular-nums" style={{ color: `var(--${TONE[x.owner]}i)` }}>{num.get(x.id)}</span>
                      <I aria-label={x.owner} role="img" size={14} className="mt-0.5 shrink-0" style={{ color: `var(--${TONE[x.owner]}i)` }} />
                      <span className="text-ink-2">{x.name}{quickIds.includes(x) && <Zap aria-label="quick win" role="img" size={13} className="inline ml-1 -mt-0.5 text-s2i" />}</span>
                    </li>
                  ); })}
                </ol>
              </div>
            </Exhibit>
          </section>

          <section id="levers" className="grid gap-4 scroll-mt-20">
            <Exhibit n={3} title={`${allRound.length === 1 ? `${allRound[0]} is the only steel lever` : `${allRound.length} levers`} scoring medium or better on every test; deep-cut levers matter most for CBAM but are costly and immature`}
              subtitle={`Steel decarbonisation levers scored 0–4 on five criteria, ${jsw.name} as the reference producer, base scenario`}
              source="Scores derived from the model: CBAM relevance from the direct cut; cost from MAC against the 2030 certificate price; payback from 10%-discounted cash flows; maturity from TRL (IEA); capex per tonne of capacity. Lever data grade D (IEA, MoS, TERI)."
              table={{ columns: ["Lever", "CBAM relevance", "Cost vs certificate", "Payback", "Maturity", "Capex-light"], rows: assess.map((a) => [a.l.name, ...a.scores]) }}>
              <HarveyTable rows={assess.map((a) => ({ id: a.l.id, name: a.l.name, scores: a.scores }))} />
            </Exhibit>
          </section>

          <section id="timeline" className="grid gap-4 scroll-mt-20">
            <Takeaway>{`Front-load the no-regret work: ${ins.filter((x) => x.end <= 2028).length} of ${ins.length} initiatives finish by 2028, before the default mark-up hits 30% and free allocation falls to 51.5% in 2030.`}</Takeaway>
            <Exhibit n={4} title="The work is front-loaded into 2026–28 so the business is ready before the 2030 cash cliff; hydrogen and premiums run as options beyond it"
              subtitle="Proposed timing of the twelve initiatives against EU regulatory milestones, 2026–34"
              source="Initiative timing and milestones are an analyst proposal for discussion; regulatory dates from Regulation (EU) 2023/956, Implementing Regulations 2025/2620–2621 and the open proposals COM(2025) 989 and COM(2026) 616."
              table={{ columns: ["#", "Initiative", "Owner", "Start", "End", "Milestone"], rows: ins.map((x) => [num.get(x.id)!, x.name, x.owner, x.start, x.end, x.milestone ? `${x.milestone.year}: ${x.milestone.label}` : ""]) }}>
              <RoadmapGantt items={ins} num={num} />
            </Exhibit>
          </section>

          <section id="plan" className="grid gap-4 scroll-mt-20">
            <Exhibit n={5} title="The roadmap: start with data, contracts and routing now; build the policy case in parallel; hold hydrogen as an option for after 2030"
              subtitle="Initiatives by owner and horizon, with the first 90 days of work, value and next milestone"
              table={{ columns: ["#", "Initiative", "Owner", "Horizon", "First 90 days", "KPI"], rows: ins.map((x) => [num.get(x.id)!, x.name, x.owner, x.horizon, x.first90, x.kpi]) }}>
              <div tabIndex={0} role="region" aria-label="Roadmap swimlanes" className="overflow-x-auto">
                <div className="min-w-[760px] grid grid-cols-[150px_repeat(3,1fr)] gap-px rounded-lg border border-line bg-line overflow-hidden text-sm">
                  <div className="bg-sunken p-3" />
                  {HORIZONS.map((h) => { const { I, hint } = HORIZON[h]; return <div key={h} className="bg-sunken p-3"><p className="font-semibold inline-flex items-center gap-1.5"><I aria-hidden size={15} className="text-ink-2" />{h}</p><p className="text-xs text-ink-3">{hint}</p></div>; })}
                  {OWNERS.map((o) => { const { I } = OWNER[o]; return (
                    <div key={o} className="contents">
                      <div className="bg-surface p-3 font-semibold border-l-4 flex items-start gap-1.5" style={{ borderLeftColor: `var(--${TONE[o]})`, color: `var(--${TONE[o]}i)` }}><I aria-hidden size={16} className="mt-0.5 shrink-0" />{o}</div>
                      {HORIZONS.map((h) => (
                        <div key={h} className="bg-surface p-2 space-y-2">
                          {ins.filter((x) => x.owner === o && x.horizon === h).map((x) => (
                            <InitiativeCard key={x.id} x={x} n={num.get(x.id)!} modelled={MODELLED.has(x.id)} value={m(x.impact * 1e6)} />
                          ))}
                        </div>
                      ))}
                    </div>
                  ); })}
                </div>
              </div>
            </Exhibit>
          </section>

          <section id="kpis" className="grid gap-4 scroll-mt-20">
            <Exhibit n={6} title="Six KPIs tell the steering committee whether the response is on track"
              subtitle="Tracked quarterly; targets are proposals for discussion"
              table={{ columns: ["KPI", "Why it matters", "Baseline", "2027", "2030"], rows: kpis.map((k) => [k.kpi, k.why, ...k.steps]) }}>
              <KpiCards items={kpis} />
            </Exhibit>
          </section>
        </div>
        <Toc items={TOC} />
      </div>
    </div>
  );
}
