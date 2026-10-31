import type { MetadataRoute } from "next";

export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: "https://cbam-india.vercel.app/sitemap.xml", host: "https://cbam-india.vercel.app" };
}
