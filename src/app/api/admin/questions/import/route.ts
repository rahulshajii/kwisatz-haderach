import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { questions, replaceAll = false } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required." },
        { status: 400 }
      );
    }

    if (replaceAll) {
      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    }

    let startingNumber = replaceAll
      ? 1
      : (await prisma.question.count({ where: { quizId: quiz.id } })) + 1;

    const created = [];
    for (const q of questions) {
      if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer) {
        continue;
      }

      const item = await prisma.question.create({
        data: {
          quizId: quiz.id,
          questionNumber: startingNumber++,
          questionText: String(q.questionText).trim(),
          optionA: String(q.optionA).trim(),
          optionB: String(q.optionB).trim(),
          optionC: String(q.optionC).trim(),
          optionD: String(q.optionD).trim(),
          correctAnswer: String(q.correctAnswer).trim().toUpperCase(),
          marks: Number(q.marks) || 2.0,
          negativeMarks: Math.abs(Number(q.negativeMarks) || 0.5),
          timeLimit: Math.max(5, Number(q.timeLimit) || 30),
          explanation: q.explanation ? String(q.explanation).trim() : null,
        },
      });
      created.push(item);
    }

    return NextResponse.json({
      success: true,
      count: created.length,
      message: `Successfully imported ${created.length} questions.`,
    });
  } catch (error: any) {
    console.error("import questions error:", error);
    return NextResponse.json({ error: "Failed to import questions" }, { status: 500 });
  }
}
