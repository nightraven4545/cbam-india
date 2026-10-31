// Consultant exhibits drawn as plain SVG/HTML. No hooks, so they render on server pages and inside the client model.
import { Flag, Harvey, Rag, Delta } from "@/components/visual/indicators";
import { Company } from "@/components/visual/Logo";
import type { DriverNode, MaccBar, MekkoCol, Score, Level } from "@/lib/exhibits";
import { CRITERIA, SCORECARD_RULES } from "@/lib/exhibits";

const eur = (n: number) => `${n < 0 ? "−" : ""}€${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
const TXT = { fontSize: 11, fill: "var(--ink-2)" } as const;

function Scroll({ min, children, label }: { min: number; children: React.ReactNode; label: string }) {
  return <div tabIndex={0} role="region" aria-label={label} className="relative overflow-x-auto"><div style={{ minWidth: min }}>{children}</div></div>;
}

// Marimekko: width = share of EU flat-steel imports, height = CBAM €/t split into verified cost and the default penalty.
export function Mekko({ cols, year }: { cols: MekkoCol[]; year: number }) {
  const W = 760, H = 320, L = 44, B = 56, T = 12, pw = W - L - 8, ph = H - B - T;
  const max = Math.max(...cols.map((c) => (c.verified ?? 0) + (c.penalty ?? 0))) * 1.08;
  const y = (v: number) => T + ph - (v / max) * ph;
  const ticks = [0, 100, 200, 300, 400, 500].filter((t) => t <= max);
  return (
    <Scroll min={620} label="Marimekko of EU flat-steel imports">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`EU flat-steel imports by origin and CBAM cost per tonne in ${year}`}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--line)" /><text x={L - 6} y={y(t) + 4} textAnchor="end" {...TXT}>€{t}</text></g>)}
        {cols.map((c) => {
          const x = L + c.x0 * pw, w = c.share * pw - 2;
          if (c.verified === null) {
            return (
              <g key={c.name}>
                <rect x={x} y={T} width={w} height={ph} fill="var(--sunken)" stroke="var(--line)" strokeDasharray="4 3"><title>{`${c.name}: ${c.mt.toFixed(1)} Mt (${Math.round(c.share * 100)}%). ${c.note}`}</title></rect>
                <text x={x + w / 2} y={T + ph / 2 - 6} textAnchor="middle" {...TXT}>{c.name}</text>
                <text x={x + w / 2} y={T + ph / 2 + 10} textAnchor="middle" {...TXT} fontSize={10}>cost by origin not modelled</text>
                <text x={x + w / 2} y={H - B + 18} textAnchor="middle" fontSize={12} fill="var(--ink)">{Math.round(c.share * 100)}% · {c.mt.toFixed(1)} Mt</text>
              </g>
            );
          }
          const top = c.verified + (c.penalty ?? 0);
          return (
            <g key={c.name}>
              <rect x={x} y={y(c.verified)} width={w} height={ph + T - y(c.verified)} fill="var(--s1)"><title>{`${c.name}, verified: ${eur(c.verified)}/t`}</title></rect>
              <rect x={x} y={y(top)} width={w} height={y(c.verified) - y(top)} fill="var(--s2)"><title>{`${c.name}, extra on defaults: ${eur(c.penalty ?? 0)}/t (${c.note})`}</title></rect>
              <text x={x + w / 2} y={y(c.verified) + 16} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={600} stroke="#0e2238" strokeWidth={3} paintOrder="stroke">{eur(c.verified)}</text>
              {(c.penalty ?? 0) > 25 && <text x={x + w / 2} y={y(top) + 16} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={600} stroke="#0e2238" strokeWidth={3} paintOrder="stroke">+{eur(c.penalty!)}</text>}
              <foreignObject x={x + w / 2 - 9} y={H - B + 4} width={18} height={12}><Flag code={c.flag!} size={12} /></foreignObject>
              <text x={x + w / 2} y={H - B + 30} textAnchor="middle" fontSize={12} fill="var(--ink)">{c.name}</text>
              <text x={x + w / 2} y={H - B + 45} textAnchor="middle" {...TXT}>{Math.round(c.share * 100)}% · {c.mt.toFixed(1)} Mt</text>
            </g>
          );
        })}
      </svg>
      <Legend items={[["var(--s1)", "CBAM cost with verified data"], ["var(--s2)", "Extra paid on country defaults + mark-up"], ["var(--sunken)", "Origins without a published split"]]} />
    </Scroll>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2 mt-2" aria-label="Legend">
      {items.map(([c, t]) => <li key={t} className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block h-2.5 w-3.5 rounded-sm ring-1 ring-line" style={{ background: c }} />{t}</li>)}
    </ul>
  );
}

// Marginal abatement cost curve: width = MtCO₂/yr abated on EU-bound tonnes, height = €/tCO₂, dashed line = certificate price.
export function Macc({ bars, totalMt, price }: { bars: MaccBar[]; totalMt: number; price: number }) {
  const W = 760, H = 300, L = 52, B = 34, T = 16, pw = W - L - 12, ph = H - B - T;
  const lo = Math.min(0, ...bars.map((b) => b.mac)) * 1.15, hi = Math.max(price, ...bars.map((b) => b.mac)) * 1.12;
  const y = (v: number) => T + ((hi - v) / (hi - lo)) * ph;
  const x = (v: number) => L + (v / (totalMt || 1)) * pw;
  const step = hi - lo > 300 ? 100 : 50;
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);
  return (
    <Scroll min={600} label="Marginal abatement cost curve">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Marginal abatement cost curve with the certificate price at ${eur(price)} per tonne`}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - 12} y1={y(t)} y2={y(t)} stroke="var(--line)" /><text x={L - 6} y={y(t) + 4} textAnchor="end" {...TXT}>{eur(t)}</text></g>)}
        <line x1={L} x2={W - 12} y1={y(0)} y2={y(0)} stroke="var(--ink-3)" />
        {bars.map((b, i) => {
          const top = Math.min(y(b.mac), y(0)), h = Math.abs(y(b.mac) - y(0));
          const w = Math.max(2, x(b.x0 + b.widthMt) - x(b.x0) - 1.5);
          return (
            <g key={b.id}>
              <rect x={x(b.x0)} y={top} width={w} height={Math.max(1.5, h)} fill={b.cbamRelevant ? "var(--s1)" : "var(--neutral)"}>
                <title>{`${i + 1}. ${b.name}: ${eur(b.mac)}/tCO₂, ${b.widthMt.toFixed(2)} MtCO₂/yr${b.cbamRelevant ? "" : " (does not reduce CBAM)"}`}</title>
              </rect>
              <text x={x(b.x0) + w / 2} y={b.mac >= 0 ? top - 4 : top + h + 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">{i + 1}</text>
            </g>
          );
        })}
        <line x1={L} x2={W - 12} y1={y(price)} y2={y(price)} stroke="var(--s2)" strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={L + 6} y={y(price) - 6} fontSize={11} fontWeight={600} fill="var(--s2i)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">Certificate price {eur(price)}/t</text>
        <text x={L} y={H - 8} {...TXT}>0</text>
        <text x={W - 12} y={H - 8} textAnchor="end" {...TXT}>{totalMt.toFixed(1)} MtCO₂ / yr abated on EU-bound tonnes →</text>
      </svg>
      <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2 text-xs text-ink-2 mt-2">
        {bars.map((b, i) => (
          <li key={b.id} className="flex gap-1.5"><span className="w-4 text-right font-semibold text-ink">{i + 1}</span>
            <span aria-hidden className="mt-1 inline-block h-2 w-2.5 rounded-sm shrink-0" style={{ background: b.cbamRelevant ? "var(--s1)" : "var(--neutral)" }} />
            <span>{b.name} · {eur(b.mac)}/t · {b.widthMt.toFixed(2)} Mt{b.cbamRelevant ? "" : " · no CBAM effect"}</span></li>
        ))}
      </ol>
    </Scroll>
  );
}

