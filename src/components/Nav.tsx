"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Briefcase, ChevronDown, Compass, Factory, FileSpreadsheet, FileText, FlaskConical, Home, Landmark, Leaf, Menu, Moon,
  Presentation, Route, SlidersHorizontal, Sun, X, type LucideIcon,
} from "lucide-react";
import { Flag } from "./visual/indicators";

type Item = { href: string; label: string; I: LucideIcon; download?: boolean };
const PRIMARY: Item[] = [
  { href: "/", label: "Summary", I: Home },
  { href: "/approach", label: "Approach", I: Compass },
  { href: "/industry", label: "Industry", I: Factory },
  { href: "/model", label: "Model", I: SlidersHorizontal },
  { href: "/roadmap", label: "Roadmap", I: Route },
  { href: "/policy", label: "Policy", I: Landmark },
  { href: "/esg", label: "ESG & carbon", I: Leaf },
];
const RESOURCES: Item[] = [
  { href: "/deck", label: "Deck", I: Presentation },
  { href: "/case-study", label: "Case study", I: Briefcase },
  { href: "/methodology", label: "Methodology", I: FlaskConical },
  { href: "/sources", label: "Sources", I: BookOpen },
  { href: "/cbam-india-model.xlsx", label: "Excel model", I: FileSpreadsheet, download: true },
  { href: "/CBAM-India-one-pager.pdf", label: "One-page PDF", I: FileText, download: true },
];
const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

// Pages navigate client-side; files download with a plain anchor.
function ItemLink({ n, className, children, current }: { n: Item; className: string; children: React.ReactNode; current: boolean }) {
  return n.download
    ? <a href={n.href} download className={className}>{children}</a>
    : <Link href={n.href} aria-current={current ? "page" : undefined} className={className}>{children}</Link>;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 mr-3 shrink-0 text-on-dark" aria-label="CBAM India, summary">
      <span className="flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-1" aria-hidden>
        <Flag code="IN" size={11} /><span className="text-[10px] text-on-dark-2">→</span><Flag code="EU" size={11} />
      </span>
      <span className="font-cond text-lg font-semibold tracking-tight whitespace-nowrap">CBAM India</span>
    </Link>
  );
}

// Light/dark switch. The initial theme is applied before paint by the script in layout.tsx.
function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const flip = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* storage blocked: theme still applies for this page */ }
    setDark(next);
  };
  return (
    <button type="button" onClick={flip} className="btn btn-on-dark btn-sm w-[1.875rem] px-0" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}>
      {dark ? <Sun aria-hidden size={15} /> : <Moon aria-hidden size={15} />}
    </button>
  );
}

function Resources({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null), box = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", key); document.addEventListener("mousedown", click);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("mousedown", click); };
  }, [open]);
  const active = RESOURCES.some((r) => !r.download && isActive(path, r.href));
  return (
    <div ref={box} className="relative">
      <button ref={btn} type="button" aria-expanded={open} aria-controls="nav-resources" onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 h-9 text-sm whitespace-nowrap ${active || open ? "bg-white/12 text-on-dark" : "text-on-dark-2 hover:text-on-dark hover:bg-white/8"}`}>
        Resources<ChevronDown aria-hidden size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul id="nav-resources" className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          {RESOURCES.map((r) => (
            <li key={r.href}>
              <ItemLink n={r} current={!r.download && isActive(path, r.href)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-2 hover:bg-sunken hover:text-ink aria-[current=page]:bg-sunken aria-[current=page]:text-ink aria-[current=page]:font-medium">
                <r.I aria-hidden size={16} className="text-ink-3" />{r.label}{r.download && <span className="ml-auto text-[11px] text-ink-3">Download</span>}
              </ItemLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Nav() {
  const path = usePathname();
  const [sheet, setSheet] = useState(false);
  useEffect(() => setSheet(false), [path]);
  return (
    <header className="on-dark sticky top-0 z-30 bg-masthead text-on-dark border-b border-white/10 print:hidden">
      <nav className="mx-auto max-w-[1240px] px-4 h-14 flex items-center gap-1" aria-label="Main">
        <Logo />
        <ul className="hidden xl:flex items-center gap-0.5">
          {PRIMARY.map((n) => {
            const active = isActive(path, n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2.5 h-9 text-sm whitespace-nowrap ${active ? "bg-white/12 text-on-dark font-medium" : "text-on-dark-2 hover:text-on-dark hover:bg-white/8"}`}>
                  <n.I aria-hidden size={15} className={active ? "text-on-dark-accent" : ""} />{n.label}
                  {active && <span aria-hidden className="absolute left-2.5 right-2.5 -bottom-[11px] h-[3px] rounded-full bg-on-dark-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden xl:block"><Resources path={path} /></div>
          <a href="/cbam-india-model.xlsx" download className="btn btn-primary btn-sm hidden sm:inline-flex"><FileSpreadsheet aria-hidden size={14} />Excel model</a>
          <ThemeToggle />
          <button type="button" className="btn btn-on-dark btn-sm xl:hidden" aria-expanded={sheet} aria-controls="nav-sheet" onClick={() => setSheet((s) => !s)}>
            {sheet ? <X aria-hidden size={15} /> : <Menu aria-hidden size={15} />}Menu
          </button>
        </div>
      </nav>
      {sheet && (
        <div id="nav-sheet" className="xl:hidden border-t border-white/10 bg-masthead">
          <div className="mx-auto max-w-[1240px] px-4 py-4 grid gap-4 sm:grid-cols-2">
            {[["The analysis", PRIMARY], ["Resources", RESOURCES]].map(([title, items]) => (
              <div key={title as string}>
                <p className="text-xs uppercase tracking-wide text-on-dark-2 mb-2">{title as string}</p>
                <ul className="grid gap-1">
                  {(items as Item[]).map((n) => {
                    const active = !n.download && isActive(path, n.href);
                    return (
                      <li key={n.href}>
                        <ItemLink n={n} current={active}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-white/12 text-on-dark font-medium" : "text-on-dark-2 hover:bg-white/8 hover:text-on-dark"}`}>
                          <n.I aria-hidden size={16} className={active ? "text-on-dark-accent" : ""} />{n.label}
                        </ItemLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
