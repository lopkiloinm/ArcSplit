import type { Metadata } from "next";
import { DemoSection } from "@/components/DemoSection";

export const metadata: Metadata = {
  title: "ArcSplit — Calculator Pipeline",
  description: "Pay-per-operator calculator with x402 HTTP 402, Circle Gateway nanopayments, and ERC-8183 job escrow.",
};

export default function CalculatorPipelinePage() {
  return <DemoSection />;
}
