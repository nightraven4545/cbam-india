# Project state: CBAM India

Last updated: 31 Oct 2026.

## Status
- Phase 0–1 (steel MVP) built: engine + tests (8/8), dashboard, analysis, markets primer, methodology. Build and lint are clean.
- Plan: Phase 2 = Monte Carlo price risk, competitor crossover, aluminium (Annex II insight). Phase 3 = cement, trade optimiser, 2028 downstream radar, Excel export.

## Key decisions
- The legal payer is the EU importer; exporter impact goes through a pass-through slider (default 50%).
- Formula: max(0, E − F_t × B) × P. The 2.5% phase-out applies to the benchmark, not to emissions.
- Steel and aluminium are direct-only (Annex II), so a renewable PPA gives zero steel CBAM saving.
- Route-weighted benchmark (BF-BOF 1.370 / DRI-EAF 0.481 for CN 7208).

## Gotchas
- cbamguide.com and other sites are blocked by the session network; fetch them via firecrawl.
- Producer inputs are D-grade (CCTS plant baselines × 0.85 direct share); see Methodology.
- Commits: author `Shreshtha <77679539+nightraven4545@users.noreply.github.com>`, no AI co-author trailers.
