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

    return NextResponse.json({ success: true, settings: quiz });
  } catch (error: any) {
    console.error("get settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
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
      name,
      eventName,
      college,
      department,
      duration,
      antiCheatMode,
      tieBreakRule,
      warningThreshold,
      allowReconnect,
    } = body;

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(eventName && { eventName: String(eventName).trim() }),
        ...(college && { college: String(college).trim() }),
        ...(department && { department: String(department).trim() }),
        ...(duration && { duration: Math.max(60, Number(duration)) }),
        ...(antiCheatMode && {
          antiCheatMode: antiCheatMode === "WARNING" ? "WARNING" : "STRICT",
        }),
        ...(tieBreakRule && { tieBreakRule: String(tieBreakRule) }),
        ...(warningThreshold !== undefined && {
          warningThreshold: Math.max(1, Number(warningThreshold)),
        }),
        ...(allowReconnect !== undefined && {
          allowReconnect: Boolean(allowReconnect),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully.",
      settings: updated,
    });
  } catch (error: any) {
    console.error("update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
