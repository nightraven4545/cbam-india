"use client";

import { useState } from "react";
import { LOGO_SOURCES, MONOGRAM } from "@/lib/logos";

// Small company mark: self-hosted favicon if the build fetched it, else a brand-colour monogram.
export function Logo({ id, name, size = 20 }: { id: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(!LOGO_SOURCES[id]);
  const mono = MONOGRAM[id] ?? { text: name.slice(0, 2).toUpperCase(), bg: "#5c6b7a" };
  if (failed) {
    return (
      <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-[4px] font-semibold text-white leading-none"
        style={{ width: size, height: size, background: mono.bg, fontSize: mono.text.length > 2 ? size * 0.34 : size * 0.44 }}>{mono.text}</span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/logos/${id}.png`} alt="" aria-hidden width={size} height={size} onError={() => setFailed(true)}
      className="inline-block shrink-0 rounded-[4px] bg-white object-contain" style={{ width: size, height: size }} />
  );
}

export function Company({ id, name, size = 20, className = "" }: { id: string; name: string; size?: number; className?: string }) {
  return <span className={`inline-flex items-center gap-2 ${className}`}><Logo id={id} name={name} size={size} /><span>{name}</span></span>;
}
