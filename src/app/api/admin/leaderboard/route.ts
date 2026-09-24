import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateQuizRankings } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Refresh ranks
    await recalculateQuizRankings(quiz.id);

    const participants = await prisma.participant.findMany({
      where: { quizId: quiz.id },
      orderBy: [
        { score: "desc" },
        { correctCount: "desc" },
        { totalTimeMs: "asc" },
        { joinedAt: "asc" },
      ],
      select: {
        id: true,
        name: true,
        uniqueCode: true,
        status: true,
        score: true,
        rank: true,
        correctCount: true,
        wrongCount: true,
        totalTimeMs: true,
        warningCount: true,
        failReason: true,
        completedAt: true,
      },
    });

    // Candidates for 1st & 2nd prize: must be COMPLETED or ACTIVE without failure
    const eligibleWinners = participants.filter(
      (p) => p.status === "COMPLETED" || p.status === "ACTIVE"
    );

    const firstPrizeCandidate = eligibleWinners[0] || null;
    const secondPrizeCandidate = eligibleWinners[1] || null;

    let confirmedFirstPrize = null;
    let confirmedSecondPrize = null;

    if (quiz.firstPrizeParticipantId) {
      confirmedFirstPrize = participants.find((p) => p.id === quiz.firstPrizeParticipantId) || null;
    }
    if (quiz.secondPrizeParticipantId) {
      confirmedSecondPrize = participants.find((p) => p.id === quiz.secondPrizeParticipantId) || null;
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        status: quiz.status,
        tieBreakRule: quiz.tieBreakRule,
        firstPrizeParticipantId: quiz.firstPrizeParticipantId,
        secondPrizeParticipantId: quiz.secondPrizeParticipantId,
      },
      leaderboard: participants,
      candidates: {
        firstPrize: firstPrizeCandidate,
        secondPrize: secondPrizeCandidate,
      },
      confirmedWinners: {
        firstPrize: confirmedFirstPrize,
        secondPrize: confirmedSecondPrize,
      },
    });
  } catch (error: any) {
    console.error("admin leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
