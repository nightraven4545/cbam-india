// Roadmap visuals: owner/horizon semantics, a 2026–34 Gantt with regulatory milestones, and KPI cards. Server-safe.
import { CalendarRange, Factory, Landmark, Scale, Telescope, Users, Zap, type LucideIcon } from "lucide-react";
import { BasisBadge, LawBadge } from "@/components/visual/indicators";
import type { Initiative } from "@/lib/storyline";
import { CBAM_EVENTS } from "@/lib/timeline";

export const OWNER: Record<Initiative["owner"], { I: LucideIcon; tone: "s1" | "s2" | "s3" }> = {
  Company: { I: Factory, tone: "s1" }, Government: { I: Landmark, tone: "s2" }, "MSME clusters": { I: Users, tone: "s3" },
};
export const HORIZON: Record<Initiative["horizon"], { I: LucideIcon; hint: string }> = {
  Now: { I: Zap, hint: "start this quarter" }, "2026–29": { I: CalendarRange, hint: "before the 2030 cliff" }, "2030+": { I: Telescope, hint: "staged options" },
};

export function OwnerLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Owners">
      {(Object.keys(OWNER) as Initiative["owner"][]).map((o) => { const { I, tone } = OWNER[o]; return <li key={o} className="inline-flex items-center gap-1.5"><I aria-hidden size={14} style={{ color: `var(--${tone}i)` }} />{o}</li>; })}
    </ul>
  );
}

