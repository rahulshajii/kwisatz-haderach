import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const admin = checkAdminAuth(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");
    const eventType = searchParams.get("eventType");
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit")) || 50));

    const logs = await prisma.activityLog.findMany({
      where: {
        ...(participantId && { participantId }),
        ...(eventType && { eventType }),
      },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            uniqueCode: true,
            status: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("admin activity error:", error);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
