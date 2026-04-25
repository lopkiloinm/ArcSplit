import type { Metadata } from "next";
import { FoodPipelineSection } from "@/components/food/FoodPipelineSection";

export const metadata: Metadata = {
  title: "ArcSplit — Food Verification Pipeline",
  description: "Pay-per-verification food consumption pipeline with gemini-embedding-2 RAG, x402 HTTP 402, and ERC-8183 job escrow.",
};

export default function FoodVerifyPipelinePage() {
  return (
    <main>
      <FoodPipelineSection />
    </main>
  );
}
