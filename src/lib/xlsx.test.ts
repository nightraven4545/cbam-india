import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildWorkbook } from "./xlsx";
import { PRODUCERS } from "./data";
import { DEFAULT_SCENARIO as S, cumulativeExposure, producerCost } from "./model";

describe("Excel model", () => {
  it("round-trips and its cached results match the engine", async () => {
    const buf = await (await buildWorkbook()).xlsx.writeBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Read me", "Inputs", "Rules", "Calc", "Outputs"]);
    const calc = wb.getWorksheet("Calc")!;
    // First producer block: row 8 = CBAM €/t verified, column B = 2026, column F = 2030
    const jsw = PRODUCERS[0];
    const b8 = calc.getCell("B8").value as { formula: string; result: number };
    expect(b8.formula).toBe("B6*B2");
    expect(b8.result).toBeCloseTo(producerCost(jsw, S, "actual", { year: 2026 }).net, 6);
    const f6 = calc.getCell("F6").value as { formula: string; result: number };
    expect(f6.formula).toBe("MAX(0,F3-F5)");
    const out = wb.getWorksheet("Outputs")!.getCell("B2").value as { result: number };
    expect(out.result * 1e6).toBeCloseTo(cumulativeExposure(jsw, S, "actual"), 0);
  });
});
