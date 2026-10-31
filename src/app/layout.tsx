import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBAM India: Carbon Border Exposure",
  description: "How the EU Carbon Border Adjustment Mechanism hits Indian steel exporters, what verified data is worth, and which decarbonisation levers pay back.",
};

const NAV = [
  { href: "/", label: "Model" },
  { href: "/policy", label: "Policy & MSMEs" },
  { href: "/analysis", label: "Analysis" },
  { href: "/deck", label: "Deck" },
  { href: "/markets", label: "Carbon markets" },
  { href: "/methodology", label: "Methodology" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-20 print:hidden">
          <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6 overflow-x-auto">
            <Link href="/" className="font-semibold whitespace-nowrap">CBAM<span className="text-ink-3">·</span>India</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm text-ink-2 hover:text-ink whitespace-nowrap">{n.label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-ink-3 border-t border-line print:hidden">
          Built by Shreshtha · Data as of 31 Oct 2026 · Figures graded A–E by confidence; D-grade producer inputs are estimates, not company disclosures. Not investment advice.
        </footer>
      </body>
    </html>
  );
}
