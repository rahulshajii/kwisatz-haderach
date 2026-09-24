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
    const { firstPrizeId, secondPrizeId } = body;

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        firstPrizeParticipantId: firstPrizeId || null,
        secondPrizeParticipantId: secondPrizeId || null,
      },
    });

    const [firstPrize, secondPrize] = await Promise.all([
      firstPrizeId ? prisma.participant.findUnique({ where: { id: firstPrizeId } }) : null,
      secondPrizeId ? prisma.participant.findUnique({ where: { id: secondPrizeId } }) : null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Winners officially confirmed.",
      winners: {
        firstPrize,
        secondPrize,
      },
    });
  } catch (error: any) {
    console.error("confirm winner error:", error);
    return NextResponse.json({ error: "Failed to confirm winners" }, { status: 500 });
  }
}
