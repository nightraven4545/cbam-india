// Shared indicators: flags, deltas, RAG, Harvey balls, badges. Meaning is never carried by colour alone.
import { IN, EU, CN, TR, KR, AE, GB, VN, TW, JP, US } from "country-flag-icons/react/3x2";
import { ArrowDownRight, ArrowUpRight, Minus, Scale, ShieldCheck, FlaskConical, Calculator } from "lucide-react";

const FLAGS = { IN, EU, CN, TR, KR, AE, GB, VN, TW, JP, US } as const;
export type FlagCode = keyof typeof FLAGS;
const COUNTRY: Record<FlagCode, string> = { IN: "India", EU: "European Union", CN: "China", TR: "Türkiye", KR: "South Korea", AE: "UAE", GB: "United Kingdom", VN: "Vietnam", TW: "Taiwan", JP: "Japan", US: "United States" };

export function Flag({ code, size = 16 }: { code: FlagCode; size?: number }) {
  const F = FLAGS[code];
  return <F title={COUNTRY[code]} aria-label={COUNTRY[code]} role="img" className="inline-block shrink-0 rounded-[2px] ring-1 ring-line" style={{ width: size * 1.5, height: size }} />;
}
export function FlagLabel({ code, children }: { code: FlagCode; children?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5"><Flag code={code} size={12} /><span>{children ?? COUNTRY[code]}</span></span>;
}

// ▲/▼ with sign and icon. `good` says which direction is favourable (default: down is good, e.g. cost).
export function Delta({ value, fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 1 }), good = "down" }: { value: number; fmt?: (n: number) => string; good?: "up" | "down" }) {
  const dir = Math.abs(value) < 1e-9 ? 0 : value > 0 ? 1 : -1;
  const fav = dir === 0 ? null : (good === "down" ? dir < 0 : dir > 0);
  const Icon = dir > 0 ? ArrowUpRight : dir < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${fav === null ? "text-ink-3" : fav ? "text-s3i" : "text-s2i"}`}>
      <Icon aria-hidden size={14} strokeWidth={2.5} />{dir > 0 ? "+" : dir < 0 ? "−" : ""}{fmt(Math.abs(value))}
    </span>
  );
}

export type RagLevel = "red" | "amber" | "green";
const RAG_C: Record<RagLevel, string> = { red: "#c2410c", amber: "#b7791f", green: "#15803d" };
const RAG_T: Record<RagLevel, string> = { red: "High", amber: "Medium", green: "Low" };
export function Rag({ level, label }: { level: RagLevel; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r="5.5" fill={RAG_C[level]} />{level === "amber" && <rect x="3" y="5" width="6" height="2" fill="#fff" />}{level === "red" && <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="#fff" strokeWidth="1.5" />}{level === "green" && <path d="M3 6.2l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" />}</svg>
      <span>{label ?? RAG_T[level]}</span>
    </span>
  );
}

// Harvey ball, 0–4 quarters filled. Text equivalent in the title.
export function Harvey({ score, label }: { score: 0 | 1 | 2 | 3 | 4; label?: string }) {
  const r = 7, c = 8, a = (score / 4) * 2 * Math.PI;
  const x = c + r * Math.sin(a), y = c - r * Math.cos(a);
  const path = score === 0 ? "" : score === 4 ? "" : `M${c},${c} L${c},${c - r} A${r},${r} 0 ${score > 2 ? 1 : 0} 1 ${x},${y} Z`;
  return (
    <svg width="16" height="16" role="img" aria-label={label ?? `${score} of 4`} className="inline-block align-middle">
      <title>{label ?? `${score} of 4`}</title>
      <circle cx={c} cy={c} r={r} fill={score === 4 ? "var(--ink)" : "var(--surface)"} stroke="var(--ink)" strokeWidth="1.25" />
      {path && <path d={path} fill="var(--ink)" />}
    </svg>
  );
}

export function LawBadge({ status }: { status: "law" | "proposal" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] rounded-md border px-1.5 py-0.5 ${status === "law" ? "border-s1i text-s1i" : "border-s2i text-s2i"}`}>
      <Scale aria-hidden size={11} />{status === "law" ? "Law" : "Proposal"}
    </span>
  );
}
export function BasisBadge({ basis }: { basis: "modelled" | "estimate" | "verified" }) {
  const m = { modelled: { I: Calculator, t: "Modelled", c: "border-line text-ink-2" }, estimate: { I: FlaskConical, t: "Estimate", c: "border-line text-ink-3" }, verified: { I: ShieldCheck, t: "Verified data", c: "border-s1i text-s1i" } }[basis];
  return <span className={`inline-flex items-center gap-1 text-[11px] rounded-md border px-1.5 py-0.5 ${m.c}`}><m.I aria-hidden size={11} />{m.t}</span>;
}
