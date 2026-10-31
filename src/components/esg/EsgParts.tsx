// Static ESG exhibits (no hooks): price ladder, cost flow, frameworks matrix, ESG scorecard, greenwashing tests, India stack.
import { ArrowRight, Check, Contrast as CircleHalf, Minus, Gavel, Layers } from "lucide-react";
import { Flag, Rag } from "@/components/visual/indicators";
import { Company } from "@/components/visual/Logo";
import type { EsgProfile, Mark, PricePoint, Rag as RagT } from "@/lib/esg";
import { CASES, FRAMEWORKS, GW_TESTS, REQUIREMENTS, STACK, TAXONOMY, borderGap, greenwashTests, requiredRate, historicRate, taxonomyStars } from "@/lib/esg";

const eur = (n: number, d = 0) => `€${n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d })}`;
const pct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n * 100).toFixed(1)}%`;

function Scroll({ min, label, children }: { min: number; label: string; children: React.ReactNode }) {
  return <div tabIndex={0} role="region" aria-label={label} className="relative overflow-x-auto"><div style={{ minWidth: min }}>{children}</div></div>;
}

// 1. Carbon-price ladder: horizontal bars on one €/t scale, with the CBAM gap marked for each origin.
export function PriceLadder({ items }: { items: PricePoint[] }) {
  const max = Math.max(...items.map((i) => i.eur ?? 0)) * 1.05;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.id} className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[260px_1fr_150px] items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-2 text-sm"><Flag code={i.flag} size={13} />{i.name}</span>
          <span className="relative h-6 rounded bg-sunken" role="img" aria-label={`${i.name}: ${i.native}${i.kind === "Border" ? "" : `; CBAM still collects ${eur(borderGap(i), 2)} per chargeable tonne`}`}>
            {i.eur !== null && <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${(i.eur / max) * 100}%`, background: i.flag === "EU" ? "var(--s1)" : "var(--s3)" }} />}
            {i.eur === null && <span className="absolute inset-y-0 left-2 flex items-center text-xs text-ink-3">no traded price</span>}
          </span>
          <span className="text-sm tabular-nums sm:text-right">
            <span className="font-semibold">{i.eur === null ? "–" : eur(i.eur, 2)}</span>
            <span className="block text-[11px] text-ink-3">{i.kind === "Border" ? "sets the CBAM charge" : `gap to CBAM ${eur(borderGap(i), 2)}`}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// 2. How a carbon price reaches an Indian plant: a chain of boxes with live numbers, Article 9 as a side branch.
export function CostFlow({ steps, credit }: { steps: { label: string; value: string; sub: string }[]; credit: { value: string; sub: string } }) {
  return (
    <div>
      <ol className="flex flex-col md:flex-row md:items-stretch gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="contents">
            <div className={`md:flex-1 rounded-lg border p-3 bg-surface ${i === steps.length - 1 ? "border-s2" : "border-line"}`}>
              <p className="text-xs text-ink-3">{s.label}</p>
              <p className="font-cond text-xl font-semibold tabular-nums leading-tight mt-1">{s.value}</p>
              <p className="text-[11px] text-ink-2 mt-1">{s.sub}</p>
            </div>
            {i < steps.length - 1 && <ArrowRight aria-hidden size={16} className="self-center shrink-0 text-ink-3 rotate-90 md:rotate-0" />}
          </li>
        ))}
      </ol>
      <div className="mt-3 rounded-lg border border-dashed border-s3 p-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
        <Flag code="IN" size={12} /><span className="font-medium">Side branch, Article 9:</span>
        <span className="font-cond text-lg font-semibold text-s3i">{credit.value}</span><span className="text-ink-2">{credit.sub}</span>
      </div>
    </div>
  );
}

