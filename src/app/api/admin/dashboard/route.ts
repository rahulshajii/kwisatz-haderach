import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findFirst({
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not configured." }, { status: 404 });
    }

    const now = new Date();
    const disconnectThreshold = new Date(now.getTime() - 40000); // 40 seconds inactivity

    // Fetch participant counts
    const [
      totalParticipants,
      registeredCount,
      waitingCount,
      activeCount,
      completedCount,
      failedCount,
      terminatedCount,
      scoreAggregates,
      recentSessions,
    ] = await Promise.all([
      prisma.participant.count({ where: { quizId: quiz.id } }),
      prisma.participant.count({ where: { quizId: quiz.id, status: "REGISTERED" } }),
      prisma.participant.count({ where: { quizId: quiz.id, status: "WAITING" } }),
      prisma.participant.count({ where: { quizId: quiz.id, status: "ACTIVE" } }),
      prisma.participant.count({ where: { quizId: quiz.id, status: "COMPLETED" } }),
      prisma.participant.count({ where: { quizId: quiz.id, status: "FAILED" } }),
      prisma.participant.count({ where: { quizId: quiz.id, status: "TERMINATED" } }),
      prisma.participant.aggregate({
        where: {
          quizId: quiz.id,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        _avg: { score: true },
        _max: { score: true },
      }),
      prisma.quizSession.findMany({
        where: {
          participant: { quizId: quiz.id },
          sessionStatus: "ACTIVE",
          lastSeen: { lt: disconnectThreshold },
        },
        select: { participantId: true },
        distinct: ["participantId"],
      }),
    ]);

    const joinedCount = totalParticipants - registeredCount;
    const disconnectedCount = recentSessions.length;
    const effectiveActiveCount = Math.max(0, activeCount - disconnectedCount);

    return NextResponse.json({
      success: true,
      stats: {
        totalParticipants,
        joinedCount,
        registeredCount,
        waitingCount,
        activeCount: effectiveActiveCount,
        completedCount,
        failedCount: failedCount + terminatedCount,
        disconnectedCount,
        avgScore: Number(scoreAggregates._avg.score?.toFixed(1) || 0),
        highestScore: Number(scoreAggregates._max.score?.toFixed(1) || 0),
      },
      quiz: {
        id: quiz.id,
        name: quiz.name,
        eventName: quiz.eventName,
        college: quiz.college,
        department: quiz.department,
        status: quiz.status,
        duration: quiz.duration,
        antiCheatMode: quiz.antiCheatMode,
        tieBreakRule: quiz.tieBreakRule,
        warningThreshold: quiz.warningThreshold,
        allowReconnect: quiz.allowReconnect,
        startedAt: quiz.startedAt,
        endedAt: quiz.endedAt,
        questionCount: quiz._count.questions,
      },
    });
  } catch (error: any) {
    console.error("admin dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data." }, { status: 500 });
  }
}
