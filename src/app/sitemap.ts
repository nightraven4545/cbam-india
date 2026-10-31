import type { MetadataRoute } from "next";

export const dynamic = "force-static";
const BASE = "https://cbam-india.vercel.app";
const PAGES = ["", "approach", "industry", "model", "roadmap", "policy", "esg", "case-study", "deck", "methodology", "sources", "analysis", "one-pager"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p, i) => ({ url: `${BASE}/${p}`, lastModified: new Date("2026-10-31"), changeFrequency: "monthly", priority: i === 0 ? 1 : i < 7 ? 0.8 : 0.5 }));
}
