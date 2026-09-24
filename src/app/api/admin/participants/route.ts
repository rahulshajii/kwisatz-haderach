import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateParticipantCode, normalizeParticipantCode } from "@/lib/code-generator";

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
      include: {
        _count: {
          select: { answers: true },
        },
        sessions: {
          orderBy: { lastSeen: "desc" },
          take: 1,
          select: { lastSeen: true, sessionStatus: true },
        },
      },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
    });

    const now = new Date();
    const formatted = participants.map((p) => {
      const lastSession = p.sessions[0];
      const isOnline =
        lastSession &&
        now.getTime() - new Date(lastSession.lastSeen).getTime() < 40000;

      let displayStatus = p.status as string;
      if (p.status === "ACTIVE" && !isOnline) {
        displayStatus = "DISCONNECTED";
      }

      return {
        id: p.id,
        name: p.name,
        uniqueCode: p.uniqueCode,
        status: displayStatus,
        rawStatus: p.status,
        score: p.score,
        rank: p.rank,
        correctCount: p.correctCount,
        wrongCount: p.wrongCount,
        totalTimeMs: p.totalTimeMs,
        currentQuestion: p._count.answers + 1,
        answeredCount: p._count.answers,
        warningCount: p.warningCount,
        failReason: p.failReason,
        lastSeen: lastSession?.lastSeen || null,
        isOnline: Boolean(isOnline),
      };
    });

    return NextResponse.json({ success: true, participants: formatted });
  } catch (error: any) {
    console.error("admin participants error:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
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
    const { action, count = 5, names = [], singleName } = body;

    if (action === "generate_batch") {
      // Generate `count` random codes
      const numToGenerate = Math.min(Math.max(1, Number(count) || 5), 200);
      const created = [];

      for (let i = 0; i < numToGenerate; i++) {
        let code = generateParticipantCode();
        // ensure uniqueness
        let exists = await prisma.participant.findUnique({ where: { uniqueCode: code } });
        while (exists) {
          code = generateParticipantCode();
          exists = await prisma.participant.findUnique({ where: { uniqueCode: code } });
        }

        const p = await prisma.participant.create({
          data: {
            quizId: quiz.id,
            name: `Participant #${i + 1}`,
            uniqueCode: code,
            status: "REGISTERED",
          },
        });
        created.push(p);
      }

      return NextResponse.json({ success: true, count: created.length, participants: created });
    }

    if (action === "import_names") {
      // Import an array of participant names
      if (!Array.isArray(names) || names.length === 0) {
        return NextResponse.json({ error: "names array is required" }, { status: 400 });
      }

      const created = [];
      for (const name of names) {
        const cleanName = String(name).trim();
        if (!cleanName) continue;

        let code = generateParticipantCode();
        let exists = await prisma.participant.findUnique({ where: { uniqueCode: code } });
        while (exists) {
          code = generateParticipantCode();
          exists = await prisma.participant.findUnique({ where: { uniqueCode: code } });
        }

        const p = await prisma.participant.create({
          data: {
            quizId: quiz.id,
            name: cleanName,
            uniqueCode: code,
            status: "REGISTERED",
          },
        });
        created.push(p);
      }

      return NextResponse.json({ success: true, count: created.length, participants: created });
    }

    if (action === "create_single") {
      if (!singleName || !String(singleName).trim()) {
        return NextResponse.json({ error: "Participant name is required" }, { status: 400 });
      }

      let code = body.customCode ? normalizeParticipantCode(body.customCode) : generateParticipantCode();
      const existing = await prisma.participant.findUnique({ where: { uniqueCode: code } });
      if (existing) {
        return NextResponse.json({ error: `Code ${code} is already in use` }, { status: 400 });
      }

      const p = await prisma.participant.create({
        data: {
          quizId: quiz.id,
          name: String(singleName).trim(),
          uniqueCode: code,
          status: "REGISTERED",
        },
      });

      return NextResponse.json({ success: true, participant: p });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("admin participants post error:", error);
    return NextResponse.json({ error: "Failed to create participant(s)" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const quiz = await prisma.quiz.findFirst();
      if (quiz) {
        await prisma.participant.deleteMany({ where: { quizId: quiz.id } });
      }
      return NextResponse.json({ success: true, message: "All participants cleared." });
    }

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 });
    }

    await prisma.participant.delete({ where: { id: participantId } });
    return NextResponse.json({ success: true, message: "Participant deleted." });
  } catch (error: any) {
    console.error("admin delete participant error:", error);
    return NextResponse.json({ error: "Failed to delete participant" }, { status: 500 });
  }
}
