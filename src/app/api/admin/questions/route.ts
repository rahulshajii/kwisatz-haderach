import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const questions = await prisma.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { questionNumber: "asc" },
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error("get questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findFirst();
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      marks = 2.0,
      negativeMarks = 0.5,
      timeLimit = 30,
      explanation = "",
    } = body;

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json(
        { error: "Question text, all 4 options, and correct answer are required." },
        { status: 400 }
      );
    }

    const count = await prisma.question.count({ where: { quizId: quiz.id } });
    const questionNumber = count + 1;

    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        questionNumber,
        questionText: String(questionText).trim(),
        optionA: String(optionA).trim(),
        optionB: String(optionB).trim(),
        optionC: String(optionC).trim(),
        optionD: String(optionD).trim(),
        correctAnswer: String(correctAnswer).trim().toUpperCase(),
        marks: Number(marks) || 1.0,
        negativeMarks: Math.abs(Number(negativeMarks) || 0),
        timeLimit: Math.max(5, Number(timeLimit) || 30),
        explanation: explanation ? String(explanation).trim() : null,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    console.error("add question error:", error);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(data.questionText && { questionText: String(data.questionText).trim() }),
        ...(data.optionA && { optionA: String(data.optionA).trim() }),
        ...(data.optionB && { optionB: String(data.optionB).trim() }),
        ...(data.optionC && { optionC: String(data.optionC).trim() }),
        ...(data.optionD && { optionD: String(data.optionD).trim() }),
        ...(data.correctAnswer && { correctAnswer: String(data.correctAnswer).trim().toUpperCase() }),
        ...(data.marks !== undefined && { marks: Number(data.marks) }),
        ...(data.negativeMarks !== undefined && { negativeMarks: Math.abs(Number(data.negativeMarks)) }),
        ...(data.timeLimit !== undefined && { timeLimit: Math.max(5, Number(data.timeLimit)) }),
        ...(data.explanation !== undefined && { explanation: String(data.explanation).trim() }),
      },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    console.error("update question error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    await prisma.question.delete({ where: { id } });

    // Renumber remaining questions
    const quiz = await prisma.quiz.findFirst();
    if (quiz) {
      const remaining = await prisma.question.findMany({
        where: { quizId: quiz.id },
        orderBy: { questionNumber: "asc" },
      });
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].questionNumber !== i + 1) {
          await prisma.question.update({
            where: { id: remaining[i].id },
            data: { questionNumber: i + 1 },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Question deleted and re-indexed." });
  } catch (error: any) {
    console.error("delete question error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
