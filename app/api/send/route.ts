import { NextResponse } from "next/server";
import { evaluateMessage, executeAllowedSend } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Never trust a browser-provided allow-list. Re-evaluate server-side immediately
    // before planning the bounded side effect.
    const freshReceipt = await evaluateMessage();
    const sendReceipt = await executeAllowedSend(freshReceipt);
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