// Value-driver tree: boxes with live values; leaves carry the change in the annual hit when the driver rises 10%.
const fmtNode = (n: DriverNode) => n.unit === "€/yr" ? `€${(n.value / 1e6).toFixed(1)}m` : n.unit === "%" ? `${(n.value * 100).toFixed(1)}%` : n.unit === "€/t" ? `${eur(n.value)}/t` : `${n.value.toFixed(n.unit === "Mt" ? 2 : 3)} ${n.unit}`;
const OPS: Record<string, string> = { hit: "×", net: "−", certs: "−", free: "×" };
function Node({ n, depth }: { n: DriverNode; depth: number }) {
  const inline = n.children?.every((c) => c.delta === undefined && !c.children);
  return (
    <div className="flex items-center gap-3">
      <div className={`w-44 shrink-0 rounded-lg border px-3 py-2 ${depth === 0 ? "bg-ink text-bg border-ink" : "bg-surface border-line"}`}>
        <p className={`text-[11px] leading-tight ${depth === 0 ? "opacity-80" : "text-ink-3"}`}>{n.label}</p>
        <p className="font-cond text-lg font-semibold leading-tight mt-0.5 tabular-nums">{fmtNode(n)}</p>
        {inline && <p className="text-[11px] text-ink-3 mt-0.5">= {n.children!.map((c) => `${c.label} ${fmtNode(c)}`).join(" × ")}</p>}
        {n.delta !== undefined && <p className="text-[11px] mt-0.5"><span className="text-ink-3">+10% → </span><Delta value={n.delta / 1e6} fmt={(v) => `€${v.toFixed(1)}m`} /></p>}
      </div>
      {n.children && !inline && (
        <div className="relative flex flex-col gap-2 border-l-2 border-ink-3 pl-3">
          <span aria-hidden className="absolute -left-[9px] top-1/2 -translate-y-1/2 rounded-full bg-surface px-0.5 text-xs font-semibold text-ink-3">{OPS[n.id] ?? ""}</span>
          {n.children.map((c) => <Node key={c.id} n={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}
export function DriverTree({ root }: { root: DriverNode }) {
  return <Scroll min={760} label="Value-driver tree"><Node n={root} depth={0} /></Scroll>;
}

// Harvey-ball assessment table.
export function HarveyTable({ rows }: { rows: { id: string; name: string; scores: Score[] }[] }) {
  const words = ["None", "Low", "Medium", "High", "Very high"];
  return (
    <Scroll min={640} label="Lever assessment">
      <table className="w-full text-sm">
        <thead className="text-left text-ink-3 text-xs">
          <tr><th className="py-2 pr-3 font-medium">Lever</th>{CRITERIA.map((c) => <th key={c} className="py-2 px-2 font-medium text-center">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="py-2 pr-3">{r.name}</td>
              {r.scores.map((s, i) => <td key={i} className="text-center"><Harvey score={s} label={`${CRITERIA[i]}: ${words[s]}`} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink-3 mt-2 flex flex-wrap items-center gap-3">
        {([0, 1, 2, 3, 4] as Score[]).map((s) => <span key={s} className="inline-flex items-center gap-1"><Harvey score={s} label={words[s]} />{words[s]}</span>)}
      </p>
    </Scroll>
  );
}

// Heatmap: producers × years, single-hue ramp, highlighted column.
export function Heatmap({ rows, years, highlight }: { rows: { id: string; name: string; values: number[] }[]; years: readonly number[]; highlight: number }) {
  const max = Math.max(...rows.flatMap((r) => r.values));
  return (
    <Scroll min={720} label="Heatmap of CBAM cost per tonne">
      <table className="w-full text-sm border-separate border-spacing-0.5">
        <thead><tr><th className="text-left text-xs font-medium text-ink-3 pr-2">€/t</th>{years.map((y) => <th key={y} className={`text-xs font-medium pb-1 ${y === highlight ? "text-ink" : "text-ink-3"}`}>{y}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="text-left font-normal pr-2 whitespace-nowrap"><Company id={r.id} name={r.name} size={18} /></th>
              {r.values.map((v, i) => (
                <td key={i} className={`text-center tabular-nums py-2 rounded-md text-ink ${years[i] === highlight ? "outline-2 outline-ink -outline-offset-2" : ""}`}
                  style={{ background: `color-mix(in oklab, var(--s2) ${Math.round((v / max) * 48)}%, var(--surface))` }}>{eur(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}

// Football field: range across scenarios per producer, base marker, defaults marker.
export function FootballField({ rows }: { rows: { id: string; name: string; lo: number; hi: number; base: number; onDefaults: number }[] }) {
  const max = Math.max(...rows.map((r) => r.onDefaults)) * 1.05;
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[150px_1fr] sm:grid-cols-[190px_1fr] items-center gap-3">
            <Company id={r.id} name={r.name} size={18} />
            <div className="relative h-7 rounded bg-sunken" role="img" aria-label={`${r.name}: ${eur(r.lo)} to ${eur(r.hi)} per tonne, base ${eur(r.base)}, on defaults ${eur(r.onDefaults)}`}>
              <div className="absolute inset-y-1 rounded-sm bg-s1" style={{ left: pct(r.lo), width: `calc(${pct(r.hi)} - ${pct(r.lo)})` }} />
              <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: pct(r.base) }} />
              <svg aria-hidden className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" width="12" height="12" style={{ left: pct(r.onDefaults) }}><path d="M6 0L12 6 6 12 0 6Z" fill="var(--s2)" /></svg>
              <span className="absolute -top-0.5 text-[11px] text-ink-2 tabular-nums -translate-x-full pr-1" style={{ left: pct(r.lo) }}>{eur(r.lo)}</span>
              <span className="absolute -top-0.5 text-[11px] text-ink-2 tabular-nums pl-1" style={{ left: pct(r.hi) }}>{eur(r.hi)}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="flex flex-wrap gap-4 text-xs text-ink-2 mt-3">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block h-2.5 w-5 rounded-sm bg-s1" />Range across price and policy scenarios (verified data)</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="inline-block h-3 w-0.5 bg-ink" />Base case</span>
        <span className="inline-flex items-center gap-1.5"><svg aria-hidden width="10" height="10"><path d="M5 0L10 5 5 10 0 5Z" fill="var(--s2)" /></svg>Base case on EU default values</span>
      </p>
    </div>
  );
}

// Executive scorecard: producers × dimensions, RAG with value and logo.
type Cell = { v: number; level: Level };
const SC_FMT: Record<string, (v: number) => string> = {
  cost2030: (v) => `${eur(v)}/t`, margin: (v) => (v < 0 ? "none left" : `${Math.round(v * 100)}% kept`), penalty: (v) => `+${eur(v)}/t`,
  route: (v) => `${Math.round(v * 100)}% DRI`, cliff: (v) => `${v.toFixed(1)}×`,
};
const RISK: Record<Level, string> = { red: "High risk", amber: "Watch", green: "Low risk" };
export function Scorecard({ rows }: { rows: { p: { id: string; name: string }; cells: Record<string, Cell> }[] }) {
  return (
    <Scroll min={760} label="Executive scorecard">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-3">
          <tr><th className="py-2 pr-3 font-medium">Producer</th>{SCORECARD_RULES.map((r) => <th key={r.k} className="py-2 pr-3 font-medium" title={r.rule}>{r.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p.id} className="border-t border-line">
              <th scope="row" className="py-2.5 pr-3 font-medium text-left whitespace-nowrap"><Company id={r.p.id} name={r.p.name} size={20} /></th>
              {SCORECARD_RULES.map((k) => {
                const c = r.cells[k.k];
                return <td key={k.k} className="pr-3"><Rag level={c.level} label={SC_FMT[k.k](c.v)} /><span className="sr-only"> ({RISK[c.level]})</span></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  );
}
