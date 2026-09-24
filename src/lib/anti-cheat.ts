import { prisma } from "./prisma";

export type AntiCheatEventType =
  | "PAGE_HIDDEN"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_EXIT"
  | "PAGE_EXIT"
  | "BACK_NAVIGATION"
  | "DUPLICATE_LOGIN_ATTEMPT"
  | "DEVICE_ORIENTATION_ANOMALY"
  | "DEVELOPER_TOOLS_ATTEMPT";

export interface LogEventParams {
  participantId: string;
  eventType: AntiCheatEventType | string;
  metadata?: Record<string, any>;
}

export interface AntiCheatResult {
  failed: boolean;
  warningCount: number;
  maxWarnings: number;
  message: string;
  shouldAlert: boolean;
}

/**
 * Evaluates an anti-cheating event against the quiz policy (STRICT vs WARNING)
 * and records the event in the activity log.
 */
export async function evaluateAndLogAntiCheatEvent(
  params: LogEventParams
): Promise<AntiCheatResult> {
  const { participantId, eventType, metadata } = params;

  // 1. Fetch participant and quiz settings
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      quiz: true,
    },
  });

  if (!participant) {
    return {
      failed: true,
      warningCount: 0,
      maxWarnings: 0,
      message: "Participant not found",
      shouldAlert: false,
    };
  }

  // If already failed or completed, just log and return
  if (participant.status === "FAILED" || participant.status === "COMPLETED" || participant.status === "TERMINATED") {
    await prisma.activityLog.create({
      data: {
        participantId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return {
      failed: participant.status === "FAILED" || participant.status === "TERMINATED",
      warningCount: participant.warningCount,
      maxWarnings: participant.quiz.warningThreshold,
      message: `Quiz session already ${participant.status.toLowerCase()}`,
      shouldAlert: false,
    };
  }

  // 2. Log the activity event to DB
  await prisma.activityLog.create({
    data: {
      participantId,
      eventType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Non-punitive lifecycle events like WINDOW_FOCUS don't trigger penalties
  const isSuspicious = [
    "PAGE_HIDDEN",
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "PAGE_EXIT",
    "BACK_NAVIGATION",
  ].includes(eventType);

  if (!isSuspicious) {
    return {
      failed: false,
      warningCount: participant.warningCount,
      maxWarnings: participant.quiz.warningThreshold,
      message: "Event recorded",
      shouldAlert: false,
    };
  }

  const mode = participant.quiz.antiCheatMode; // STRICT or WARNING
  const maxWarnings = participant.quiz.warningThreshold || 2;

  if (mode === "STRICT") {
    // STRICT MODE: Immediate termination
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failReason: `Strict anti-cheat violation: ${eventType.replace(/_/g, " ")} detected`,
      },
    });

    // Also invalidate any active sessions
    await prisma.quizSession.updateMany({
      where: { participantId },
      data: { sessionStatus: "TERMINATED" },
    });

    return {
      failed: true,
      warningCount: 1,
      maxWarnings: 1,
      message: `Prohibited activity detected (${eventType}). Session terminated.`,
      shouldAlert: true,
    };
  } else {
    // WARNING MODE
    const newWarningCount = participant.warningCount + 1;

    if (newWarningCount > maxWarnings) {
      // Exceeded warnings -> FAIL
      await prisma.participant.update({
        where: { id: participantId },
        data: {
          status: "FAILED",
          warningCount: newWarningCount,
          failedAt: new Date(),
          failReason: `Exceeded warning limit (${newWarningCount}/${maxWarnings}) with ${eventType}`,
        },
      });

      await prisma.quizSession.updateMany({
        where: { participantId },
        data: { sessionStatus: "TERMINATED" },
      });

      return {
        failed: true,
        warningCount: newWarningCount,
        maxWarnings,
        message: `Exceeded warning limit. Session terminated.`,
        shouldAlert: true,
      };
    } else {
      // Still within warning allowance
      await prisma.participant.update({
        where: { id: participantId },
        data: {
          warningCount: newWarningCount,
        },
      });

      return {
        failed: false,
        warningCount: newWarningCount,
        maxWarnings,
        message: `Warning ${newWarningCount} of ${maxWarnings}: Prohibited activity detected!`,
        shouldAlert: true,
      };
    }
  }
}
