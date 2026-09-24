import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateQuizRankings } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: "participantId is required" }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { quiz: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const nextStatus = participant.quiz.status === "RUNNING" ? "ACTIVE" : "WAITING";

    await prisma.$transaction([
      prisma.participant.update({
        where: { id: participantId },
        data: {
          status: nextStatus,
          failReason: null,
          failedAt: null,
          warningCount: 0,
        },
      }),
      prisma.quizSession.updateMany({
        where: { participantId },
        data: { sessionStatus: "ACTIVE" },
      }),
      prisma.activityLog.create({
        data: {
          participantId,
          eventType: "ADMIN_RECONNECT_ALLOWED",
          metadata: JSON.stringify({ admin: admin.username }),
        },
      }),
    ]);

    await recalculateQuizRankings(participant.quizId);

    return NextResponse.json({ success: true, message: "Participant session unlocked for reconnect." });
  } catch (error: any) {
    console.error("reconnect participant error:", error);
    return NextResponse.json({ error: "Failed to unlock participant" }, { status: 500 });
  }
}
