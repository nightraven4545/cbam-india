import { buildWorkbook } from "@/lib/xlsx";

export const dynamic = "force-static";

export async function GET() {
  const buf = await (await buildWorkbook()).xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="cbam-india-model.xlsx"',
    },
  });
}
