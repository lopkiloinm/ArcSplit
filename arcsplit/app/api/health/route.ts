import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ArcSplit API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    protocols: ["x402", "circle-nanopayments", "erc-8183"],
  });
}
