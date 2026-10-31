# CBAM India: Carbon Border Exposure Model

**Which Indian steelmakers lose as Europe prices carbon, and what should they do about it?**

An interactive scenario model of the EU Carbon Border Adjustment Mechanism (definitive regime since 1 Jan 2026) for Indian steel exporters (JSW, Tata Steel, AM/NS India, JSPL, SAIL). It covers:

- **Cost bridge**: embedded emissions → benchmark × CBAM factor → certificates → € cost → pass-through → EBITDA.
- **Value of verification**: EU default values (+10/20/30% mark-up) vs verified actual emissions.
- **2026–2034 trajectory**: law in force vs the COM(2026) 616 proposal.
- **Decarbonisation lab**: NPV, IRR, payback and MAC for 7 levers, with a dedicated EU line, CCTS credit price and green premium.
- **Analysis**, a **carbon-markets primer** (EU ETS, PAT/ESCerts, CCTS, CORSIA, VCM, net-zero maths, greenwashing) and a **methodology** page with confidence grades A–E.

## Run
```bash
npm install
npm test        # engine tests (reproduces Commission example & €277.60/t default cost)
npm run dev
```

## Structure
- `src/lib/cbam.ts`: CBAM rules (CBAM factor, mark-ups, prices) and the per-tonne cost, NPV, IRR and payback functions.
- `src/lib/data.ts`: producers, benchmarks, defaults and levers, each with a source and confidence grade.
- `src/lib/model.ts`: scenario layer (producer summaries, trajectories, lever economics).
- `src/components/Dashboard.tsx`: the interactive model; `src/app/{analysis,markets,methodology}`: written pages.

Producer inputs are D-grade estimates. Replace them with verified installation data before relying on any number.
