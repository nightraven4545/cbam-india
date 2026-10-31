// Builds the downloadable Excel model. Calculations are live Excel formulas over the Inputs and Rules sheets,
// with cached results from the TypeScript engine so the file opens with numbers before recalculation.
import ExcelJS from "exceljs";
import { YEARS, cbamFactor, defaultMarkup, priceIn } from "./cbam";
import { INDIRECT_IN_LAW, PRODUCERS, PRODUCTS, benchmarkFor } from "./data";
import { DEFAULT_SCENARIO as S, producerCost } from "./model";

const HEAD = { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF0E2238" } } };
const INPUT_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFF4D6" } };

export async function buildWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Shreshtha";
  wb.created = new Date("2026-10-31");

  const readme = wb.addWorksheet("Read me");
  readme.columns = [{ width: 110 }];
  [
    "CBAM India: EU Carbon Border Adjustment exposure model (steel, aluminium, cement)",
    "Live site: https://cbam-india.vercel.app",
    "",
    "Formula per tonne: certificates = MAX(0, E − F_t × B); cost = certificates × P; exporter hit = cost × pass-through.",
    "E = verified direct (+ indirect for cement) intensity, or India default × (1 + mark-up). F_t = CBAM factor. B = route-weighted benchmark.",
    "Yellow cells on 'Inputs' are editable; 'Calc' and 'Outputs' recalculate.",
    "Grades: B regulation · C company disclosure / official statistic · D estimate · E EU default value. Sources: https://cbam-india.vercel.app/sources",
  ].forEach((t, i) => { readme.getCell(`A${i + 1}`).value = t; });
  readme.getCell("A1").font = { bold: true, size: 14 };

  // Inputs: scenario + producers
  const inp = wb.addWorksheet("Inputs");
  inp.columns = [{ width: 26 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 10 }, { width: 70 }];
  inp.getCell("A1").value = "Scenario"; inp.getCell("A1").font = { bold: true };
  const scen: [string, number][] = [["Certificate price 2026 (€/t)", S.basePrice], ["Price growth / yr", S.growth], ["Pass-through to exporter", S.passThrough]];
  scen.forEach(([k, v], i) => { inp.getCell(`A${i + 2}`).value = k; const c = inp.getCell(`B${i + 2}`); c.value = v; c.fill = INPUT_FILL; });
  // B2 price, B3 growth, B4 pass-through
  const hdr = ["Producer", "Sector", "EU volume (Mt)", "Direct t/t", "Indirect t/t", "Indirect charged?", "India default t/t", "Benchmark t/t", "Grade", "Source (direct intensity)"];
  inp.getRow(6).values = hdr; inp.getRow(6).eachCell((c) => Object.assign(c, HEAD));
  PRODUCERS.forEach((p, i) => {
    const r = 7 + i;
    inp.getRow(r).values = [p.name, p.sector, p.euVolume.value, p.actualDirect.value, p.indirect.value, INDIRECT_IN_LAW[p.sector] ? 1 : 0, PRODUCTS[p.sector].defaultValue.value, +benchmarkFor(p).toFixed(4), p.actualDirect.confidence, p.actualDirect.source];
    for (const col of ["C", "D", "E"]) inp.getCell(`${col}${r}`).fill = INPUT_FILL;
  });

  // Rules
  const rules = wb.addWorksheet("Rules");
  rules.columns = [{ width: 22 }, ...YEARS.map(() => ({ width: 10 }))];
  rules.getRow(1).values = ["Year", ...YEARS]; rules.getRow(1).eachCell((c) => Object.assign(c, HEAD));
  rules.getRow(2).values = ["CBAM factor (law)", ...YEARS.map((y) => cbamFactor(y, "law"))];
  rules.getRow(3).values = ["CBAM factor (COM(2026) 616)", ...YEARS.map((y) => +cbamFactor(y, "proposal").toFixed(5))];
  rules.getRow(4).values = ["Default mark-up", ...YEARS.map((y) => defaultMarkup(y))];
  rules.getCell("A6").value = "Source: Directive 2003/87/EC Art. 10a(1a); Implementing Reg. (EU) 2025/2621 as replaced by 2026/1740.";

  // Calc: one block per producer, one column per year
  const calc = wb.addWorksheet("Calc");
  calc.columns = [{ width: 34 }, ...YEARS.map(() => ({ width: 11 }))];
  const col = (i: number) => String.fromCharCode(66 + i); // B..J
  let r = 1;
  const cumRows: { name: string; verified: string; def: string }[] = [];
  PRODUCERS.forEach((p, pi) => {
    const ir = 7 + pi; // Inputs row
    calc.getRow(r).values = [p.name, ...YEARS]; calc.getRow(r).eachCell((c) => Object.assign(c, HEAD));
    const rows = { price: r + 1, eVer: r + 2, eDef: r + 3, fa: r + 4, certV: r + 5, certD: r + 6, costV: r + 7, costD: r + 8, annV: r + 9, annD: r + 10 };
    const labels: Record<keyof typeof rows, string> = {
      price: "Certificate price €/t", eVer: "E verified t/t", eDef: "E on defaults t/t", fa: "Free allocation F×B t/t",
      certV: "Certificates/t verified", certD: "Certificates/t defaults", costV: "CBAM €/t verified", costD: "CBAM €/t defaults",
      annV: "Exporter cost €m verified", annD: "Exporter cost €m defaults",
    };
    YEARS.forEach((y, k) => {
      const c = col(k), rc = `Rules!${c}`;
      const ver = producerCost(p, S, "actual", { year: y }), def = producerCost(p, S, "default", { year: y });
      const set = (row: number, formula: string, result: number) => { calc.getCell(`${c}${row}`).value = { formula, result }; };
      set(rows.price, `Inputs!$B$2*(1+Inputs!$B$3)^(${c}$${r}-2026)`, priceIn(y, S.basePrice, S.growth));
      set(rows.eVer, `Inputs!$D$${ir}+Inputs!$E$${ir}*Inputs!$F$${ir}`, ver.applied);
      set(rows.eDef, `Inputs!$G$${ir}*(1+${rc}$4)`, def.applied);
      set(rows.fa, `${rc}$2*Inputs!$H$${ir}`, ver.freeAllocation);
      set(rows.certV, `MAX(0,${c}${rows.eVer}-${c}${rows.fa})`, ver.certificates);
      set(rows.certD, `MAX(0,${c}${rows.eDef}-${c}${rows.fa})`, def.certificates);
      set(rows.costV, `${c}${rows.certV}*${c}${rows.price}`, ver.net);
      set(rows.costD, `${c}${rows.certD}*${c}${rows.price}`, def.net);
      set(rows.annV, `${c}${rows.costV}*Inputs!$B$4*Inputs!$C$${ir}`, ver.net * S.passThrough * p.euVolume.value);
      set(rows.annD, `${c}${rows.costD}*Inputs!$B$4*Inputs!$C$${ir}`, def.net * S.passThrough * p.euVolume.value);
    });
    (Object.keys(rows) as (keyof typeof rows)[]).forEach((k) => { calc.getCell(`A${rows[k]}`).value = labels[k]; });
    for (let rr = rows.price; rr <= rows.annD; rr++) for (let k = 0; k < YEARS.length; k++) calc.getCell(`${col(k)}${rr}`).numFmt = rr >= rows.costV ? "#,##0.0" : "0.000";
    cumRows.push({ name: p.name, verified: `SUM(Calc!B${rows.annV}:J${rows.annV})`, def: `SUM(Calc!B${rows.annD}:J${rows.annD})` });
    r = rows.annD + 2;
  });

  // Outputs
  const out = wb.addWorksheet("Outputs");
  out.columns = [{ width: 26 }, { width: 22 }, { width: 22 }, { width: 22 }];
  out.getRow(1).values = ["Producer", "2026–34 exporter cost €m (verified)", "2026–34 exporter cost €m (defaults)", "Value of verification €m"];
  out.getRow(1).eachCell((c) => Object.assign(c, HEAD));
  cumRows.forEach((x, i) => {
    const p = PRODUCERS[i];
    const v = YEARS.reduce((a, y) => a + producerCost(p, S, "actual", { year: y }).net * S.passThrough * p.euVolume.value, 0);
    const d = YEARS.reduce((a, y) => a + producerCost(p, S, "default", { year: y }).net * S.passThrough * p.euVolume.value, 0);
    out.getRow(i + 2).values = [x.name, { formula: x.verified, result: v }, { formula: x.def, result: d }, { formula: `C${i + 2}-B${i + 2}`, result: d - v }];
    for (const c of ["B", "C", "D"]) out.getCell(`${c}${i + 2}`).numFmt = "#,##0.0";
  });
  [readme, inp, rules, calc, out].forEach((ws) => { ws.views = [{ state: "frozen", ySplit: ws === calc ? 0 : 1 }]; });
  return wb;
}
