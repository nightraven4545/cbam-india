import { ImageResponse } from "next/og";
import { annualBill } from "@/lib/roadmap";
import { facts } from "@/lib/storyline";

export const alt = "CBAM India: what Europe's carbon border costs Indian steel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const f = facts();
  const rows = annualBill("actual");
  const names = f.sums.map((x) => x.p.name);
  const totals = rows.map((r) => names.reduce((a, n) => a + (r[n] as number), 0));
  const max = Math.max(...totals);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0e2238", color: "#e8edf2", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 28, color: "#b4c0cc" }}>CBAM India</div>
        <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
          {`Europe's carbon border will cost India's top steel exporters ${f.fmt.bn(f.vas.doNothing)} by 2034. ${Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100)}% is a tax on missing data.`}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 120 }}>
          {totals.map((t, i) => (
            <div key={i} style={{ display: "flex", width: 72, height: Math.max(8, (t / max) * 120), background: rows[i].year >= 2030 ? "#e8590c" : "#2a78d6", borderRadius: 4 }} />
          ))}
          <div style={{ display: "flex", marginLeft: 24, fontSize: 24, color: "#b4c0cc" }}>Annual CBAM bill 2026–34 · cbam-india.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