const YRS = Array.from({ length: 9 }, (_, i) => 2026 + i);
// Gantt: one row per initiative grouped by owner, a regulation track on top, 2030 highlighted.
export function RoadmapGantt({ items, num }: { items: Initiative[]; num: Map<string, number> }) {
  const col = (y: number) => y - 2026 + 2; // grid column (1 = label column)
  const owners = Object.keys(OWNER) as Initiative["owner"][];
  const events = CBAM_EVENTS.filter((e) => e.year >= 2026 && e.year <= 2034);
  return (
    <div tabIndex={0} role="region" aria-label="Roadmap timeline 2026 to 2034" className="relative overflow-x-auto">
      <div className="min-w-[860px] grid grid-cols-[260px_repeat(9,minmax(0,1fr))] text-sm">
        <div />
        {YRS.map((y) => <div key={y} className={`text-center text-xs pb-2 font-medium ${y === 2030 ? "text-s2i" : "text-ink-3"}`}>{y}{y === 2030 && <span className="block text-[10px] font-normal">cash cliff</span>}</div>)}

        <div className="flex items-center gap-1.5 py-2 pr-3 border-t border-line font-semibold"><Scale aria-hidden size={15} className="text-ink-3" />EU regulation</div>
        {YRS.map((y) => {
          const ev = events.filter((e) => e.year === y);
          return (
            <div key={y} className={`border-t border-line py-1.5 px-0.5 flex flex-col items-center gap-1 ${y === 2030 ? "bg-sunken" : ""}`}>
              {ev.map((e) => (
                <span key={e.t} title={`${e.when}: ${e.t} (${e.law ? "law" : "proposal"})`} className="block">
                  <svg width="12" height="12" role="img" aria-label={`${e.when}: ${e.t}, ${e.law ? "law" : "proposal"}`}><path d="M6 0L12 6 6 12 0 6Z" fill={e.law ? "var(--ink)" : "var(--surface)"} stroke={e.law ? "var(--ink)" : "var(--s2)"} strokeWidth="1.5" /></svg>
                </span>
              ))}
            </div>
          );
        })}

        {owners.map((o) => {
          const { I, tone } = OWNER[o];
          return (
            <div key={o} className="contents">
              <div className="col-span-10 flex items-center gap-1.5 pt-3 pb-1 border-t border-line text-xs font-semibold uppercase tracking-wide" style={{ color: `var(--${tone}i)` }}><I aria-hidden size={14} />{o}</div>
              {items.filter((x) => x.owner === o).map((x) => (
                <div key={x.id} className="contents">
                  <div className="py-1.5 pr-3 text-[13px] leading-snug"><span className="text-ink-3 tabular-nums">{num.get(x.id)}.</span> {x.name}</div>
                  <div className="relative py-1.5" style={{ gridColumn: `2 / span 9` }}>
                    <div className="absolute inset-0 grid grid-cols-9" aria-hidden>{YRS.map((y) => <span key={y} className={y === 2030 ? "bg-sunken" : ""} />)}</div>
                    <div className="relative grid grid-cols-9 h-6 items-center">
                      <div className="h-3.5 rounded-full" title={`${x.start}–${x.end}`}
                        style={{ gridColumn: `${col(x.start) - 1} / ${col(x.end)}`, gridRow: 1, background: `var(--${tone})`, opacity: 0.85 }} />
                      {x.milestone && (
                        <span className="relative z-10 justify-self-center" style={{ gridColumn: `${col(x.milestone.year) - 1}`, gridRow: 1 }} title={`${x.milestone.year}: ${x.milestone.label}`}>
                          <svg width="14" height="14" role="img" aria-label={`Milestone ${x.milestone.year}: ${x.milestone.label}`}><path d="M7 0.5L13.5 7 7 13.5 0.5 7Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" /></svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2 mt-3">
        <span className="inline-flex items-center gap-1.5"><svg aria-hidden width="11" height="11"><path d="M5.5 0L11 5.5 5.5 11 0 5.5Z" fill="var(--ink)" /></svg>Regulation in force</span>
        <span className="inline-flex items-center gap-1.5"><svg aria-hidden width="11" height="11"><path d="M5.5 0L11 5.5 5.5 11 0 5.5Z" fill="var(--surface)" stroke="var(--s2)" strokeWidth="1.5" /></svg>Proposal</span>
        <span className="inline-flex items-center gap-1.5"><svg aria-hidden width="11" height="11"><path d="M5.5 0.5L10.5 5.5 5.5 10.5 0.5 5.5Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" /></svg>Initiative milestone (hover for detail)</span>
        <OwnerLegend />
      </div>
    </div>
  );
}

// Swimlane card for one initiative.
export function InitiativeCard({ x, n, modelled, value }: { x: Initiative; n: number; modelled: boolean; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-2.5">
      <p className="font-medium leading-snug"><span className="text-ink-3 tabular-nums">{n}.</span> {x.name}</p>
      <p className="text-xs text-ink-2 mt-1"><span className="font-medium">First 90 days:</span> {x.first90}</p>
      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
        <span className="font-cond text-base font-semibold tabular-nums">{value}</span>
        <BasisBadge basis={modelled ? "modelled" : "estimate"} />
        {x.milestone && <span className="text-ink-3">· {x.milestone.year}: {x.milestone.label}</span>}
      </div>
    </div>
  );
}

// KPI cards: icon, why it matters, then baseline → 2027 → 2030 as a three-step track.
export interface KpiDef { I: LucideIcon; kpi: string; why: string; steps: [string, string, string]; law?: "law" | "proposal" }
export function KpiCards({ items }: { items: KpiDef[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((k) => (
        <li key={k.kpi} className="rounded-lg border border-line bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sunken text-s1i"><k.I aria-hidden size={18} /></span>
            <div><p className="font-semibold leading-snug">{k.kpi}</p><p className="text-xs text-ink-3 mt-0.5">{k.why}</p></div>
            {k.law && <span className="ml-auto"><LawBadge status={k.law} /></span>}
          </div>
          <ol className="mt-3 grid grid-cols-3 text-center text-xs">
            {(["Baseline", "2027", "2030"] as const).map((h, i) => (
              <li key={h} className={`relative py-2 ${i < 2 ? "border-r border-line" : ""}`}>
                <span className="block text-ink-3">{h}</span>
                <span className={`block font-cond text-[15px] font-semibold mt-0.5 ${i === 2 ? "text-s3i" : ""}`}>{k.steps[i]}</span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ul>
  );
}
