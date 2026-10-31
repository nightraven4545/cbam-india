import type { Metadata } from "next";
import PolicyLab from "@/components/PolicyLab";

export const metadata: Metadata = { title: "Policy & MSMEs · CBAM India", description: "Article 9 simulator for India's carbon market, the downstream CBAM radar, and an MSME per-unit calculator." };

export default function Policy() {
  return <PolicyLab />;
}