// 3. Disclosure frameworks × requirements.
const MARK: Record<Mark, { I: typeof Check; t: string; c: string }> = {
  yes: { I: Check, t: "Required", c: "text-s3i" }, part: { I: CircleHalf, t: "Partial, phased or optional", c: "text-s1i" }, no: { I: Minus, t: "Not covered", c: "text-ink-3" },
};
export function FrameworksMatrix() {
  return (
    <Scroll min={860} label="Disclosure frameworks matrix">
      <table className="w-full text-sm">
        <thead className="text-xs text-ink-3">
          <tr><th className="text-left py-2 pr-3 font-medium">Framework</th>{REQUIREMENTS.map((r) => <th key={r} className="py-2 px-1 font-medium text-center w-[9%]">{r}</th>)}</tr>
        </thead>
        <tbody>
          {FRAMEWORKS.map((f) => (
            <tr key={f.id} className="border-t border-line">
              <th scope="row" className="text-left py-2 pr-3 font-normal">
                <span className="inline-flex items-center gap-1.5 font-medium">{f.flag && <Flag code={f.flag} size={11} />}{f.name}</span>
                <span className="block text-[11px] text-ink-3">{f.owner} · {f.note}</span>
              </th>
              {f.marks.map((m, i) => { const { I, t, c } = MARK[m]; return <td key={i} className="text-center"><I role="img" aria-label={`${REQUIREMENTS[i]}: ${t}`} size={16} className={`inline ${c}`} /></td>; })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="flex flex-wrap gap-4 text-xs text-ink-2 mt-2">
        {(Object.keys(MARK) as Mark[]).map((k) => { const { I, t, c } = MARK[k]; return <span key={k} className="inline-flex items-center gap-1"><I aria-hidden size={13} className={c} />{t}</span>; })}
      </p>
    </Scroll>
  );
}

// 4. Producer ESG scorecard.
function Stars({ n }: { n: number | null }) {
  if (n === null) return <span className="text-ink-3">Not disclosed</span>;
  if (n === 0) return <span className="text-s2i font-medium">Not green (≥ {TAXONOMY.green})</span>;
  return <span aria-label={`${n} stars`}>{"★".repeat(n)}<span className="text-ink-3">{"★".repeat(5 - n)}</span></span>;
}
export function EsgScorecard({ rows }: { rows: EsgProfile[] }) {
  const nd = <span className="text-ink-3">Not disclosed</span>;
  return (
    <Scroll min={900} label="Producer ESG scorecard">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-3">
          <tr>{["Producer", "Latest intensity (S1+2)", "Green Steel Taxonomy", "2030 target", "Cut needed / yr", "Trend / yr", "Net zero", "Renewables"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const req = requiredRate(p), hist = historicRate(p);
            return (
              <tr key={p.id} className="border-t border-line align-top">
                <th scope="row" className="py-2.5 pr-3 font-medium text-left whitespace-nowrap"><Company id={p.id} name={p.name} size={20} /><span className="block text-[11px] text-ink-3 font-normal mt-1">Grade {p.grade}</span></th>
                <td className="py-2.5 pr-3 tabular-nums">{p.intensity === null ? nd : <>{p.intensity.toFixed(2)} t/tcs<span className="block text-[11px] text-ink-3">{p.intensityYear}</span></>}</td>
                <td className="py-2.5 pr-3"><Stars n={taxonomyStars(p.intensity)} /></td>
                <td className="py-2.5 pr-3">{p.target2030 === null ? <span className="text-ink-2 text-xs">{p.targetNote}</span> : <>{p.target2030.toFixed(2)} t<span className="block text-[11px] text-ink-3 max-w-[22ch]">{p.targetNote}</span></>}</td>
                <td className="py-2.5 pr-3 tabular-nums">{req === null ? nd : <span className="font-medium">{pct(req)}</span>}</td>
                <td className="py-2.5 pr-3 tabular-nums">{hist === null ? nd : <span className={hist > 0 ? "text-s2i font-medium" : ""}>{pct(hist)}</span>}</td>
                <td className="py-2.5 pr-3">{p.netZero ?? nd}{p.netZeroNote && <span className="block text-[11px] text-ink-3">{p.netZeroNote}</span>}</td>
                <td className="py-2.5 pr-3 tabular-nums">{p.reShare === null ? nd : `${(p.reShare * 100).toFixed(p.reShare < 0.01 ? 3 : 0)}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Scroll>
  );
}

// 5. Greenwashing-risk tests per producer, plus case cards.
const RAG_LABEL: Record<RagT, string> = { green: "Pass", amber: "Watch", red: "Fail" };
export function GreenwashGrid({ rows }: { rows: EsgProfile[] }) {
  return (
    <div className="space-y-6">
      <Scroll min={820} label="Greenwashing risk tests">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-3">
            <tr><th className="py-2 pr-3 font-medium">Producer</th>{GW_TESTS.map((t) => <th key={t.id} className="py-2 pr-3 font-medium" title={t.basis}>{t.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const r = greenwashTests(p);
              return (
                <tr key={p.id} className="border-t border-line">
                  <th scope="row" className="py-2.5 pr-3 font-medium text-left whitespace-nowrap"><Company id={p.id} name={p.name} size={18} /></th>
                  {GW_TESTS.map((t) => <td key={t.id} className="pr-3"><Rag level={r[t.id]} label={RAG_LABEL[r[t.id]]} /></td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Scroll>
      <ul className="grid gap-3 md:grid-cols-3">
        {CASES.map((c) => (
          <li key={c.who} className="rounded-lg border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-xs text-ink-3"><Gavel aria-hidden size={14} />{c.where}</p>
            <p className="font-semibold mt-1">{c.who}</p>
            <p className="text-sm text-ink-2 mt-1">{c.what}</p>
            <p className="text-sm mt-2 border-t border-line pt-2"><span className="font-medium">Lesson: </span>{c.lesson}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 6. India's carbon stack: layers from PAT up to the CBAM link.
export function CarbonStack() {
  const layers = [...STACK].reverse();
  return (
    <ol className="space-y-1.5" aria-label="India's carbon-pricing stack, top layer first">
      {layers.map((l, i) => (
        <li key={l.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px] items-center rounded-lg border border-line bg-surface p-3"
          style={{ borderLeftWidth: 4, borderLeftColor: i === 0 ? "var(--s2)" : "var(--s1)" }}>
          <div>
            <p className="font-semibold inline-flex items-center gap-2"><Layers aria-hidden size={15} className="text-ink-3" />{l.name}<span className="text-xs font-normal text-ink-3">{l.years}</span></p>
            <p className="text-sm text-ink-2 mt-0.5">{l.what}</p>
          </div>
          <p className={`text-xs rounded-md border px-2 py-1 justify-self-start sm:justify-self-end ${i === 0 ? "border-s2i text-s2i" : "border-line text-ink-2"}`}>{l.status}</p>
        </li>
      ))}
    </ol>
  );
}
