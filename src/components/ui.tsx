import type { Confidence } from "@/lib/data";

export const eur = (n: number, d = 0) => `${n < 0 ? "−" : ""}€${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d })}`;
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const m = (n: number) => `€${(n / 1e6).toLocaleString("en-IN", { maximumFractionDigits: 0 })}m`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const AXIS = { stroke: "var(--ink-3)", fontSize: 12 };
export const TIP = { contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }, labelStyle: { color: "var(--ink)" } };

export function Grade({ c }: { c: Confidence }) {
  return <span title={`Confidence ${c}`} className="ml-1 inline-block rounded border border-line px-1 text-[10px] text-ink-3 align-middle">{c}</span>;
}

export function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-line bg-surface p-4 sm:p-6">
      <h2 className="font-cond text-lg sm:text-xl font-semibold leading-snug">{title}</h2>
      {sub && <p className="text-sm text-ink-2 mt-1">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Slider(props: { label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-ink-2"><span>{props.label}</span><span className="text-ink font-medium">{props.fmt(props.value)}</span></span>
      <input type="range" className="w-full accent-[var(--s1)]" min={props.min} max={props.max} step={props.step} value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))} aria-label={props.label} />
    </label>
  );
}

