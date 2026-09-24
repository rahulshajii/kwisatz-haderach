import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeParticipantCode } from "@/lib/code-generator";
import { signParticipantToken, PARTICIPANT_COOKIE_NAME } from "@/lib/session";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = body.code;
    const deviceInfo = body.deviceInfo || {};

    if (!rawCode) {
      return NextResponse.json(
        { error: "Participant code is required." },
        { status: 400 }
      );
    }

    const code = normalizeParticipantCode(rawCode);

    const participant = await prisma.participant.findUnique({
      where: { uniqueCode: code },
      include: {
        quiz: true,
        sessions: {
          where: { sessionStatus: "ACTIVE" },
          orderBy: { lastSeen: "desc" },
          take: 1,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 404 }
      );
    }

    if (participant.status === "FAILED" || participant.status === "TERMINATED") {
      return NextResponse.json(
        {
          error: "This quiz session has been terminated.",
          status: "FAILED",
        },
        { status: 403 }
      );
    }

    if (participant.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "You have already completed this quiz.",
          status: "COMPLETED",
        },
        { status: 403 }
      );
    }

    // Check multiple device login (Section 36)
    const existingActiveSession = participant.sessions[0];
    const now = new Date();
    const isRecentlyActive =
      existingActiveSession &&
      now.getTime() - new Date(existingActiveSession.lastSeen).getTime() < 30000; // active within 30s

    if (isRecentlyActive && !participant.quiz.allowReconnect) {
      return NextResponse.json(
        {
          error: "This participant is already active on another device.",
          status: "DEVICE_CONFLICT",
        },
        { status: 409 }
      );
    }

    // Terminate existing sessions if reconnecting
    if (participant.sessions.length > 0) {
      await prisma.quizSession.updateMany({
        where: { participantId: participant.id, sessionStatus: "ACTIVE" },
        data: { sessionStatus: "RECONNECTED", disconnectedAt: now },
      });
    }

    // Create new session token
    const sessionToken = crypto.randomBytes(24).toString("hex");
    const newSession = await prisma.quizSession.create({
      data: {
        participantId: participant.id,
        sessionToken,
        sessionStatus: "ACTIVE",
        currentQuestion: 1,
        lastSeen: now,
      },
    });

    // Update participant status
    let nextStatus = participant.status;
    if (participant.status === "REGISTERED") {
      nextStatus = participant.quiz.status === "RUNNING" ? "ACTIVE" : "WAITING";
    } else if (participant.status === "DISCONNECTED") {
      nextStatus = participant.quiz.status === "RUNNING" ? "ACTIVE" : "WAITING";
    }

    const updatedParticipant = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        status: nextStatus,
        joinedAt: participant.joinedAt || now,
        startedAt:
          participant.startedAt ||
          (participant.quiz.status === "RUNNING" ? now : null),
      },
    });

    // Log join event
    await prisma.activityLog.create({
      data: {
        participantId: participant.id,
        eventType: "SESSION_ESTABLISHED",
        metadata: JSON.stringify({
          userAgent: req.headers.get("user-agent") || "unknown",
          deviceInfo,
        }),
      },
    });

    // Sign JWT token
    const token = signParticipantToken({
      participantId: participant.id,
      uniqueCode: participant.uniqueCode,
      quizId: participant.quizId,
      sessionId: newSession.id,
    });

    const response = NextResponse.json({
      success: true,
      token,
      participant: {
        id: updatedParticipant.id,
        name: updatedParticipant.name,
        uniqueCode: updatedParticipant.uniqueCode,
        status: updatedParticipant.status,
      },
      quiz: {
        id: participant.quiz.id,
        name: participant.quiz.name,
        eventName: participant.quiz.eventName,
        college: participant.quiz.college,
        department: participant.quiz.department,
        status: participant.quiz.status,
        duration: participant.quiz.duration,
        antiCheatMode: participant.quiz.antiCheatMode,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set(PARTICIPANT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 6, // 6 hours
    });

    return response;
  } catch (error: any) {
    console.error("start-session error:", error);
    return NextResponse.json(
      { error: "Could not initialize session. Please try again." },
      { status: 500 }
    );
  }
}
