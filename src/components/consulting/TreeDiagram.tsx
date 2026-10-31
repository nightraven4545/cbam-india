"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { INode } from "./charts";
import { AnsweredIcon, OpenIcon, PartlyIcon } from "@/components/visual/icons";

const STATUS = {
  answered: { I: AnsweredIcon, t: "Answered", c: "text-s3i" },
  partly: { I: PartlyIcon, t: "Partly answered", c: "text-s2i" },
  open: { I: OpenIcon, t: "Open", c: "text-ink-3" },
} as const;

function Status({ s }: { s?: INode["status"] }) {
  if (!s) return null;
  const { I, t, c } = STATUS[s];
  return <I aria-label={t} role="img" size={15} className={`shrink-0 ${c}`} />;
}

// Horizontal MECE tree (key question → branches → sub-questions). Text stays hidden until a node is opened.
export default function TreeDiagram({ root }: { root: INode }) {
  const [sel, setSel] = useState<INode | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!sel) return;
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sel]);
  const open = (n: INode, el: HTMLButtonElement) => { lastRef.current = el; setSel(n); };
  const close = () => { setSel(null); lastRef.current?.focus(); };

  return (
    <div className="relative">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="rounded-lg bg-ink text-bg p-4">
          <p className="text-xs opacity-75">Key question</p>
          <p className="font-cond text-[17px] font-semibold leading-snug mt-1">{root.q}</p>
        </div>
        <ol className="space-y-3 lg:border-l-2 lg:border-ink lg:pl-5">
          {root.children?.map((b) => (
            <li key={b.id} className="relative grid gap-2 md:grid-cols-[230px_1fr] md:items-center">
              <span className="hidden lg:block absolute -left-5 top-1/2 h-0.5 w-5 bg-ink" aria-hidden />
              <button type="button" onClick={(e) => open(b, e.currentTarget)}
                className="relative text-left rounded-lg border-2 border-ink bg-surface px-3 py-2.5 hover:bg-sunken flex items-start gap-2">
                <Status s={b.status} />
                <span className="font-semibold text-sm leading-snug">{b.q}</span>
              </button>
              <ul className="grid gap-1.5 sm:grid-cols-2 md:border-l md:border-line md:pl-3">
                {b.children?.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={(e) => open(c, e.currentTarget)} aria-haspopup="dialog"
                      className="w-full h-full text-left rounded-md border border-line bg-surface px-2.5 py-2 hover:border-ink-3 flex items-start gap-1.5">
                      <Status s={c.status} />
                      <span className="text-[13px] leading-snug">{c.q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
      <p className="flex flex-wrap gap-4 text-xs text-ink-3 mt-4">
        {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => { const { I, t, c } = STATUS[k]; return <span key={k} className="inline-flex items-center gap-1"><I aria-hidden size={13} className={c} />{t}</span>; })}
        <span>Select any box to see what we found.</span>
      </p>

      {sel && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/30" onClick={close}>
          <aside role="dialog" aria-modal="true" aria-labelledby="tree-drawer-title" onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-md bg-surface border-l border-line p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <h3 id="tree-drawer-title" className="font-cond text-xl font-semibold leading-snug">{sel.q}</h3>
              <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="rounded-md border border-line p-1"><X size={16} /></button>
            </div>
            {sel.status && <p className="mt-2 text-sm inline-flex items-center gap-1.5"><Status s={sel.status} />{STATUS[sel.status].t}</p>}
            {sel.finding && <p className="mt-4 text-ink-2">{sel.finding}</p>}
            {sel.children && (
              <ul className="mt-4 space-y-2">
                {sel.children.map((c) => <li key={c.id} className="rounded-md border border-line p-3 text-sm"><p className="font-medium flex gap-1.5"><Status s={c.status} />{c.q}</p>{c.finding && <p className="text-ink-2 mt-1">{c.finding}</p>}</li>)}
              </ul>
            )}
            {sel.href && <Link href={sel.href} className="mt-5 inline-block rounded-md bg-ink text-bg px-4 py-2 text-sm font-medium">See the analysis</Link>}
          </aside>
        </div>
      )}
    </div>
  );
}
