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
- Phase 3: done.
  - Cement sector (indirect emissions charged by law; OPC basis).
  - Trade-allocation optimiser (greedy = optimal, brute-force tested); H₂-DRI real option (CRR lattice).
  - /policy: Article 9 simulator, downstream radar from UN Comtrade 2024 (EU reporter 97, partner India 699), MSME calculator.
  - /deck: 10 live slides, prints to PDF.
- Tests 26/26, build and lint clean, E2E passed (policy toggle, cement, optimiser, H₂ text, 390 px, deck PDF, no console errors).

## Next
- Vercel import (manual, see above).
- Q4 2026 price on 4 Jan 2027; weekly prices from 2027.
- Verify India defaults for 7209/7210 and add product mix.
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
- Many sites are blocked by the session network; fetch them via firecrawl.
- Producer intensities are D-grade (CCTS plant baselines × 0.85 direct share); see Methodology.
- Do not `pkill -f` with a pattern that also matches your own shell command.
- Commits: author `Shreshtha <77679539+nightraven4545@users.noreply.github.com>`, no AI co-author trailers.
