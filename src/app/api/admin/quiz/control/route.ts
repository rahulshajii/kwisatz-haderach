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
    const { action, confirm } = body;

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const now = new Date();

    if (action === "START_QUIZ") {
      await prisma.$transaction([
        prisma.quiz.update({
          where: { id: quiz.id },
          data: {
            status: "RUNNING",
            startedAt: now,
          },
        }),
        // Transition all WAITING participants to ACTIVE
        prisma.participant.updateMany({
          where: {
            quizId: quiz.id,
            status: { in: ["WAITING", "REGISTERED"] },
          },
          data: {
            status: "ACTIVE",
            startedAt: now,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Quiz started successfully! Participants are now active.",
        status: "RUNNING",
      });
    }

    if (action === "PAUSE_QUIZ") {
      await prisma.quiz.update({
        where: { id: quiz.id },
        data: { status: "PAUSED" },
      });

      return NextResponse.json({
        success: true,
        message: "Quiz paused.",
        status: "PAUSED",
      });
    }

    if (action === "RESUME_QUIZ") {
      await prisma.quiz.update({
        where: { id: quiz.id },
        data: { status: "RUNNING" },
      });

      return NextResponse.json({
        success: true,
        message: "Quiz resumed.",
        status: "RUNNING",
      });
    }

    if (action === "END_QUIZ") {
      await prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          status: "FINISHED",
          endedAt: now,
        },
      });

      // Mark all remaining ACTIVE participants as COMPLETED
      await prisma.participant.updateMany({
        where: {
          quizId: quiz.id,
          status: "ACTIVE",
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      await recalculateQuizRankings(quiz.id);

      return NextResponse.json({
        success: true,
        message: "Quiz ended and final rankings calculated.",
        status: "FINISHED",
      });
    }

    if (action === "RESET_QUIZ") {
      if (!confirm) {
        return NextResponse.json(
          { error: "Confirmation required to reset quiz." },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        // Clear answers
        prisma.answer.deleteMany({
          where: { participant: { quizId: quiz.id } },
        }),
        // Clear activity logs
        prisma.activityLog.deleteMany({
          where: { participant: { quizId: quiz.id } },
        }),
        // Clear sessions
        prisma.quizSession.deleteMany({
          where: { participant: { quizId: quiz.id } },
        }),
        // Reset participants
        prisma.participant.updateMany({
          where: { quizId: quiz.id },
          data: {
            status: "REGISTERED",
            score: 0,
            rank: null,
            correctCount: 0,
            wrongCount: 0,
            totalTimeMs: 0,
            warningCount: 0,
            failReason: null,
            joinedAt: null,
            startedAt: null,
            completedAt: null,
            failedAt: null,
          },
        }),
        // Reset quiz
        prisma.quiz.update({
          where: { id: quiz.id },
          data: {
            status: "WAITING",
            startedAt: null,
            endedAt: null,
            firstPrizeParticipantId: null,
            secondPrizeParticipantId: null,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Quiz completely reset to initial waiting state.",
        status: "WAITING",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("quiz control error:", error);
    return NextResponse.json({ error: "Failed to update quiz state." }, { status: 500 });
  }
}
