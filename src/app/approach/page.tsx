import type { Metadata } from "next";
import { PageHeader } from "@/components/consulting/core";
import TreeDiagram from "@/components/consulting/TreeDiagram";
import { HypothesisScorecard, Takeaway, Toc, Workflow } from "@/components/consulting/ApproachParts";
import { TimeIcon } from "@/components/visual/icons";
import { Exhibit } from "@/components/consulting/Exhibit";
import { Plan } from "@/components/pages/ApproachCharts";
import { PRODUCERS, LEVERS, PEER_DEFAULTS, DOWNSTREAM } from "@/lib/data";
import { WORKPLAN, hypotheses, issueTree } from "@/lib/storyline";

export const metadata: Metadata = { title: "Approach", description: "Issue tree, hypotheses, workplan and data confidence behind the CBAM India analysis." };


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

  const wrong = hs.filter((h) => h.verdict !== "confirmed").length;
  const TOC = [
    { id: "workflow", label: "How the work flows" }, { id: "tree", label: "Issue tree" }, { id: "hypotheses", label: "Hypotheses tested" },
    { id: "plan", label: "Six-week plan" }, { id: "confidence", label: "Data confidence" },
  ];
  return (
    <div className="xl:grid xl:grid-cols-[1fr_190px] xl:gap-10">
      <div className="min-w-0">
        <PageHeader step="question" title="One client question, four branches, eight hypotheses tested against a model of the regulation"
          lede={<span className="inline-flex items-center gap-2 text-sm"><TimeIcon aria-hidden size={15} className="text-ink-3" />3-minute read. Select any box in the issue tree to see what we found.</span>} />

        <section id="workflow" className="scroll-mt-20 space-y-4">
          <Takeaway>Every number on this site comes out of one tested engine, so the recommendations trace back to the regulation and the data.</Takeaway>
          <Exhibit n={1} title="How the work flows from sources to the roadmap" subtitle="Select a step to open the page behind it">
            <Workflow />
          </Exhibit>
        </section>

        <section id="tree" className="scroll-mt-20 space-y-4 mt-10">
          <Takeaway>The question splits into four branches with no overlap; three are fully answered, and the government branch is partly open.</Takeaway>
          <Exhibit n={2} title="Issue tree: the key question splits into four mutually exclusive branches">
            <TreeDiagram root={issueTree()} />
          </Exhibit>
        </section>

        <section id="hypotheses" className="scroll-mt-20 space-y-4 mt-10">
          <Takeaway>{wrong} of {hs.length} starting beliefs were wrong or needed refining; that is where the analysis earns its keep.</Takeaway>
          <Exhibit n={3} title="Hypotheses we started with, and the number that decided each"
            subtitle="Select a row for the evidence"
            table={{ columns: ["Hypothesis", "Verdict", "Deciding figure", "Evidence"], rows: hs.map((h) => [h.h, h.verdict, `${h.figure} (${h.figureLabel})`, h.evidence]) }}>
            <HypothesisScorecard items={hs} />
          </Exhibit>
        </section>

        <section id="plan" className="scroll-mt-20 space-y-4 mt-10">
          <Takeaway>Six weeks: diagnose, deep-dive, design solutions, then a roadmap for the steering committee.</Takeaway>
        <Exhibit n={4} title="A six-week plan: diagnose, deep-dive, design solutions, then a roadmap for the steering committee"
          subtitle="Workstreams, activities and milestones (diamonds)"
          table={{ columns: ["Workstream", "Activity", "Start week", "End week", "Milestone"], rows: WORKPLAN.map((r) => [r.stream, r.task, r.start, r.end, r.milestone ?? ""]) }}>
          <Plan rows={WORKPLAN} />
        </Exhibit>
        </section>

        <section id="confidence" className="scroll-mt-20 space-y-4 mt-10">
          <Takeaway>The regulation side is solid (grade B); most producer-level inputs are still estimates (grade D) until verified declarations are filed in 2027.</Takeaway>
        <Exhibit n={5} title="Most producer-level inputs are still estimates; the regulation side of the model is solid"
          subtitle={`Every input in the model by confidence grade (${total} inputs) and what would upgrade it`}
          table={{ columns: ["Grade", "What it is", "Inputs", "How to upgrade"], rows: Object.entries(grades).map(([g, n]) => [g, GRADE_TXT[g][0], n, GRADE_TXT[g][1]]) }}>
          <div className="flex h-6 w-full overflow-hidden rounded-md border border-line" role="img" aria-label={`Inputs by confidence grade: ${Object.entries(grades).map(([g, n]) => `${g} ${n}`).join(", ")}`}>
            {Object.entries(grades).filter(([, n]) => n > 0).map(([g, n]) => (
              <span key={g} className="h-full border-r-2 border-surface last:border-r-0" style={{ width: `${(n / total) * 100}%`, background: GRADE_C[g] }} />
            ))}
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            {Object.entries(GRADE_TXT).map(([g, [what, how]]) => (
              <div key={g} className="border-t-2 pt-2" style={{ borderColor: GRADE_C[g] }}>
                <dt className="font-medium">{g}: {what} <span className="text-ink-3 font-normal">({grades[g]} inputs)</span></dt>
                <dd className="text-ink-2 mt-1">{how}</dd>
              </div>
            ))}
          </dl>
        </Exhibit>
        </section>
      </div>
      <Toc items={TOC} />
    </div>
  );
}
