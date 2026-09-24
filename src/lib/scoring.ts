import { prisma } from "./prisma";

export interface ParticipantScoreRow {
  id: string;
  name: string;
  uniqueCode: string;
  status: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalTimeMs: number;
  rank: number | null;
  failReason?: string | null;
}

/**
 * Recomputes and persists ranking for all participants in a quiz.
 * Follows tie-breaking rules:
 * 1. Score (Higher is better)
 * 2. Correct Count (Higher is better)
 * 3. Total Answering Time in milliseconds (Lower is better)
 * 4. JoinedAt timestamp (Earlier is better)
 */
export async function recalculateQuizRankings(quizId: string) {
  const participants = await prisma.participant.findMany({
    where: {
      quizId,
      status: {
        in: ["COMPLETED", "ACTIVE", "WAITING", "DISCONNECTED", "FAILED", "TERMINATED"],
      },
    },
    orderBy: [
      { score: "desc" },
      { correctCount: "desc" },
      { totalTimeMs: "asc" },
      { joinedAt: "asc" },
    ],
  });

  // Eligible participants for rank: COMPLETED or ACTIVE (FAILED/TERMINATED get bottom ranks or null)
  let currentRank = 1;
  const rankUpdates: { id: string; rank: number | null }[] = [];

  for (const p of participants) {
    let assignedRank: number | null = null;
    if (p.status === "COMPLETED" || p.status === "ACTIVE" || p.status === "DISCONNECTED") {
      assignedRank = currentRank++;
    }

    if (p.rank !== assignedRank) {
      rankUpdates.push({ id: p.id, rank: assignedRank });
    }
  }

  if (rankUpdates.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const item of rankUpdates) {
        await tx.participant.update({
          where: { id: item.id },
          data: { rank: item.rank },
        });
      }
    });
  }

  return participants;
}
