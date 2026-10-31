import type { Metadata } from "next";
import { PageHeader } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import MiniWaterfall from "@/components/pages/MiniWaterfall";
import { Prioritisation } from "@/components/pages/RoadmapCharts";
import { facts, initiatives, type Initiative } from "@/lib/storyline";

export const metadata: Metadata = { title: "Roadmap", description: "Value at stake, prioritised initiatives and a three-horizon roadmap for responding to EU CBAM." };

const MODELLED = new Set(["i1", "i3", "i4", "i5", "i7"]);
const OWNERS: Initiative["owner"][] = ["Company", "Government", "MSME clusters"];
const HORIZONS: Initiative["horizon"][] = ["Now", "2026–29", "2030+"];
const TONE: Record<Initiative["owner"], "s1" | "s2" | "s3"> = { Company: "s1", Government: "s2", "MSME clusters": "s3" };

export default function Roadmap() {
  const f = facts();
  const { bn, m } = f.fmt;
  const ins = initiatives();
  const num = new Map(ins.map((x, i) => [x.id, i + 1]));
  const points = ins.map((x) => ({ name: `${num.get(x.id)}. ${x.name}`, label: String(num.get(x.id)), x: x.ease, y: Math.log10(Math.max(10, x.impact)), z: 1, tone: TONE[x.owner] }));
  const quick = ins.filter((x) => x.ease >= 3 && x.impact >= 300).map((x) => num.get(x.id)).join(", ");

  return (
    <div>
      <PageHeader step="answer" title={`Twelve initiatives across companies, government and MSME clusters; five modelled moves alone cut the 2026–34 bill from ${bn(f.vas.doNothing)} to ${bn(f.vas.residual)}`}
        lede="The roadmap turns the analysis into owned, sequenced work: what it is worth, how hard it is, who does it, when, and the first 90 days." />

      <div className="grid gap-6">
        <Exhibit n={1} title={`Value at stake: verification removes ${bn(-f.vas.steps[1].value)}; operations and Article 9 take the residual to ${bn(f.vas.residual)}`}
          subtitle="Cumulative CBAM paid to the EU 2026–34 by the five largest steel exporters, € million, moves applied in sequence (orange = bill, green = reduction)"
          source="Model outputs at €82.32/t growing 3%/yr, law-in-force phase-out, 100% pass-through. Efficiency −0.2 t from 2027; scrap + biochar −0.25 t from 2028; plant routing from plant-level intensities; Article 9 at an explicit €20/t on 60% of exports."
          table={{ columns: ["Step", "€ million"], rows: f.vas.steps.map((s) => [s.label, Math.round(s.value / 1e6)]) }}>
          <MiniWaterfall steps={f.vas.steps} height={360} />
        </Exhibit>

        <Exhibit n={2} title={`Initiatives ${quick} are the quick wins: high value and easy to start this quarter`}
          subtitle="Each initiative's 2026–34 value (log scale) against ease of implementation; colour = owner (blue company, orange government, green MSME clusters)"
          source={`Values for initiatives ${[...MODELLED].map((id) => num.get(id)).join(", ")} come from the model; the others are analyst estimates (grade D). Ease scored 1–5 on capex, time and dependencies.`}
          table={{ columns: ["#", "Initiative", "Owner", "Horizon", "Value € m", "Ease", "Basis"], rows: ins.map((x) => [num.get(x.id)!, x.name, x.owner, x.horizon, Math.round(x.impact), x.ease, MODELLED.has(x.id) ? "Modelled" : "Estimate"]) }}>
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <Prioritisation points={points} />
            <ol className="text-sm space-y-1.5 self-center">
              {ins.map((x) => (
                <li key={x.id} className="flex gap-2"><span className="w-5 shrink-0 text-right font-medium" style={{ color: `var(--${TONE[x.owner]}i)` }}>{num.get(x.id)}</span><span className="text-ink-2">{x.name}</span></li>
              ))}
            </ol>
          </div>
        </Exhibit>

        <Exhibit n={3} title="The roadmap: start with data, contracts and routing now; build the policy case in parallel; hold hydrogen as an option for after 2030"
          subtitle="Initiatives by owner and horizon, with the first 90 days of work"
          table={{ columns: ["#", "Initiative", "Owner", "Horizon", "First 90 days", "KPI"], rows: ins.map((x) => [num.get(x.id)!, x.name, x.owner, x.horizon, x.first90, x.kpi]) }}>
          <div tabIndex={0} className="overflow-x-auto">
            <div className="min-w-[760px] grid grid-cols-[140px_repeat(3,1fr)] gap-px rounded-lg border border-line bg-line overflow-hidden text-sm">
              <div className="bg-sunken p-3" />
              {HORIZONS.map((h) => <div key={h} className="bg-sunken p-3 font-semibold">{h}</div>)}
              {OWNERS.map((o) => (
                <div key={o} className="contents">
                  <div className="bg-surface p-3 font-semibold border-l-4" style={{ borderLeftColor: `var(--${TONE[o]})` }}>{o}</div>
                  {HORIZONS.map((h) => (
                    <div key={h} className="bg-surface p-2 space-y-2">
                      {ins.filter((x) => x.owner === o && x.horizon === h).map((x) => (
                        <div key={x.id} className="rounded-md border border-line p-2.5">
                          <p className="font-medium leading-snug"><span className="text-ink-3">{num.get(x.id)}.</span> {x.name}</p>
                          <p className="text-xs text-ink-2 mt-1">First 90 days: {x.first90}</p>
                          <p className="text-xs mt-1"><span className="text-ink-3">Value</span> {m(x.impact * 1e6)}{MODELLED.has(x.id) ? "" : " (est.)"} <span className="text-ink-3 ml-2">KPI</span> {x.kpi}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Exhibit>

        <Exhibit n={4} title="Six KPIs tell the steering committee whether the response is on track"
          subtitle="Tracked quarterly; targets are proposals for discussion">
          <div tabIndex={0} className="overflow-x-auto">
            <table className="dtable">
              <thead><tr><th>KPI</th><th>Why it matters</th><th>Baseline</th><th>2027 target</th><th>2030 target</th></tr></thead>
              <tbody>
                <tr><td>EU tonnes with verified CBAM data</td><td>Removes the default penalty</td><td>~0%</td><td>100%</td><td>100%</td></tr>
                <tr><td>EU-weighted direct intensity (t/t)</td><td>Drives certificates owed</td><td>2.0–2.6</td><td>−0.2</td><td>−0.45</td></tr>
                <tr><td>Exporter share of CBAM cost</td><td>Contract terms set who pays</td><td>~50%</td><td>≤ 40%</td><td>≤ 35%</td></tr>
                <tr><td>CBAM € per EU tonne (2026)</td><td>Headline exposure</td><td>{f.fmt.eur(f.verifiedPerT)} verified · {f.fmt.eur(f.defaultPerT)} default</td><td>At or below the verified path</td><td>At or below the verified path</td></tr>
                <tr><td>€ retained in India via Article 9</td><td>Policy outcome</td><td>€0</td><td>Design agreed</td><td>{m(f.polExplicit / 9)}/yr</td></tr>
                <tr><td>MSME EU shipments with supplier data</td><td>Downstream readiness</td><td>Low</td><td>50%</td><td>90%</td></tr>
              </tbody>
            </table>
          </div>
        </Exhibit>
      </div>
    </div>
  );
}
