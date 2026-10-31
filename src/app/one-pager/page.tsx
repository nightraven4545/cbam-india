import type { Metadata } from "next";
import { facts, initiatives } from "@/lib/storyline";

export const metadata: Metadata = { title: "One-page summary", description: "A one-page A4 summary of the CBAM India analysis." };

export default function OnePager() {
  const f = facts();
  const { eur, m, bn } = f.fmt;
  const share = Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100);
  const top = initiatives().sort((a, b) => b.impact - a.impact).slice(0, 5);
  return (
    <article className="onepager mx-auto max-w-[800px] rounded-[10px] border border-line bg-surface p-8 text-[13px] leading-snug">
      <header className="border-b-2 border-ink pb-3">
        <p className="text-xs text-ink-3">CBAM India · one-page summary · 31 Oct 2026 · cbam-india.vercel.app</p>
        <h1 className="font-cond text-[26px] font-semibold leading-tight mt-1">Europe&apos;s carbon border will cost India&apos;s five largest steel exporters {bn(f.vas.doNothing)} by 2034 if they do nothing; {share}% of it is a tax on missing data</h1>
      </header>
      <section className="grid grid-cols-3 gap-4 py-4 border-b border-line">
        {[[eur(f.defaultPerT) + "/t", "2026 CBAM on Indian HR coil, EU default values"], [eur(f.verifiedPerT) + "/t", "Same tonne, verified, efficient BF-BOF"], [m(f.verification) + "/yr", "Value of verified data to EU buyers"]].map(([v, k]) => (
          <div key={k}><p className="font-cond text-2xl font-semibold">{v}</p><p className="text-ink-2">{k}</p></div>
        ))}
      </section>
      <section className="grid grid-cols-2 gap-6 py-4 border-b border-line">
        <div>
          <h2 className="font-semibold mb-1">What we found</h2>
          <ul className="list-disc pl-4 space-y-1 text-ink-2">
            <li>The 2026 &quot;2.5% year&quot; is a myth: the phase-out applies to the benchmark, not to emissions.</li>
            <li>The cliff is 2030, when free allocation drops from 77.5% to 51.5%; verified BF-BOF steel pays {eur(f.x2034[0])}–{eur(f.x2034[1])}/t by 2034.</li>
            <li>On default values, Indian coil loses to EU mills above {eur(f.xEUdefault ?? 0)}/tCO₂; verified, it holds until {eur(f.xEUverified ?? 0)}.</li>
            <li>Renewable PPAs do not cut steel CBAM (direct emissions only); for aluminium they are insurance.</li>
            <li>H₂-DRI built in 2026 destroys {eur(-f.h2.npvNow)}/t; as an option it is worth {eur(f.h2.optionValue)}/t.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-1">What to do</h2>
          <ol className="list-decimal pl-4 space-y-1 text-ink-2">
            {top.map((x) => <li key={x.id}><strong className="text-ink">{x.name}</strong> ({x.owner}, {x.horizon})</li>)}
          </ol>
        </div>
      </section>
      <section className="py-4 border-b border-line">
        <h2 className="font-semibold mb-1">Value at stake, 2026–34 (€ m)</h2>
        <p className="text-ink-2">{f.vas.steps.map((s) => `${s.label} ${Math.round(s.value / 1e6).toLocaleString("en-IN")}`).join(" → ")}</p>
      </section>
      <section className="pt-4">
        <h2 className="font-semibold mb-1">Policy</h2>
        <p className="text-ink-2">An explicit, Article 9-creditable carbon price on exports keeps {bn(f.polExplicit)} in India over 2026–34; CCTS in its intensity design keeps {m(f.polCcts)}. MSME goods worth US${f.dsIn.toFixed(1)}bn are already in scope; the 2028 proposal adds US${f.dsProp.toFixed(1)}bn.</p>
        <p className="text-xs text-ink-3 mt-3">Method: CBAM Regulation 2023/956; Implementing Regs. 2025/2620, 2026/1740; Commission Q1–Q3 2026 prices; FY26 company disclosures. Producer intensities and EU volumes are graded estimates. Full sources at /sources.</p>
      </section>
    </article>
  );
}
