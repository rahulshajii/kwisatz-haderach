import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkParticipantAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = checkParticipantAuth(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized session." },
        { status: 401 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: session.participantId },
      include: {
        quiz: {
          select: {
            id: true,
            name: true,
            status: true,
            duration: true,
            startedAt: true,
            endedAt: true,
            antiCheatMode: true,
            warningThreshold: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 }
      );
    }

    // Update heartbeat on session
    const now = new Date();
    await prisma.quizSession.updateMany({
      where: {
        participantId: participant.id,
        sessionStatus: "ACTIVE",
      },
      data: {
        lastSeen: now,
      },
    });

    // Check if quiz transitioned to RUNNING and participant was WAITING
    let currentStatus = participant.status;
    if (participant.status === "WAITING" && participant.quiz.status === "RUNNING") {
      currentStatus = "ACTIVE";
      await prisma.participant.update({
        where: { id: participant.id },
        data: { status: "ACTIVE", startedAt: now },
      });
    }

    // Get current answered count
    const answeredCount = await prisma.answer.count({
      where: { participantId: participant.id },
    });

    const totalQuestions = await prisma.question.count({
      where: { quizId: participant.quizId },
    });

    return NextResponse.json({
      success: true,
      quizStatus: participant.quiz.status,
      participantStatus: currentStatus,
      warningCount: participant.warningCount,
      warningThreshold: participant.quiz.warningThreshold,
      antiCheatMode: participant.quiz.antiCheatMode,
      failReason: participant.failReason,
      answeredCount,
      totalQuestions,
      currentQuestionNumber: answeredCount + 1,
      quizStartedAt: participant.quiz.startedAt,
      serverTime: now.toISOString(),
    });
  } catch (error: any) {
    console.error("participant status error:", error);
    return NextResponse.json(
      { error: "Error checking status." },
      { status: 500 }
    );
  }
}
