import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeParticipantCode } from "@/lib/code-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = body.code;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        { error: "Participant code is required." },
        { status: 400 }
      );
    }

    const code = normalizeParticipantCode(rawCode);

    const participant = await prisma.participant.findUnique({
      where: { uniqueCode: code },
      include: {
        quiz: {
          select: {
            id: true,
            name: true,
            eventName: true,
            college: true,
            department: true,
            status: true,
            duration: true,
            antiCheatMode: true,
            allowReconnect: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Invalid or expired code. Please verify your code." },
        { status: 404 }
      );
    }

    // Check status
    if (participant.status === "FAILED" || participant.status === "TERMINATED") {
      return NextResponse.json(
        {
          error: "This quiz session has been terminated due to anti-cheating policy violation.",
          status: "FAILED",
        },
        { status: 403 }
      );
    }

    if (participant.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "This participant code has already completed the quiz.",
          status: "COMPLETED",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        name: participant.name,
        uniqueCode: participant.uniqueCode,
        status: participant.status,
      },
      quiz: participant.quiz,
    });
  } catch (error: any) {
    console.error("verify-code error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
