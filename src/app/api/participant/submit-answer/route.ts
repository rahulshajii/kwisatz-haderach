import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkParticipantAuth } from "@/lib/session";
import { recalculateQuizRankings } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  try {
    const session = checkParticipantAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { questionId, selectedAnswer, timeTakenMs = 0 } = body;

    if (!questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: "questionId and selectedAnswer are required." },
        { status: 400 }
      );
    }

    const validAnswers = ["A", "B", "C", "D", "TIMEOUT"];
    if (!validAnswers.includes(selectedAnswer)) {
      return NextResponse.json({ error: "Invalid selected answer." }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { id: session.participantId },
      include: {
        quiz: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    if (participant.status === "FAILED" || participant.status === "TERMINATED") {
      return NextResponse.json(
        { error: "Quiz session has been terminated.", status: "FAILED" },
        { status: 403 }
      );
    }

    if (participant.quiz.status !== "RUNNING") {
      return NextResponse.json(
        { error: "Quiz is currently not running.", status: participant.quiz.status },
        { status: 403 }
      );
    }

    // Verify question belongs to this quiz
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question || question.quizId !== participant.quizId) {
      return NextResponse.json(
        { error: "Question does not belong to this quiz." },
        { status: 400 }
      );
    }

    // Check for double submission
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        participantId_questionId: {
          participantId: participant.id,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      // Ignore duplicate request and return success to avoid client race error
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        message: "Answer already recorded.",
      });
    }

    // Server-side correctness calculation
    const isCorrect = question.correctAnswer.toUpperCase() === selectedAnswer.toUpperCase();
    let marksAwarded = 0;
    if (isCorrect) {
      marksAwarded = question.marks;
    } else if (selectedAnswer !== "TIMEOUT") {
      marksAwarded = -Math.abs(question.negativeMarks || 0);
    }

    const safeTimeTaken = Math.max(0, Math.min(Number(timeTakenMs) || 0, question.timeLimit * 1000 + 5000));

    // Execute atomic update
    await prisma.$transaction(async (tx) => {
      // 1. Create Answer record
      await tx.answer.create({
        data: {
          participantId: participant.id,
          questionId: question.id,
          selectedAnswer,
          isCorrect,
          marksAwarded,
          timeTakenMs: safeTimeTaken,
        },
      });

      // 2. Update Participant aggregates
      await tx.participant.update({
        where: { id: participant.id },
        data: {
          score: { increment: marksAwarded },
          correctCount: { increment: isCorrect ? 1 : 0 },
          wrongCount: { increment: !isCorrect && selectedAnswer !== "TIMEOUT" ? 1 : 0 },
          totalTimeMs: { increment: safeTimeTaken },
        },
      });

      // 3. Log event
      await tx.activityLog.create({
        data: {
          participantId: participant.id,
          eventType: "ANSWER_SUBMITTED",
          metadata: JSON.stringify({
            questionNumber: question.questionNumber,
            timeTakenMs: safeTimeTaken,
            isTimeout: selectedAnswer === "TIMEOUT",
          }),
        },
      });
    });

    // Check if that was the last question
    const totalQuestions = await prisma.question.count({
      where: { quizId: participant.quizId },
    });
    const totalAnswered = await prisma.answer.count({
      where: { participantId: participant.id },
    });

    const isFinished = totalAnswered >= totalQuestions;

    if (isFinished) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Recalculate ranks in background
      recalculateQuizRankings(participant.quizId).catch((err) =>
        console.error("Recalculate ranks error:", err)
      );
    }

    return NextResponse.json({
      success: true,
      isFinished,
      answeredCount: totalAnswered,
      totalQuestions,
    });
  } catch (error: any) {
    console.error("submit-answer error:", error);
    return NextResponse.json(
      { error: "Failed to submit answer. Please try again." },
      { status: 500 }
    );
  }
}
