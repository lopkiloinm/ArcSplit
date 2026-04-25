// POST /api/quote
// Parses expression, builds AST, counts operations, returns pricing quote.
// No payment required for quoting.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseExpression, countOperations, validateExpression } from "@/lib/parser";
import { UNIT_PRICE_USDC, OperationCounts } from "@/lib/types";

const QuoteRequestSchema = z.object({
  expression: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = QuoteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { expression } = parsed.data;

    // Validate before parsing
    const validation = validateExpression(expression);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "invalid_expression", message: validation.error },
        { status: 400 }
      );
    }

    // Parse into AST
    let ast;
    try {
      ast = parseExpression(expression);
    } catch (e) {
      return NextResponse.json(
        { error: "parse_error", message: (e as Error).message },
        { status: 400 }
      );
    }

    // Count operations
    const rawCounts = countOperations(ast);
    const operationCounts: OperationCounts = {
      add: rawCounts.add,
      subtract: rawCounts.subtract,
      multiply: rawCounts.multiply,
      divide: rawCounts.divide,
    };

    const totalOperations =
      operationCounts.add +
      operationCounts.subtract +
      operationCounts.multiply +
      operationCounts.divide;

    const unitPrice = parseFloat(UNIT_PRICE_USDC);
    const maxCost = (totalOperations * unitPrice).toFixed(6);

    return NextResponse.json({
      jobTemplate: "calc-basic-v1",
      expression,
      ast,
      operationCounts,
      totalOperations,
      unitPriceUSDC: UNIT_PRICE_USDC,
      maxCostUSDC: maxCost,
      operatorPricing: {
        add: UNIT_PRICE_USDC,
        subtract: UNIT_PRICE_USDC,
        multiply: UNIT_PRICE_USDC,
        divide: UNIT_PRICE_USDC,
      },
    });
  } catch (err) {
    console.error("[/api/quote]", err);
    return NextResponse.json(
      { error: "internal_error", message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
