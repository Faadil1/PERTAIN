import { NextResponse } from "next/server";
import { evaluateMessage, executeAllowedSend } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Never trust a browser-provided allow-list. Re-evaluate server-side immediately
    // before planning the bounded side effect.
    const freshReceipt = await evaluateMessage();

    // External proof is already complete. Public deployments fail closed unless an
    // operator explicitly enables consequential Gmail writes on the server.
    // Seeded demo mode may still execute its clearly-labelled simulated side effect.
    if (freshReceipt.mode === "external" && process.env.PERTAIN_EXTERNAL_SEND_ENABLED !== "1") {
      return NextResponse.json(
        {
          error: "External send disabled.",
          detail: "This deployment is read-only for external side effects. Evaluation remains available.",
          policyRunId: freshReceipt.runId,
          allowedEmails: freshReceipt.allowedEmails,
        },
        { status: 403 },
      );
    }

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
