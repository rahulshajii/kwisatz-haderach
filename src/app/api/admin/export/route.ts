import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

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

    const participants = await prisma.participant.findMany({
      where: { quizId: quiz.id },
      orderBy: [
        { score: "desc" },
        { correctCount: "desc" },
        { totalTimeMs: "asc" },
      ],
    });

    const rows = participants.map((p, index) => ({
      Rank: p.rank || (p.status === "COMPLETED" ? index + 1 : "N/A"),
      Name: p.name,
      "Participant Code": p.uniqueCode,
      Score: p.score,
      "Correct Answers": p.correctCount,
      "Incorrect Answers": p.wrongCount,
      "Total Answering Time (s)": (p.totalTimeMs / 1000).toFixed(2),
      Status: p.status,
      "Failure / Termination Reason": p.failReason || "",
      "Warnings Count": p.warningCount,
      "Joined At": p.joinedAt ? p.joinedAt.toISOString() : "",
      "Completed At": p.completedAt ? p.completedAt.toISOString() : "",
    }));

    const csv = Papa.unparse(rows);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kwisatz_haderach_pragyan2026_results_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("admin export error:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}
