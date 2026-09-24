import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkParticipantAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = checkParticipantAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: session.participantId },
      include: {
        quiz: {
          select: {
            id: true,
            name: true,
            eventName: true,
            college: true,
            department: true,
            status: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    const totalQuestions = await prisma.question.count({
      where: { quizId: participant.quizId },
    });

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        uniqueCode: participant.uniqueCode,
        status: participant.status,
        score: participant.score,
        rank: participant.rank,
        correctCount: participant.correctCount,
        wrongCount: participant.wrongCount,
        totalTimeMs: participant.totalTimeMs,
        failReason: participant.failReason,
        warningCount: participant.warningCount,
      },
      quiz: participant.quiz,
      totalQuestions,
    });
  } catch (error: any) {
    console.error("result error:", error);
    return NextResponse.json({ error: "Failed to load results." }, { status: 500 });
  }
}
