import type { Metadata } from "next";
import { FoodPipelineSection } from "@/components/food/FoodPipelineSection";

export const metadata: Metadata = {
  title: "ArcSplit — Media Pipeline",
  description: "Pay-per-service media verification pipeline using Gemini Embedding 2 with x402 HTTP 402, ERC-8183 job escrow, and Circle Gateway nanopayments.",
};

export default function FoodVerifyPipelinePage() {
  return <FoodPipelineSection />;
}
