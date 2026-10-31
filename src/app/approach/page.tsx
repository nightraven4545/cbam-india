import type { Metadata } from "next";
import { PageHeader, SectionTitle } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import { Plan, Tree } from "@/components/pages/ApproachCharts";
import { PRODUCERS, LEVERS, PEER_DEFAULTS, DOWNSTREAM } from "@/lib/data";
import { WORKPLAN, hypotheses, issueTree } from "@/lib/storyline";

export const metadata: Metadata = { title: "Approach", description: "Issue tree, hypotheses, workplan and data confidence behind the CBAM India analysis." };

const VERDICT: Record<string, string> = { confirmed: "border-s3 text-s3", rejected: "border-s2 text-s2", refined: "border-s1 text-s1" };

export default function Approach() {
  const hs = hypotheses();
  // Data confidence: count every sourced input by grade.
  const grades: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const p of PRODUCERS) for (const k of ["production", "euVolume", "actualDirect", "indirect", "ebitdaEUR"] as const) grades[p[k].confidence]++;
  grades.B += 3 * 4; // CBAM factor path, mark-ups, benchmarks, certificate prices (regulation)
  grades.E += Object.values(PEER_DEFAULTS).flat().length;
  grades.C += DOWNSTREAM.length; // UN Comtrade official statistics
  grades.D += LEVERS.length;
  const total = Object.values(grades).reduce((a, b) => a + b, 0);
  const GRADE_TXT: Record<string, [string, string]> = {
    A: ["Verified installation data", "Not yet public for any Indian producer: the first verified 2026 declarations are due by 30 Sep 2027"],
    B: ["Regulation and official prices", "Already the strongest possible source"],
    C: ["Company disclosures and trade statistics", "Reconcile BRSR to the CBAM installation boundary"],
    D: ["Analyst estimates", "Replace with plant-level CBAM reports and company export splits"],
    E: ["EU default values", "Correct by design: these are what unverified goods are charged"],
  };
  const GRADE_C: Record<string, string> = { A: "var(--s3)", B: "var(--s1)", C: "#5b93dd", D: "var(--s2)", E: "var(--neutral)" };

  return (
    <div>
      <PageHeader step="question" title="We broke one client question into four branches, tested eight hypotheses and built a model of the regulation to answer each"
        lede="This is the problem-solving structure behind the recommendations: the issue tree, what we believed at the start and what the evidence showed, the six-week workplan, and how much each input can be trusted." />

      <div className="grid gap-6">
        <Exhibit n={1} title="Issue tree: the key question splits into four mutually exclusive branches, each answered by a specific analysis"
          subtitle="Expand a branch to see the sub-questions, what we found and where the analysis lives">
          <Tree root={issueTree()} />
        </Exhibit>

        <Exhibit n={2} title={`${hs.filter((h) => h.verdict !== "confirmed").length} of ${hs.length} starting hypotheses were wrong or needed refining; that is where the value of the analysis lies`}
          subtitle="Initial hypotheses, verdict after testing, and the deciding evidence"
          table={{ columns: ["Hypothesis", "Verdict", "Evidence"], rows: hs.map((h) => [h.h, h.verdict, h.evidence]) }}>
          <ul className="grid gap-3 md:grid-cols-2">
            {hs.map((h) => (
              <li key={h.h} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{h.h}</p>
                  <span className={`shrink-0 text-[11px] capitalize rounded-md border px-1.5 py-0.5 ${VERDICT[h.verdict]}`}>{h.verdict}</span>
                </div>
                <p className="text-sm text-ink-2 mt-2">{h.evidence}</p>
              </li>
            ))}
          </ul>
        </Exhibit>

        <Exhibit n={3} title="A six-week plan: diagnose, deep-dive, design solutions, then a roadmap for the steering committee"
          subtitle="Workstreams, activities and milestones (diamonds)">
          <Plan rows={WORKPLAN} />
        </Exhibit>

        <Exhibit n={4} title="Most producer-level inputs are still estimates; the regulation side of the model is solid"
          subtitle={`Every input in the model by confidence grade (${total} inputs) and what would upgrade it`}
          table={{ columns: ["Grade", "What it is", "Inputs", "How to upgrade"], rows: Object.entries(grades).map(([g, n]) => [g, GRADE_TXT[g][0], n, GRADE_TXT[g][1]]) }}>
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-line" role="img" aria-label="Inputs by confidence grade">
            {Object.entries(grades).filter(([, n]) => n > 0).map(([g, n]) => (
              <span key={g} className="h-full flex items-center justify-center text-xs text-white font-medium border-r-2 border-surface last:border-r-0"
                style={{ width: `${(n / total) * 100}%`, background: GRADE_C[g] }}>{g} · {n}</span>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            {Object.entries(GRADE_TXT).map(([g, [what, how]]) => (
              <div key={g} className="border-t-2 pt-2" style={{ borderColor: GRADE_C[g] }}>
                <dt className="font-medium">{g}: {what}</dt>
                <dd className="text-ink-2 mt-1">{how}</dd>
              </div>
            ))}
          </dl>
        </Exhibit>
      </div>

      <SectionTitle title="What the client gets at the end of the six weeks">
        A unit-tested model of the regulation; an exposure diagnosis by producer, route and product; ranked levers with NPV, IRR and real-option timing; a policy position for government; and a sequenced roadmap with owners and KPIs.
      </SectionTitle>
    </div>
  );
}
