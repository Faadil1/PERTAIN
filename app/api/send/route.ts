import { NextRequest, NextResponse } from "next/server";
import { executeAllowedSend } from "@/lib/orchestrator";
import type { EvaluationReceipt } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const receipt = (await request.json()) as EvaluationReceipt;
    if (!receipt?.runId || !receipt?.draft || !Array.isArray(receipt?.recipients)) {
      return NextResponse.json({ error: "Invalid evaluation receipt." }, { status: 400 });
    }

    const sendReceipt = await executeAllowedSend(receipt);
    return NextResponse.json(sendReceipt, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Send failed closed.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
