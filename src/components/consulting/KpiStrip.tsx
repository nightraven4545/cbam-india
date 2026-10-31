// Headline numbers with an icon each. Server-safe (no hooks).
import type { LucideIcon } from "lucide-react";

export interface Kpi { icon: LucideIcon; value: string; label: string; tone?: "s1" | "s2" | "s3" | "ink" }
const TONE = { s1: "text-s1i", s2: "text-s2i", s3: "text-s3i", ink: "text-ink" } as const;

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k) => (
        <li key={k.label} className="bg-surface p-4 flex gap-3">
          <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sunken ${TONE[k.tone ?? "ink"]}`}><k.icon aria-hidden size={18} /></span>
          <div className="min-w-0">
            <p className={`font-cond text-2xl font-semibold leading-none tabular-nums ${TONE[k.tone ?? "ink"]}`}>{k.value}</p>
            <p className="text-sm text-ink-2 mt-1.5">{k.label}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
