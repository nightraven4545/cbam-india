# Project state: CBAM India

Last updated: 31 Oct 2026.

## Status
- Repo: github.com/nightraven4545/cbam-india (main).
- **Vercel: not yet live.** The Vercel connector in Claude sessions returns 403 on project/deployment creation. One-time manual import is needed at vercel.com/new (import nightraven4545/cbam-india, framework Next.js, defaults). After that, every push to main auto-deploys.
- Phase 0–1 (steel MVP): done.
- Phase 2: done.
  - Data hardening: benchmarks checked against the EUR-Lex 2025/2620 table. China/Korea/Türkiye/India aluminium defaults corrected. JSW and SAIL FY26 actuals added (grade C).
  - Seeded Monte Carlo price risk, sensitivity tornado, delivered-cost crossover.
  - Aluminium sector with the indirect-emissions stress test.
  - Custom producer, shareable URL, CSV export.
- Tests 16/16, build and lint clean, E2E checked (sector switch, URL round-trip, CSV, 390 px width, no console errors).

## Next (Phase 3 options)
- CCTS ↔ Article 9 policy simulator.
- MSME downstream calculator + 2028 radar.
- Trade-allocation LP under the quota.
- Real-options valuation of H2-DRI timing.
- Cement contrast.
- Executive deck.
- Weekly price refresh from 2027.
- Product mix (7209/7210 defaults for India still unverified).

## Key decisions
- The legal payer is the EU importer; exporter impact goes through a pass-through slider (default 50%).
- Formula: max(0, E − F_t × B) × P. The 2.5% phase-out applies to the benchmark, not to emissions.
- Steel and aluminium are direct-only (Annex II). The indirect toggle is a stress test, not law.
- Route-weighted benchmark (BF-BOF 1.370 / DRI-EAF 0.481 for 7208; primary 1.423 for 7601).
- Monte Carlo: OU deviation on log price around the scenario path, y_2026 = 0, κ 0.3, σ 30%, seed 42.

## Gotchas
- Many sites are blocked by the session network; fetch them via firecrawl.
- Producer intensities are D-grade (CCTS plant baselines × 0.85 direct share); see Methodology.
- Do not `pkill -f` with a pattern that also matches your own shell command.
- Commits: author `Shreshtha <77679539+nightraven4545@users.noreply.github.com>`, no AI co-author trailers.
