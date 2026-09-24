import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkParticipantAuth } from "@/lib/session";
import { recalculateQuizRankings } from "@/lib/scoring";

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
        quiz: true,
        answers: {
          select: { questionId: true },
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    if (participant.status === "FAILED" || participant.status === "TERMINATED") {
      return NextResponse.json(
        { error: "Quiz session has been terminated.", status: "FAILED", failReason: participant.failReason },
        { status: 403 }
      );
    }

    if (participant.quiz.status !== "RUNNING") {
      return NextResponse.json({
        quizStatus: participant.quiz.status,
        participantStatus: participant.status,
        message: "Quiz is currently not active.",
      });
    }

    // Get answered question IDs
    const answeredQuestionIds = new Set(participant.answers.map((a) => a.questionId));

    // Get all questions for quiz ordered by questionNumber
    const allQuestions = await prisma.question.findMany({
      where: { quizId: participant.quizId },
      orderBy: { questionNumber: "asc" },
      select: {
        id: true,
        questionNumber: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        marks: true,
        negativeMarks: true,
        timeLimit: true,
        // STRICTLY DO NOT EXPOSE correctAnswer OR explanation
      },
    });

    const totalQuestions = allQuestions.length;

    // Find first unanswered question
    const nextQuestion = allQuestions.find((q) => !answeredQuestionIds.has(q.id));

    if (!nextQuestion) {
      // All questions answered -> mark COMPLETED
      if (participant.status !== "COMPLETED") {
        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        await recalculateQuizRankings(participant.quizId);
      }

      return NextResponse.json({
        completed: true,
        participantStatus: "COMPLETED",
        totalQuestions,
        answeredCount: totalQuestions,
      });
    }

    return NextResponse.json({
      completed: false,
      participantStatus: participant.status,
      question: nextQuestion,
      currentQuestionIndex: answeredQuestionIds.size + 1,
      totalQuestions,
      answeredCount: answeredQuestionIds.size,
      quizDuration: participant.quiz.duration,
      quizStartedAt: participant.quiz.startedAt,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("quiz-data error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz data." }, { status: 500 });
  }
}
