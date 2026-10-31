import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans-condensed/500.css";
import "@fontsource/ibm-plex-sans-condensed/600.css";
import "@fontsource/ibm-plex-sans-condensed/700.css";
import "./globals.css";
import Link from "next/link";
import Nav from "@/components/Nav";
import PageExtras from "@/components/PageExtras";

const DESC = "An engagement-style analysis of the EU Carbon Border Adjustment Mechanism for Indian steel, aluminium and cement: exposure, levers, policy and a roadmap.";
export const metadata: Metadata = {
  metadataBase: new URL("https://cbam-india.vercel.app"),
  title: { default: "CBAM India: what Europe's carbon border costs Indian industry", template: "%s · CBAM India" },
  description: DESC,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "CBAM India", url: "https://cbam-india.vercel.app", description: DESC },
  twitter: { card: "summary_large_image", description: DESC },
  authors: [{ name: "Shreshtha", url: "https://github.com/nightraven4545" }],
  keywords: ["CBAM", "CBAM India", "carbon border adjustment mechanism", "Indian steel", "CBAM default values", "CBAM cost", "EU ETS", "CCTS", "Article 9", "green steel", "aluminium", "cement"],
};

// Structured data for search engines and AI assistants: the site and the report it publishes.
const LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": "https://cbam-india.vercel.app/#site", url: "https://cbam-india.vercel.app", name: "CBAM India", inLanguage: "en" },
    {
      "@type": "Report", "@id": "https://cbam-india.vercel.app/#report", url: "https://cbam-india.vercel.app",
      name: "CBAM India: what Europe's carbon border costs Indian steel, aluminium and cement",
      description: DESC, datePublished: "2026-10-31", inLanguage: "en", isPartOf: { "@id": "https://cbam-india.vercel.app/#site" },
      author: { "@type": "Person", name: "Shreshtha", url: "https://github.com/nightraven4545" },
      about: ["EU Carbon Border Adjustment Mechanism", "CBAM", "Indian steel industry", "carbon pricing", "Article 9 CBAM", "CCTS India", "green steel"],
      keywords: "CBAM India, carbon border adjustment mechanism, Indian steel exports, CBAM default values India, CBAM cost calculator, EU ETS, CCTS, Article 9, green steel taxonomy, decarbonisation",
      spatialCoverage: ["India", "European Union"], temporalCoverage: "2026/2034",
    },
  ],
};

const FOOT: [string, [string, string][]][] = [
  ["The analysis", [["Summary", "/"], ["Approach", "/approach"], ["Industry", "/industry"], ["Model", "/model"], ["Roadmap", "/roadmap"]]],
  ["Deep dives", [["Policy & MSMEs", "/policy"], ["ESG & carbon", "/esg"], ["Case study", "/case-study"], ["Methodology", "/methodology"], ["Sources", "/sources"]]],
  ["Downloads", [["Excel model", "/cbam-india-model.xlsx"], ["One-page PDF", "/CBAM-India-one-pager.pdf"], ["Presentation deck", "/deck"]]],
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply a saved light/dark choice before first paint (no flash). */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body className="antialiased min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">Skip to content</a>
        <Nav />
        <main id="main" className="mx-auto max-w-[1240px] px-4 py-8 sm:py-10">{children}<PageExtras /></main>
        <footer className="on-dark bg-masthead text-on-dark-2 print:hidden">
          <div className="mx-auto max-w-[1240px] px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] text-sm">
            <div>
              <p className="font-cond text-lg font-semibold text-on-dark">CBAM India</p>
              <p className="mt-2 max-w-[42ch]">What Europe&apos;s carbon border costs Indian steel, aluminium and cement, and what to do about it. Prepared by Shreshtha, 31 Oct 2026.</p>
              <a href="https://github.com/nightraven4545/cbam-india" className="inline-block mt-3 text-on-dark underline underline-offset-2">Source code on GitHub</a>
            </div>
            {FOOT.map(([title, links]) => (
              <div key={title}>
                <p className="text-xs uppercase tracking-wide text-on-dark-2 mb-2">{title}</p>
                <ul className="space-y-1.5">
                  {links.map(([label, href]) => <li key={href}>{href.endsWith(".xlsx") || href.endsWith(".pdf") ? <a href={href} download className="text-on-dark hover:underline">{label}</a> : <Link href={href} className="text-on-dark hover:underline">{label}</Link>}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-[1240px] px-4 pb-8 text-xs border-t border-white/10 pt-4">
            Producer inputs are graded A–E for confidence; grade D values are analyst estimates, not company disclosures. Company logos are trademarks of their owners, used for identification only. Not investment advice.
          </p>
        </footer>
      </body>
    </html>
  );
}
