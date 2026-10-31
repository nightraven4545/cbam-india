# Project state: CBAM India

Last updated: 31 Oct 2026.

## Status
- Repo: github.com/nightraven4545/cbam-india (main).
- **Live: https://cbam-india.vercel.app** (imported by the user; the project is not visible to the session's Vercel connector). Pushes to main auto-deploy.
- Phase 0–1 (steel MVP): done.
- Phase 2: done.
  - Data hardening: benchmarks checked against the EUR-Lex 2025/2620 table. China/Korea/Türkiye/India aluminium defaults corrected. JSW and SAIL FY26 actuals added (grade C).
  - Seeded Monte Carlo price risk, sensitivity tornado, delivered-cost crossover.
  - Aluminium sector with the indirect-emissions stress test.
  - Custom producer, shareable URL, CSV export.
- Phase 3: done.
  - Cement sector (indirect emissions charged by law; OPC basis).
  - Trade-allocation optimiser (greedy = optimal, brute-force tested); H₂-DRI real option (CRR lattice).
  - /policy: Article 9 simulator, downstream radar from UN Comtrade 2024 (EU reporter 97, partner India 699), MSME calculator.
  - /deck: 10 live slides, prints to PDF.
- Tests 26/26, build and lint clean, E2E passed (policy toggle, cement, optimiser, H₂ text, 390 px, deck PDF, no console errors).

- v2 (after user feedback that the pages were text-heavy and bland): consulting-engagement IA and design system.
  - IBM Plex Sans + Plex Sans Condensed; steel/navy tokens; validated data palette.
  - Exhibits with action titles, sources and table views.
  - Pages: Summary, Approach (issue tree, hypotheses, Gantt), Industry (Sankey, 2×2), Roadmap (waterfall, matrix, swimlane, KPIs), and Model in tabs.
  - Policy (Sankey, treemap) and Markets (landscape, ETS history, timeline, collapsible primer); chart-led deck.
  - storyline.ts and roadmap.ts compute every quoted number. 30 tests.

- v3:
  - Data hardened from primary sources (EUR-Lex 2026/1740 defaults; FY26 disclosures for Tata, JSPL, AM/NS, Vedanta, Hindalco).
  - /sources registry; model presets; zero axe WCAG AA violations (light and dark).
  - Excel model (static route, live formulas); case study; OG image; one-page PDF (public/); deck Present mode.
  - 33 tests.

- v4 (feedback: more symbols, flags and logos; a scannable Approach; signature consulting exhibits; better ESG/markets):
  - A, visual language: lucide icons, country flags, company logos (fetched at prebuild on Vercel, monogram fallback), Delta/RAG/Harvey indicators.
  - C, Approach: tree diagram with a drawer, hypothesis scorecard, workflow, takeaways and a sticky contents panel.
  - B, consultant exhibits (`src/lib/exhibits.ts`, `src/components/consulting/exhibits.tsx`, all computed and tested):
    - Mekko of EU flat-steel imports (/industry);
    - heatmap and football field (/industry);
    - executive RAG scorecard (/);
    - value-driver tree, true MACC and Harvey lever assessment (/model);
    - Harvey assessment (/roadmap).
  - 38 tests.
  - D, ESG & carbon markets module: done. /esg replaces /markets, which redirects permanently via next.config. Data and logic live in `src/lib/esg.ts`, tested.
    - Exhibits:
      - carbon-price ladder with the border gap;
      - live cost flow with an Article 9 side branch;
      - disclosure-frameworks matrix (8 frameworks × 8 requirements);
      - producer ESG scorecard (Green Steel Taxonomy stars, required vs historic rate);
      - net-zero pathway chart;
      - greenwashing RAG tests plus case cards;
      - India carbon stack.
    - The old primer stays collapsed below. All titles are computed. 44 tests.

