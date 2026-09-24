import { NextRequest, NextResponse } from "next/server";
import { checkParticipantAuth } from "@/lib/session";
import { evaluateAndLogAntiCheatEvent } from "@/lib/anti-cheat";
import { recalculateQuizRankings } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const session = checkParticipantAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { eventType, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType is required." }, { status: 400 });
    }

    const result = await evaluateAndLogAntiCheatEvent({
      participantId: session.participantId,
      eventType,
      metadata,
    });

    if (result.failed) {
      recalculateQuizRankings(session.quizId).catch((err) =>
        console.error("Recalculate ranks on fail error:", err)
      );
    }

    return NextResponse.json({
      success: true,
      failed: result.failed,
      warningCount: result.warningCount,
      maxWarnings: result.maxWarnings,
      message: result.message,
      shouldAlert: result.shouldAlert,
    });
  } catch (error: any) {
    console.error("log-activity error:", error);
    return NextResponse.json({ error: "Failed to record activity." }, { status: 500 });
  }
}
