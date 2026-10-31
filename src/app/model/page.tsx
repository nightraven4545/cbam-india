import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = { title: "Scenario model", description: "Interactive CBAM model for Indian steel, aluminium and cement producers." };

export default function Model() {
  return <Dashboard />;
}