- v4.1, Roadmap and Policy redesign (feedback: "still bland"):
  - Shared pieces:
    - `KpiStrip`: hero numbers with icons;
    - `IconTick`: icon axis labels, used on the value-at-stake waterfall site-wide;
    - Sankey left margin now sized to the longest label.
  - Roadmap:
    - KPI strip;
    - owner icons in the matrix list;
    - a new 2026–34 Gantt with a regulation track (`src/lib/timeline.ts`, shared with /esg);
    - swimlane cards with basis badges and milestones;
    - KPI cards stepping baseline → 2027 → 2030.
  - Policy:
    - KPI strip;
    - numbered exhibits whose titles update live with the controls;
    - a three-design Article 9 options comparison (`policyOptions`);
    - status icons and inline bars in the radar;
    - an engineering-hub exposure ranking (`clusterExposure`);
    - an icon formula strip in the MSME calculator.
  - Helpers moved to `src/lib/policy.ts` and tested. 47 tests.

## Next
- A ₹/€ toggle, plus takeaways and contents panels on the model and industry pages.
- ESG data gaps: SAIL and AM/NS intensity, SBTi status (check the SBTi target dashboard), renewable shares and BRSR Core assurance status.
- Vercel import (manual, see above).
- Q4 2026 price on 4 Jan 2027; weekly prices from 2027.
- India defaults for 7209/7210 equal 7208 (4.280), so product mix only matters via benchmarks (not modelled).
- Replace D-grade plant intensities with verified CBAM data as it is published.
- Downstream radar at the 8-digit level once the final 2028 list is adopted.

## Key decisions
- Fasteners, tubes, structures, 7326, 7610 and 7616 are ALREADY in CBAM Annex I; the 2028 proposal adds chapters 84 and 87 lines, plus springs, chains and similar.
- The legal payer is the EU importer; exporter impact goes through a pass-through slider (default 50%).
- Formula: max(0, E − F_t × B) × P. The 2.5% phase-out applies to the benchmark, not to emissions.
- Steel and aluminium are direct-only (Annex II). The indirect toggle is a stress test, not law.
- Route-weighted benchmark (BF-BOF 1.370 / DRI-EAF 0.481 for 7208; primary 1.423 for 7601).
- Comtrade: India-as-reporter with partner EU (97) returns nothing; use EU as reporter (97) with partner India (699), flow M.
- Monte Carlo: OU deviation on log price around the scenario path, y_2026 = 0, κ 0.3, σ 30%, seed 42.

## Gotchas
- After editing /one-pager, regenerate public/CBAM-India-one-pager.pdf (Playwright pdf of the built page).
- Server pages cannot pass functions to client components (use primitive props, e.g. Ticker prefix/suffix).
- Wide exhibits (Gantt, swimlane, waterfall) scroll inside their frame on mobile; Exhibit has min-w-0.
- Many sites are blocked by the session network; fetch them via firecrawl.
- Producer intensities are D-grade (CCTS plant baselines × 0.85 direct share); see Methodology.
- Mekko origins: only Türkiye, Korea and India flat-steel volumes are published (EUROFER 2025, ~23.1 Mt); the rest is one "Other origins" block. Türkiye uses its bars/rods default as a proxy.
- Absolutely positioned children (sr-only) inside scroll boxes need a `relative` wrapper or they widen the page on mobile.
- Logo img errors can fire before hydration; Logo checks `naturalWidth` after mount.
- ESG figures: corporate Scope 1+2 per tonne of crude steel (BRSR/factsheet) is not the CBAM boundary (direct, per product). The two are kept apart, and the taxonomy rating uses the corporate figure only as a proxy.
- Never nest block lists inside `<p>` (e.g. OwnerLegend renders a `<ul>`). React hydration fails and axe flags it. KpiStrip uses `<ul>/<li>`, not `<dl>`.
- Do not `pkill -f` with a pattern that also matches your own shell command.
- Commits: author `Shreshtha <77679539+nightraven4545@users.noreply.github.com>`, no AI co-author trailers.
