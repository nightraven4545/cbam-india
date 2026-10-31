import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/consulting/core";
import { Exhibit } from "@/components/consulting/Exhibit";
import CliffChart from "@/components/pages/CliffChart";
import MiniWaterfall from "@/components/pages/MiniWaterfall";
import { annualBill } from "@/lib/roadmap";
import { facts, hypotheses } from "@/lib/storyline";

export const metadata: Metadata = { title: "Case study", description: "How I approached the EU CBAM question for Indian steel: the problem, the method, three insights and what I would do next." };

export default function CaseStudy() {
  const f = facts();
  const { eur, m, bn } = f.fmt;
  const names = f.sums.map((x) => x.p.name);
  const hs = hypotheses();
  const wrong = hs.filter((h) => h.verdict !== "confirmed").length;
  return (
    <div className="max-w-[880px]">
      <PageHeader title="Case study: pricing Europe's carbon border for Indian industry"
        lede="A three-minute read on how I framed the problem, what the numbers showed, and what I would do with another month." />

      <div className="prose-cbam">
        <h2>The problem</h2>
        <p>
          From January 2026, EU importers of steel, aluminium and cement pay for the carbon embedded in what they buy. The legal bill lands on the importer, but the cost flows back to the Indian exporter through price.
          The brief I set myself was to work out what that costs each major Indian producer, and which responses pay back first.
        </p>
        <p>
          Most published estimates multiply emissions by the EU carbon price. The regulation does something different: it charges only what sits above a benchmark, scaled by a free-allocation factor that falls from 97.5% in 2026 to zero in 2034. Getting that one formula right changes every answer downstream.
        </p>

        <h2>How I approached it</h2>
        <ul>
          <li><strong>One key question, four branches.</strong> How big is the exposure; who is most exposed and why; which levers restore margin; and what government should do. The <Link href="/approach">issue tree</Link> shows each branch and the analysis that answers it.</li>
          <li><strong>Hypotheses first.</strong> I wrote down eight beliefs before building anything. {wrong} of the {hs.length} turned out wrong or needed refining.</li>
          <li><strong>Build the regulation as code.</strong> The CBAM formula, the phase-out schedule and the default-value mark-ups are a small TypeScript engine with unit tests that reproduce the European Commission&apos;s own worked example.</li>
          <li><strong>Grade every input.</strong> Regulation and official prices are grade B, company disclosures grade C, my own estimates grade D. The <Link href="/sources">sources page</Link> lists each one.</li>
        </ul>
      </div>

      <div className="grid gap-6 my-8">
        <Exhibit title="The bill is modest in 2026 and steepens from 2030" subtitle="Annual CBAM cost, five largest Indian steel exporters, € million (100% pass-through)">
          <CliffChart verified={annualBill("actual")} defaults={annualBill("default")} names={names} />
        </Exhibit>
      </div>

      <div className="prose-cbam">
        <h2>Three things the numbers showed</h2>
        <ol>
          <li><strong>Most of the cost is a tax on missing data.</strong> Unverified Indian hot-rolled coil is charged on a default of 4.28 tCO₂/t plus a mark-up, about {eur(f.defaultPerT)}/t in 2026. The same tonne from an efficient mill with verified data costs {eur(f.verifiedPerT)}/t. Across the five largest exporters, verification is worth {m(f.verification)} a year.</li>
          <li><strong>Renewable power does not cut steel CBAM today.</strong> Steel and aluminium are charged on direct emissions only, so a renewable power deal helps with India&apos;s own carbon market and with buyers, but not with the border charge. For aluminium it works as insurance against the rule changing.</li>
          <li><strong>How India prices carbon decides where the money goes.</strong> An explicit carbon price on exports could keep about {bn(f.polExplicit)} in India over 2026–34. The current intensity-based scheme keeps about {m(f.polCcts)}.</li>
        </ol>
      </div>

      <div className="grid gap-6 my-8">
        <Exhibit title={`Five moves take the 2026–34 bill from ${bn(f.vas.doNothing)} to ${bn(f.vas.residual)}`} subtitle="Cumulative CBAM paid to the EU, € million, moves applied in sequence">
          <MiniWaterfall steps={f.vas.steps} />
        </Exhibit>
      </div>

      <div className="prose-cbam">
        <h2>What I would do with another month</h2>
        <ul>
          <li>Replace the remaining grade-D inputs (plant-level intensities and EU volumes) with verified CBAM reports, once the first declarations are filed in September 2027.</li>
          <li>Interview two or three EU buyers on how they are actually splitting the cost in contracts. Pass-through is the most important number nobody publishes.</li>
          <li>Extend the downstream radar to 8-digit product lines once the 2028 list is final.</li>
        </ul>

        <h2>What I built</h2>
        <p>
          A Next.js site deployed on Vercel. The regulation and every exhibit come from one tested engine (33 unit tests). There is a Monte Carlo price model, a real-option valuation of hydrogen steelmaking, a trade-allocation optimiser, and an <a href="/cbam-india-model.xlsx" download>Excel version</a> with live formulas. Every page passes automated WCAG AA checks in light and dark mode.
        </p>
        <p><Link href="/">Read the executive summary</Link> · <Link href="/deck">See the deck</Link> · <Link href="/model">Try the model</Link></p>
      </div>
    </div>
  );
}
