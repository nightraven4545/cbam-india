import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/consulting/core";

export const metadata: Metadata = { title: "Analysis", description: "Where each part of the CBAM India analysis now lives." };

const LINKS = [
  { href: "/", t: "Executive summary", d: "Governing thought, the 2030 cash cliff, value at stake and the five recommendations." },
  { href: "/approach", t: "Approach", d: "Issue tree, hypotheses tested, workplan and data confidence." },
  { href: "/industry", t: "Industry and players", d: "Who ships what to the EU, exposure vs ability to absorb, route effects, aluminium and cement." },
  { href: "/model", t: "Scenario model", d: "Exposure, risk, competitiveness, levers, trade allocation and timing, all interactive." },
  { href: "/roadmap", t: "Roadmap", d: "Value-at-stake waterfall, prioritisation matrix, three-horizon roadmap and KPIs." },
  { href: "/policy", t: "Policy and MSMEs", d: "Article 9 simulator, downstream radar and the MSME calculator." },
];

export default function Analysis() {
  return (
    <div>
      <PageHeader title="The written analysis is now split into the engagement pages" lede="Each part of the original analysis has moved next to the exhibits that prove it." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.href}><Link href={l.href} className="block rounded-[10px] border border-line bg-surface p-5 hover:border-ink-3"><p className="font-semibold">{l.t}</p><p className="text-sm text-ink-2 mt-1">{l.d}</p></Link></li>
        ))}
      </ul>
    </div>
  );
}
