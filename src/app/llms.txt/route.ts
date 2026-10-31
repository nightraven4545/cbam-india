// /llms.txt: a plain-text guide to this site for AI assistants (llmstxt.org convention). Generated from the engine.
import { faq } from "@/lib/faq";

export const dynamic = "force-static";
const BASE = "https://cbam-india.vercel.app";

export function GET() {
  const pages: [string, string, string][] = [
    ["/", "Summary", "the answer, the 2030 cash cliff, executive scorecard, value at stake and five recommendations"],
    ["/approach", "Approach", "issue tree, hypotheses tested, workplan and data confidence"],
    ["/industry", "Industry", "who is exposed: flows, EU import Mekko by origin, risk matrix, route mix, heatmap, scenario ranges"],
    ["/model", "Model", "interactive CBAM calculator for 11 producers: exposure, Monte Carlo risk, crossover, levers (MACC), trade allocation"],
    ["/roadmap", "Roadmap", "value-at-stake waterfall, prioritisation, lever assessment, 2026–34 Gantt and KPIs"],
    ["/policy", "Policy & MSMEs", "Article 9 simulator, policy design options, downstream radar, MSME per-unit calculator"],
    ["/esg", "ESG & carbon markets", "carbon-price ladder, disclosure frameworks, producer ESG scorecard, net-zero paths, greenwashing tests"],
    ["/methodology", "Methodology", "the CBAM formula, legal sources and confidence grades"],
    ["/sources", "Sources", "every source with its grade and law/proposal status"],
    ["/cbam-india-model.xlsx", "Excel model", "the same calculation with live formulas"],
  ];
  const body = [
    "# CBAM India",
    "",
    "> An engagement-style analysis of the EU Carbon Border Adjustment Mechanism (CBAM) for Indian steel, aluminium and cement exporters: what it costs, who is exposed, what to do, and what India's government can do. Prepared by Shreshtha, 31 October 2026. Every number is computed from a unit-tested model of the regulation (Regulation (EU) 2023/956 and its implementing acts).",
    "",
    "## Pages",
    ...pages.map(([p, t, d]) => `- [${t}](${BASE}${p}): ${d}`),
    "",
    "## Key answers",
    ...faq().flatMap((x) => [`### ${x.q}`, x.a, ""]),
    "## Notes",
    "- Producer intensities and some volumes are analyst estimates (grade D); company disclosures are grade B–C. See /sources.",
    "- Not investment advice. Source code: https://github.com/nightraven4545/cbam-india",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
