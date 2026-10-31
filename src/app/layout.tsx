import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans-condensed/500.css";
import "@fontsource/ibm-plex-sans-condensed/600.css";
import "@fontsource/ibm-plex-sans-condensed/700.css";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "CBAM India: what Europe's carbon border costs Indian industry", template: "%s · CBAM India" },
  description: "An engagement-style analysis of the EU Carbon Border Adjustment Mechanism for Indian steel, aluminium and cement: exposure, levers, policy and a roadmap.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">Skip to content</a>
        <Nav />
        <main id="main" className="mx-auto max-w-[1240px] px-4 py-8 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-[1240px] px-4 py-8 text-xs text-ink-3 border-t border-line print:hidden">
          Prepared by Shreshtha, 31 Oct 2026. Producer inputs are graded A–E for confidence; grade D values are analyst estimates, not company disclosures. Not investment advice.
        </footer>
      </body>
    </html>
  );
}
