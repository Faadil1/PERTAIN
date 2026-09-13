import { NextRequest, NextResponse } from "next/server";
import { evaluateMessage } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    const receipt = await evaluateMessage();
    return NextResponse.json(receipt, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Evaluation failed closed.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
