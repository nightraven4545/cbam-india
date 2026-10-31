"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Counts up once when scrolled into view. Final value is rendered for SSR and reduced motion.
export function Ticker({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, value, { duration: 1.1, ease: [0.2, 0.7, 0.2, 1], onUpdate: setShown });
    return () => c.stop();
  }, [inView, reduce, value]);
  return <span ref={ref}>{prefix}{Math.round(shown).toLocaleString("en-IN")}{suffix}</span>;
}
