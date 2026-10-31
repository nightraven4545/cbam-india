# Design review (v2 → v3)

The checklist combines no-slop-ui and impeccable anti-patterns with WCAG 2 AA. Method: Playwright screenshots at 1366 px and 390 px in light and dark mode, plus axe-core on all 10 pages in both themes.

| Check | Status | Notes |
|---|---|---|
| No glassmorphism, gradients, glow or purple palette | Pass | Solid surfaces and 1px borders; steel/navy tokens |
| Not "Inter for everything" | Pass | IBM Plex Sans (UI) and Plex Sans Condensed (titles, numbers) |
| No cards nested in cards; no icon tiles above headings | Pass | Exhibits are single frames; KPI rows use one panel |
| No all-caps eyebrows or filler labels | Pass | "Exhibit n" is a real sequence |
| Action titles state the "so what" | Pass | Titles that quote numbers are computed from the model |
| Source line and table view on every exhibit | Pass | Gantt and swimlane got table views in v3 |
| Text contrast ≥ 4.5:1 | Fixed | `--ink-3` darkened; text-only colour tokens `--s1i/--s2i/--s3i` per theme |
| Chart marks have accessible names | Fixed | Scatter symbols render `<title>` |
| Scrollable regions are keyboard-focusable | Fixed | `tabIndex=0` on horizontal scroll containers |
| Skip link and landmarks | Fixed | "Skip to content" link → `main#main` |
| No horizontal page scroll at 390 px | Pass | Wide exhibits (Gantt, swimlane, waterfall, Sankey) scroll inside their frame |
| Motion | Pass | KPI tickers only; `prefers-reduced-motion` respected |
| Dark mode | Pass | Separate validated steps; data palette checked with the dataviz validator |

Open items: tooltips are mouse-only (the table views are the keyboard equivalent), and the Sankey shows producer → border → product, not a full producer × product matrix, because no public source gives that split.
