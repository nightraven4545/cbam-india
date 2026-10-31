// Answer-first FAQ for readers, search engines and AI assistants. Every number is computed from the engine.
import { facts } from "./storyline";
import { mekko } from "./exhibits";
import { PRODUCTS } from "./data";
import { ESG, TAXONOMY } from "./esg";

export interface QA { q: string; a: string }
export function faq(): QA[] {
  const f = facts();
  const { eur, m, bn } = f.fmt;
  const share = Math.round((-f.vas.steps[1].value / f.vas.doNothing) * 100);
  const mk = mekko(2030), india = mk.find((c) => c.flag === "IN")!, korea = mk.find((c) => c.flag === "KR")!;
  const disclosed = ESG.filter((p) => p.intensity !== null);
  return [
    { q: "How much will EU CBAM cost Indian steel exporters?",
      a: `The five largest Indian steel exporters (JSW Steel, Tata Steel, AM/NS India, Jindal Steel and SAIL) face about ${bn(f.vas.doNothing)} of CBAM cost on EU sales over 2026–2034 if they stay on EU default values, and about ${bn(f.vas.residual)} after verification, efficiency, scrap, plant routing and an Indian carbon price. The cost steepens from 2030, when free allocation falls from 77.5% to 51.5%.` },
    { q: "What is India's CBAM default value for hot-rolled steel?",
      a: `${PRODUCTS.steel.defaultValue.value} tCO₂ per tonne for CN 7208 (and 7209/7210), set by Implementing Regulation (EU) 2026/1740, plus a mark-up of 10% in 2026, 20% in 2027 and 30% from 2028. Verified BF-BOF steel runs at roughly 2.0–2.6 t, so defaults overcharge most Indian mills.` },
    { q: "Is verified emissions data worth it for Indian exporters?",
      a: `Yes. On a tonne of Tata Steel hot-rolled coil in 2026, CBAM is ${eur(f.defaultPerT)} on default values but ${eur(f.verifiedPerT)} with verified data. Across the five largest exporters, verification is worth ${m(f.verification)} a year to EU buyers and removes ${share}% of the 2026–34 bill.` },
    { q: "How does India compare with Korea and Türkiye under CBAM?",
      a: `With verified data, India's 2030 CBAM cost on hot-rolled coil (${eur(india.verified!)}/t) is close to South Korea's (${eur(korea.verified!)}/t). On default values India pays ${eur(india.penalty!)}/t more, the largest default penalty of the major suppliers to the EU.` },
    { q: "Do renewables reduce CBAM on Indian steel and aluminium?",
      a: "Not today. Iron, steel and aluminium are charged on direct emissions only (Annex II of Regulation (EU) 2023/956), so a renewable power contract cuts the real footprint but not the CBAM bill. Cement is different: its indirect emissions are charged, so renewables and waste-heat recovery reduce cement CBAM." },
    { q: "Can India keep CBAM revenue at home through its carbon market?",
      a: `Article 9 lets EU importers deduct a carbon price effectively paid in India. An explicit price of €20/t on every exported tonne would keep about ${bn(f.polExplicit)} in India over 2026–34; the Carbon Credit Trading Scheme as designed (an intensity scheme) would keep only about ${m(f.polCcts)}. The EU has not yet recognised any third-country price.` },
    { q: "Which Indian MSME exports are already covered by CBAM?",
      a: `Screws, bolts and nuts, tubes and pipes, structures and other articles of iron, steel and aluminium are already in scope: about $${f.dsIn.toFixed(1)}bn of 2024 EU imports from India. The 2028 downstream proposal would add about $${f.dsProp.toFixed(1)}bn more, mainly vehicle parts, transmission shafts, valves and machinery parts.` },
    { q: "Does any Indian steelmaker qualify as green steel?",
      a: `Not among those that disclose an intensity. India's Green Steel Taxonomy (Ministry of Steel, Dec 2024) sets ${TAXONOMY.green} tCO₂e per tonne as the green threshold; the disclosed Scope 1+2 intensities are ${disclosed.map((p) => `${p.name} ${p.intensity!.toFixed(2)}`).join(", ")}.` },
  ];
}
