import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { key: "situation", label: "Situation", href: "/" },
  { key: "question", label: "Approach", href: "/approach" },
  { key: "diagnosis", label: "Diagnosis", href: "/industry" },
  { key: "model", label: "Model", href: "/model" },
  { key: "answer", label: "Roadmap", href: "/roadmap" },
] as const;
export type Step = (typeof STEPS)[number]["key"];

// Where this page sits in the engagement storyline: a chevron stepper on the navy band.
export function StoryTracker({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Engagement storyline">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <Link href={s.href} aria-current={i === idx ? "step" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${i === idx ? "bg-on-dark-accent text-masthead" : i < idx ? "bg-white/10 text-on-dark hover:bg-white/16" : "border border-white/20 text-on-dark-2 hover:text-on-dark"}`}>
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${i === idx ? "bg-masthead text-on-dark" : "bg-white/12"}`}>{i + 1}</span>{s.label}
          </Link>
          {i < STEPS.length - 1 && <ChevronRight aria-hidden size={14} className="text-on-dark-2" />}
        </li>
      ))}
    </ol>
  );
}

// Page header on a full-bleed navy band. Children (summary grids, KPI strips) render as light cards on the band.
export function PageHeader({ step, title, lede, children }: { step?: Step; title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="on-dark relative isolate -mt-8 sm:-mt-10 mb-8 pt-8 pb-9 sm:pt-10 sm:pb-11 space-y-4 text-on-dark">
      <div aria-hidden className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-masthead-2 border-b border-white/10" />
      {step && <StoryTracker current={step} />}
      <h1 className="font-cond text-[2rem] sm:text-[2.6rem] leading-[1.08] font-semibold tracking-tight max-w-[22ch] sm:max-w-[28ch]">{title}</h1>
      {lede && <div className="text-on-dark-2 text-base max-w-[68ch]">{lede}</div>}
      {children && <div className="text-ink pt-2">{children}</div>}
    </header>
  );
}

// Previous / next step at the foot of storyline pages.
export function StoryPager({ path }: { path: string }) {
  const i = STEPS.findIndex((s) => (s.href === "/" ? path === "/" : path.startsWith(s.href)));
  if (i < 0) return null;
  const prev = STEPS[i - 1], next = STEPS[i + 1];
  return (
    <nav aria-label="Storyline" className="mt-14 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link href={prev.href} className="group rounded-xl border border-line bg-surface p-4 hover:border-ink-3">
          <span className="text-xs text-ink-3 inline-flex items-center gap-1"><ChevronLeft aria-hidden size={14} />Previous step</span>
          <span className="block font-cond text-lg font-semibold mt-1">{STEPS.indexOf(prev) + 1}. {prev.label}</span>
        </Link>
      ) : <span />}
      {next && (
        <Link href={next.href} className="group rounded-xl bg-masthead text-on-dark p-4 sm:text-right hover:bg-masthead-3">
          <span className="text-xs text-on-dark-2 inline-flex items-center gap-1">Next step<ChevronRight aria-hidden size={14} /></span>
          <span className="block font-cond text-lg font-semibold mt-1">{STEPS.indexOf(next) + 1}. {next.label}</span>
        </Link>
      )}
    </nav>
  );
}

// Section heading inside a page: a full-sentence action title.
export function SectionTitle({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 mt-12 first:mt-0">
      {kicker && <p className="text-sm text-ink-3 mb-1">{kicker}</p>}
      <h2 className="font-cond text-2xl sm:text-[1.7rem] leading-tight font-semibold max-w-[40ch]">{title}</h2>
      {children && <div className="text-ink-2 mt-2 max-w-[70ch]">{children}</div>}
    </div>
  );
}

export function SourceNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-ink-3 mt-3 leading-relaxed">Source: {children}</p>;
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[10px] border border-line bg-surface ${className}`}>{children}</div>;
}

export function Stat({ value, label, tone }: { value: React.ReactNode; label: string; tone?: "cost" | "good" | "verified" }) {
  const c = tone === "cost" ? "text-s2i" : tone === "good" ? "text-s3i" : tone === "verified" ? "text-s1i" : "text-ink";
  return (
    <div>
      <p className={`font-cond text-3xl sm:text-4xl font-semibold leading-none ${c}`}>{value}</p>
      <p className="text-sm text-ink-2 mt-2 max-w-[28ch]">{label}</p>
    </div>
  );
}
