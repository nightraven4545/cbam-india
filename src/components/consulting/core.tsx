import Link from "next/link";

const STEPS = [
  { key: "situation", label: "Situation", href: "/" },
  { key: "question", label: "Approach", href: "/approach" },
  { key: "diagnosis", label: "Diagnosis", href: "/industry" },
  { key: "model", label: "Model", href: "/model" },
  { key: "answer", label: "Roadmap", href: "/roadmap" },
] as const;
export type Step = (typeof STEPS)[number]["key"];

// Where this page sits in the engagement storyline.
export function StoryTracker({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs" aria-label="Engagement storyline">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1">
          <Link href={s.href} aria-current={i === idx ? "step" : undefined}
            className={`rounded-md px-2 py-1 border ${i === idx ? "bg-ink text-bg border-ink" : i < idx ? "border-line text-ink-2 bg-surface" : "border-dashed border-line text-ink-3"}`}>
            {i + 1}. {s.label}
          </Link>
          {i < STEPS.length - 1 && <span className="h-px w-4 bg-line" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export function PageHeader({ step, title, lede, children }: { step?: Step; title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-8 space-y-4">
      {step && <StoryTracker current={step} />}
      <h1 className="font-cond text-[2rem] sm:text-[2.6rem] leading-[1.08] font-semibold tracking-tight max-w-[22ch] sm:max-w-[28ch]">{title}</h1>
      {lede && <div className="text-ink-2 text-base max-w-[68ch]">{lede}</div>}
      {children}
    </header>
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
  const c = tone === "cost" ? "text-s2" : tone === "good" ? "text-s3" : tone === "verified" ? "text-s1" : "text-ink";
  return (
    <div>
      <p className={`font-cond text-3xl sm:text-4xl font-semibold leading-none ${c}`}>{value}</p>
      <p className="text-sm text-ink-2 mt-2 max-w-[28ch]">{label}</p>
    </div>
  );
}
