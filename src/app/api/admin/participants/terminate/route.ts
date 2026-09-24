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
    const { participantId, reason = "Terminated manually by administrator" } = body;

    if (!participantId) {
      return NextResponse.json({ error: "participantId is required" }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.participant.update({
        where: { id: participantId },
        data: {
          status: "TERMINATED",
          failedAt: new Date(),
          failReason: reason,
        },
      }),
      prisma.quizSession.updateMany({
        where: { participantId },
        data: { sessionStatus: "TERMINATED" },
      }),
      prisma.activityLog.create({
        data: {
          participantId,
          eventType: "ADMIN_TERMINATED",
          metadata: JSON.stringify({ admin: admin.username, reason }),
        },
      }),
    ]);

    await recalculateQuizRankings(participant.quizId);

    return NextResponse.json({ success: true, message: "Participant terminated." });
  } catch (error: any) {
    console.error("terminate participant error:", error);
    return NextResponse.json({ error: "Failed to terminate participant" }, { status: 500 });
  }
}
