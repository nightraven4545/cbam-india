"use client";

import { Children, useCallback, useEffect, useState } from "react";

// Present mode: one slide at a time, full screen, arrow keys / space to move, Esc to leave.
export default function Presenter({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const [on, setOn] = useState(false);
  const [i, setI] = useState(0);
  const go = useCallback((d: number) => setI((x) => Math.min(slides.length - 1, Math.max(0, x + d))), [slides.length]);
  useEffect(() => {
    if (!on) return;
    const key = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(-1); }
      if (e.key === "Escape") setOn(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [on, go]);
  const start = () => { setI(0); setOn(true); document.documentElement.requestFullscreen?.().catch(() => {}); };
  const stop = () => { setOn(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  if (!on) return (
    <div>
      <button type="button" onClick={start} className="btn btn-primary mb-6">Present (← → to move, Esc to exit)</button>
      {slides}
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-auto p-4 sm:p-8" role="dialog" aria-label={`Slide ${i + 1} of ${slides.length}`}>
      <div className="max-w-[1100px] mx-auto">{slides[i]}</div>
      <div className="fixed bottom-4 right-4 flex gap-2 text-sm">
        <button type="button" onClick={() => go(-1)} className="rounded-md border border-line bg-surface px-3 py-1.5" disabled={i === 0}>Previous</button>
        <button type="button" onClick={() => go(1)} className="rounded-md border border-line bg-surface px-3 py-1.5" disabled={i === slides.length - 1}>Next</button>
        <button type="button" onClick={stop} className="btn btn-primary">Exit</button>
      </div>
    </div>
  );
}
