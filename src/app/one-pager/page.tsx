import type { Metadata } from "next";
import QRCode from "qrcode";
import { Clock, Download, Factory, Handshake, Landmark, Route, ShieldCheck, Target, Telescope, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import { facts } from "@/lib/storyline";
import { annualBill } from "@/lib/roadmap";
import { scorecard, SCORECARD_RULES, type Level } from "@/lib/exhibits";
import { Flag } from "@/components/visual/indicators";
import { Logo } from "@/components/visual/Logo";

export const metadata: Metadata = { title: "One-page summary", description: "A one-page A4 executive summary of the CBAM India analysis: the cost, the 2030 cliff, who is exposed and what to do." };

const URL = "https://cbam-india.vercel.app";
const RAG: Record<Level, string> = { red: "#c2410c", amber: "#b7791f", green: "#15803d" };

// Annual bill on defaults vs verified data, 2026–34: two areas and the 2030 marker.
function CliffMini({ d, v }: { d: { year: number; total: number }[]; v: { year: number; total: number }[] }) {
  const W = 340, H = 134, L = 34, B = 18, T = 10, pw = W - L - 16, ph = H - T - B;
  const max = Math.ceil(Math.max(...d.map((x) => x.total)) / 500) * 500;
  const x = (i: number) => L + (i / (d.length - 1)) * pw, y = (n: number) => T + ph - (n / max) * ph;
  const path = (s: { total: number }[]) => `M${x(0)},${y(0)} ` + s.map((p, i) => `L${x(i)},${y(p.total)}`).join(" ") + ` L${x(s.length - 1)},${y(0)} Z`;
  const i30 = d.findIndex((p) => p.year === 2030);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Annual CBAM bill 2026 to 2034, default values versus verified data">
      {[0, max / 2, max].map((n) => <g key={n}><line x1={L} x2={L + pw} y1={y(n)} y2={y(n)} stroke="var(--line)" /><text x={L - 4} y={y(n) + 3} textAnchor="end" fontSize={8} fill="var(--ink-3)">€{(n / 1000).toFixed(1)}bn</text></g>)}
      <path d={path(d)} fill="var(--s2)" fillOpacity={0.85} />
      <path d={path(v)} fill="var(--s1)" fillOpacity={0.95} />
      <line x1={x(i30)} x2={x(i30)} y1={T} y2={T + ph} stroke="var(--ink)" strokeDasharray="3 2" />
      <text x={x(i30) - 4} y={T + 8} textAnchor="end" fontSize={8} fontWeight={600} fill="var(--ink)">2030 cliff</text>
      {d.map((p, i) => (i % 2 === 0 ? <text key={p.year} x={x(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--ink-3)">{p.year}</text> : null))}
    </svg>
  );
}

// Value-at-stake waterfall with signed deltas.
function WaterfallMini({ steps }: { steps: { label: string; value: number; total?: boolean }[] }) {
  const W = 340, H = 134, T = 14, B = 28, L = 4, pw = W - L - 4, ph = H - T - B;
  const max = steps[0].value;
  const bw = pw / steps.length;
  const y = (n: number) => T + ph - (n / max) * ph;
  let run = 0;
  const short: Record<string, string> = { "Do nothing (EU defaults)": "Do nothing", "Verify emissions": "Verify", "Efficiency stack": "Efficiency", "Scrap + biochar": "Scrap", "Route low-carbon plants to EU": "Routing", "Art. 9: pay in India": "Art. 9", "Residual paid to EU": "Residual" };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Value at stake waterfall 2026 to 2034">
      <line x1={L} x2={W - 4} y1={y(0)} y2={y(0)} stroke="var(--ink-3)" />
      {steps.map((s, i) => {
        const from = s.total ? 0 : run, to = s.total ? s.value : run + s.value;
        if (!s.total) run = to; else run = s.value;
        const top = y(Math.max(from, to)), h = Math.max(1.5, Math.abs(y(from) - y(to)));
        const fill = s.total ? "var(--neutral)" : "var(--s3)";
        return (
          <g key={s.label}>
            <rect x={L + i * bw + 4} y={top} width={bw - 8} height={h} rx={2} fill={fill} />
            <text x={L + i * bw + bw / 2} y={top - 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="var(--ink)">{s.total ? "" : "−"}€{(Math.abs(s.value) / 1e9).toFixed(1)}bn</text>
            <text x={L + i * bw + bw / 2} y={H - 14} textAnchor="middle" fontSize={8} fill="var(--ink-2)">{short[s.label] ?? s.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Section({ k, title, children, className = "" }: { k: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <p className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-s1i">{k}</p>
      <h2 className="font-cond text-[14px] font-semibold leading-tight mt-0.5 mb-2">{title}</h2>
      {children}
    </section>
  );
}

export default async function OnePager() {
  const f = facts();
  const { eur, m, bn } = f.fmt;
  const share = Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100);
  const tot = (rows: Record<string, number>[]) => rows.map((r) => ({ year: r.year, total: Object.entries(r).filter(([k]) => k !== "year" && k !== "price").reduce((a, [, v]) => a + v, 0) }));
  const dBill = tot(annualBill("default")), vBill = tot(annualBill("actual"));
  const sc = scorecard();
  const qr = await QRCode.toString(URL, { type: "svg", margin: 0, color: { dark: "#0b1f36", light: "#ffffff" } });
  const ops = -(f.vas.steps[2].value + f.vas.steps[3].value + f.vas.steps[4].value);
  const recs: { I: LucideIcon; t: string; v: string; when: string; who: string }[] = [
    { I: ShieldCheck, t: "Verify every EU-bound tonne", v: bn(-f.vas.steps[1].value), when: "Next 6 months", who: "Producers" },
    { I: Handshake, t: "Reprice CBAM risk in EU contracts", v: "Margin", when: "Next contract round", who: "Producers" },
    { I: Route, t: "Serve Europe from the cleanest plants", v: bn(ops), when: "2026–29", who: "Producers" },
    { I: Telescope, t: "Hold hydrogen as a staged option", v: `${eur(f.h2.optionValue)}/t`, when: "2030+", who: "Producers" },
    { I: Landmark, t: "Make India's carbon price count (Art. 9)", v: bn(f.polExplicit), when: "2026–29", who: "Government" },
  ];
  const kpis: { I: LucideIcon; v: string; l: string; tone: string }[] = [
    { I: TriangleAlert, v: bn(f.vas.doNothing), l: "2026–34 CBAM bill if the top five do nothing", tone: "s2i" },
    { I: ShieldCheck, v: `${share}%`, l: "of it is a tax on missing data (EU defaults)", tone: "s1i" },
    { I: Factory, v: `${eur(f.defaultPerT)} → ${eur(f.verifiedPerT)}`, l: "per tonne of HR coil in 2026: default vs verified", tone: "ink" },
    { I: Target, v: bn(f.vas.residual), l: "residual after five modelled moves", tone: "s3i" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <a href="/CBAM-India-one-pager.pdf" download className="btn btn-primary print:hidden"><Download aria-hidden size={15} />Download the PDF (A4)</a>
      <div tabIndex={0} role="region" aria-label="One-page summary, A4" className="max-w-full overflow-x-auto print:overflow-visible">
        <article className="onepager paper relative w-[210mm] h-[297mm] overflow-hidden bg-surface text-ink shadow-[0_8px_30px_rgb(11_31_54/0.18)] print:shadow-none text-[10px] leading-[1.4]">
          {/* Header band */}
          <header className="bg-masthead text-on-dark px-[12mm] pt-[9mm] pb-[7mm]">
            <div className="flex items-center justify-between text-[8.5px] text-on-dark-2">
              <span className="inline-flex items-center gap-1.5"><Flag code="IN" size={9} /><span>→</span><Flag code="EU" size={9} /><span className="ml-1 font-semibold tracking-[0.08em] uppercase text-on-dark">CBAM India · Executive summary</span></span>
              <span>31 October 2026 · cbam-india.vercel.app</span>
            </div>
            <h1 className="font-cond text-[24px] font-semibold leading-[1.12] mt-3 max-w-[165mm]">
              Europe&apos;s carbon border will cost India&apos;s five largest steel exporters {bn(f.vas.doNothing)} by 2034 if they do nothing. {share}% of it is a tax on missing data.
            </h1>
            <p className="text-on-dark-2 mt-2 max-w-[170mm] text-[10px]">
              Since 1 January 2026, EU importers of Indian steel, aluminium and cement buy CBAM certificates at the EU carbon price. Free allocation falls to zero by 2034, and unverified goods pay on India&apos;s punitive default values plus a mark-up of up to 30%.
            </p>
          </header>

          <div className="px-[12mm] -mt-[5mm]">
            {/* KPI tiles */}
            <div className="grid grid-cols-4 gap-[3mm]">
              {kpis.map((k) => (
                <div key={k.l} className="rounded-[6px] bg-surface border border-line p-[3mm] shadow-[0_2px_6px_rgb(11_31_54/0.08)]">
                  <k.I aria-hidden size={14} style={{ color: `var(--${k.tone === "ink" ? "ink" : k.tone})` }} />
                  <p className="font-cond text-[17px] font-semibold leading-none mt-1.5" style={{ color: `var(--${k.tone === "ink" ? "ink" : k.tone})` }}>{k.v}</p>
                  <p className="text-[8.5px] text-ink-2 mt-1 leading-snug">{k.l}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-[6mm] mt-[5mm]">
              <Section k="The problem" title="The bill steepens sharply from 2030">
                <CliffMini d={dBill} v={vBill} />
                <p className="flex gap-3 text-[8px] text-ink-2 mt-1">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-[2px] bg-s2" />On EU default values</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-[2px] bg-s1" />With verified data</span>
                  <span>Annual € bill, five largest exporters</span>
                </p>
              </Section>
              <Section k="The prize" title={`Five moves cut ${bn(f.vas.doNothing)} to ${bn(f.vas.residual)}`}>
                <WaterfallMini steps={f.vas.steps} />
                <p className="text-[8px] text-ink-2 mt-1">Cumulative CBAM paid to the EU 2026–34, moves applied in sequence</p>
              </Section>
            </div>

            {/* Scorecard + findings */}
            <div className="grid grid-cols-[1.25fr_1fr] gap-[6mm] mt-[4mm]">
              <Section k="Who is exposed" title="Executive scorecard: red, amber, green on five risks">
                <table className="w-full text-[8.5px]">
                  <thead><tr className="text-ink-3"><th className="text-left font-medium pb-1">Producer</th>{SCORECARD_RULES.map((r) => <th key={r.k} className="font-medium pb-1 px-0.5 leading-tight">{r.label.replace("Cost of staying on defaults (2026)", "Default penalty").replace("Route benchmark risk", "Route risk").replace("EU margin kept in 2030", "Margin kept").replace("2030 cost per tonne", "2030 €/t").replace("2030 vs 2026 cost", "Cliff")}</th>)}</tr></thead>
                  <tbody>
                    {sc.map((r) => (
                      <tr key={r.p.id} className="border-t border-line">
                        <td className="py-[3px]"><span className="inline-flex items-center gap-1.5"><Logo id={r.p.id} name={r.p.name} size={13} />{r.p.name.replace(" (India)", "").replace("Jindal Steel (JSPL)", "JSPL")}</span></td>
                        {SCORECARD_RULES.map((k) => <td key={k.k} className="text-center"><span className="inline-block h-[9px] w-[9px] rounded-full align-middle" style={{ background: RAG[r.cells[k.k].level] }} title={r.cells[k.k].level} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="flex gap-3 text-[8px] text-ink-2 mt-1.5">
                  {(["red", "amber", "green"] as Level[]).map((l) => <span key={l} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: RAG[l] }} />{l === "red" ? "High risk" : l === "amber" ? "Watch" : "Low risk"}</span>)}
                </p>
              </Section>
              <Section k="What we found" title="Four insights that change the plan">
                <ul className="space-y-1.5 text-ink-2">
                  <li className="flex gap-1.5"><span className="font-cond font-semibold text-s1i text-[11px] leading-none mt-px">1</span><span><strong className="text-ink">Data, not steel, is the first problem.</strong> Verification removes {bn(-f.vas.steps[1].value)} before any plant is touched.</span></li>
                  <li className="flex gap-1.5"><span className="font-cond font-semibold text-s1i text-[11px] leading-none mt-px">2</span><span><strong className="text-ink">2030 is the cliff.</strong> Verified BF-BOF steel pays {eur(f.x2034[0])}–{eur(f.x2034[1])}/t by 2034.</span></li>
                  <li className="flex gap-1.5"><span className="font-cond font-semibold text-s1i text-[11px] leading-none mt-px">3</span><span><strong className="text-ink">Renewables don&apos;t cut steel CBAM.</strong> Only direct emissions are charged today.</span></li>
                  <li className="flex gap-1.5"><span className="font-cond font-semibold text-s1i text-[11px] leading-none mt-px">4</span><span><strong className="text-ink">Hydrogen now destroys value</strong> ({eur(-f.h2.npvNow)}/t); as a staged option it is worth {eur(f.h2.optionValue)}/t.</span></li>
                </ul>
              </Section>
            </div>

            {/* Recommendations */}
            <Section k="What to do" title="Five moves, in order of priority" className="mt-[4mm]">
              <ol className="grid gap-[1.6mm]">
                {recs.map((r, i) => (
                  <li key={r.t} className={`grid grid-cols-[18px_22px_1fr_70px_96px_70px] items-center gap-2 rounded-[6px] px-[3mm] py-[1.5mm] ${i === 0 ? "bg-masthead text-on-dark" : "bg-sunken"}`}>
                    <span className={`font-cond text-[14px] font-semibold ${i === 0 ? "text-on-dark-accent" : "text-ink-3"}`}>{i + 1}</span>
                    <r.I aria-hidden size={15} className={i === 0 ? "text-on-dark-accent" : "text-s1i"} />
                    <span className="font-semibold text-[10.5px]">{r.t}</span>
                    <span className={`font-cond text-[13px] font-semibold text-right ${i === 0 ? "" : "text-s3i"}`}>{r.v}</span>
                    <span className={`inline-flex items-center gap-1 text-[8.5px] ${i === 0 ? "text-on-dark-2" : "text-ink-2"}`}><Clock aria-hidden size={10} />{r.when}</span>
                    <span className={`inline-flex items-center gap-1 text-[8.5px] ${i === 0 ? "text-on-dark-2" : "text-ink-2"}`}>{r.who === "Government" ? <Landmark aria-hidden size={10} /> : <Factory aria-hidden size={10} />}{r.who}</span>
                  </li>
                ))}
              </ol>
            </Section>

            {/* Policy + MSME strip */}
            <div className="grid grid-cols-2 gap-[4mm] mt-[4mm]">
              <div className="rounded-[6px] border border-line p-[3mm] flex gap-2.5">
                <Landmark aria-hidden size={18} className="text-s1i shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">For government: make India&apos;s carbon price count</p>
                  <p className="text-ink-2 mt-0.5">An explicit, Article 9-creditable price of €20/t keeps <strong className="text-ink">{bn(f.polExplicit)}</strong> in India over 2026–34. CCTS in its intensity design keeps {m(f.polCcts)}.</p>
                </div>
              </div>
              <div className="rounded-[6px] border border-line p-[3mm] flex gap-2.5">
                <Users aria-hidden size={18} className="text-s3i shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">For MSMEs: CBAM is already here</p>
                  <p className="text-ink-2 mt-0.5">Fasteners, tubes and structures worth <strong className="text-ink">${f.dsIn.toFixed(1)}bn</strong> of EU imports are in scope today; the 2028 proposal adds ${f.dsProp.toFixed(1)}bn.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="absolute bottom-0 inset-x-0 bg-masthead text-on-dark-2 px-[12mm] py-[4mm] flex items-center gap-[5mm] text-[7.5px] leading-snug">
            <span className="shrink-0 rounded-[4px] bg-white p-[1.2mm] w-[17mm] h-[17mm] [&_svg]:w-full [&_svg]:h-full" aria-label={`QR code linking to ${URL}`} role="img" dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="flex-1">
              <p className="text-on-dark text-[9px] font-semibold">Explore the interactive model, roadmap and sources at cbam-india.vercel.app</p>
              <p className="mt-1">Method: Regulation (EU) 2023/956; Implementing Regulations 2025/2620, 2025/2621 and 2026/1740; Commission Q1–Q3 2026 certificate prices (€82.32/t in Q3, +3%/yr); FY26 company disclosures. Producer intensities and EU volumes are graded estimates (A–E). 100% pass-through unless stated. Not investment advice.</p>
            </div>
            <p className="shrink-0 text-right">Prepared by<br /><span className="text-on-dark font-semibold">Shreshtha</span></p>
          </footer>
        </article>
      </div>
    </div>
  );
}
