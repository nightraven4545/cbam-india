"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Summary" },
  { href: "/approach", label: "Approach" },
  { href: "/industry", label: "Industry" },
  { href: "/model", label: "Model" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/policy", label: "Policy & MSMEs" },
  { href: "/markets", label: "Carbon markets" },
  { href: "/deck", label: "Deck" },
  { href: "/methodology", label: "Methodology" },
  { href: "/sources", label: "Sources" },
  { href: "/case-study", label: "Case study" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="border-b border-line bg-surface sticky top-0 z-30 print:hidden">
      <nav className="mx-auto max-w-[1240px] px-4 h-14 flex items-center gap-1 overflow-x-auto" aria-label="Main">
        <Link href="/" className="font-cond text-lg font-semibold tracking-tight mr-4 whitespace-nowrap">CBAM India</Link>
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
              className={`relative px-2.5 h-14 inline-flex items-center text-sm whitespace-nowrap ${active ? "text-ink font-medium" : "text-ink-3 hover:text-ink"}`}>
              {n.label}
              {active && <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 bg-ink" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
