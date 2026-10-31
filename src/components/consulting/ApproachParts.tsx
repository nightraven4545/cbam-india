"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Hypothesis } from "@/lib/storyline";
import { AnsweredIcon, RejectedIcon, RefinedIcon, DataIcon, EngineIcon, AnalysisIcon, SynthesisIcon, RoadmapIcon, TakeawayIcon } from "@/components/visual/icons";

const VERDICT = {
  confirmed: { I: AnsweredIcon, t: "Confirmed", c: "text-s3i" },
  rejected: { I: RejectedIcon, t: "Rejected", c: "text-s2i" },
  refined: { I: RefinedIcon, t: "Refined", c: "text-s1i" },
} as const;

export function HypothesisScorecard({ items }: { items: Hypothesis[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ol className="divide-y divide-line rounded-lg border border-line">
      {items.map((h, i) => {
        const { I, t, c } = VERDICT[h.verdict];
        const isOpen = open === i;
        return (
          <li key={h.h}>
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}
              className="w-full grid grid-cols-[28px_1fr_auto] sm:grid-cols-[28px_1fr_120px_200px_20px] items-center gap-3 px-3 py-3 text-left hover:bg-sunken">
              <I aria-hidden size={20} className={c} />
              <span className="font-medium leading-snug">{h.h}</span>
              <span className={`hidden sm:inline text-sm font-medium ${c}`}>{t}</span>
              <span className="text-right sm:text-left">
                <span className="block font-cond text-xl font-semibold leading-none">{h.figure}</span>
                <span className="block text-[11px] text-ink-3 mt-1">{h.figureLabel}</span>
              </span>
              <ChevronDown aria-hidden size={16} className={`hidden sm:block text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && <p className="px-3 pb-3 sm:pl-[52px] text-sm text-ink-2"><span className={`sm:hidden font-medium ${c}`}>{t}. </span>{h.evidence}</p>}
          </li>
        );
      })}
    </ol>
  );
}

const FLOW = [
  { I: DataIcon, t: "Sources", d: "EUR-Lex, Commission prices, Eurostat, Comtrade, FY26 filings", href: "/sources" },
  { I: EngineIcon, t: "Regulation engine", d: "CBAM formula as code, 33 unit tests", href: "/methodology" },
  { I: AnalysisIcon, t: "Seven analyses", d: "Exposure, risk, competitiveness, levers, trade, timing, policy", href: "/model" },
  { I: SynthesisIcon, t: "Synthesis", d: "Hypotheses tested, value at stake", href: "/" },
  { I: RoadmapIcon, t: "Roadmap", d: "12 initiatives, owners, KPIs", href: "/roadmap" },
];
export function Workflow() {
  return (
    <ol className="grid gap-3 md:grid-cols-5">
      {FLOW.map((s, i) => (
        <li key={s.t} className="relative">
          <Link href={s.href} className="block h-full rounded-lg border border-line bg-surface p-3 hover:border-ink-3">
            <s.I aria-hidden size={20} className="text-s1i" />
            <p className="font-semibold mt-2">{s.t}</p>
            <p className="text-xs text-ink-2 mt-1">{s.d}</p>
          </Link>
          {i < FLOW.length - 1 && <span aria-hidden className="hidden md:block absolute top-1/2 -right-3 w-3 h-0.5 bg-ink-3" />}
        </li>
      ))}
    </ol>
  );
}

export function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg border-l-4 border-s1 bg-surface px-4 py-3 text-[15px]">
      <TakeawayIcon aria-hidden size={18} className="mt-0.5 shrink-0 text-s1i" /><span><span className="font-semibold">Takeaway: </span>{children}</span>
    </p>
  );
}

// Sticky in-page contents with scroll-spy.
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const obs = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting); if (v[0]) setActive(v[0].target.id); }, { rootMargin: "-20% 0px -70% 0px" });
    items.forEach((i) => { const el = document.getElementById(i.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [items]);
  return (
    <nav aria-label="On this page" className="hidden xl:block sticky top-20 self-start text-sm">
      <p className="text-ink-3 text-xs mb-2">On this page</p>
      <ol className="space-y-1.5 border-l border-line">
        {items.map((i) => (
          <li key={i.id}><a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined}
            className={`block -ml-px border-l-2 pl-3 ${active === i.id ? "border-ink text-ink font-medium" : "border-transparent text-ink-3 hover:text-ink"}`}>{i.label}</a></li>
        ))}
      </ol>
    </nav>
  );
}
