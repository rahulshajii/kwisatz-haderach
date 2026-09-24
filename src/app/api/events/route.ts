import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const searchParams = req.nextUrl.searchParams;
  const quizId = searchParams.get("quizId");

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const sendEvent = (event: string, data: any) => {
        if (isClosed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          isClosed = true;
        }
      };

      // Send initial connection ACK
      sendEvent("connected", {
        timestamp: new Date().toISOString(),
        message: "Connected to KWISATZ HADERACH real-time stream",
      });

      let lastStatus = "";

      // Check quiz state every 1.5 seconds
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          let quiz;
          if (quizId) {
            quiz = await prisma.quiz.findUnique({
              where: { id: quizId },
              select: { id: true, status: true, startedAt: true, endedAt: true },
            });
          } else {
            quiz = await prisma.quiz.findFirst({
              select: { id: true, status: true, startedAt: true, endedAt: true },
            });
          }

          if (quiz && quiz.status !== lastStatus) {
            lastStatus = quiz.status;
            sendEvent("quiz_status", {
              quizId: quiz.id,
              status: quiz.status,
              startedAt: quiz.startedAt,
              endedAt: quiz.endedAt,
              serverTime: new Date().toISOString(),
            });
          } else {
            // Heartbeat comment
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          }
        } catch (e) {
          // If connection severed, stop interval
          clearInterval(interval);
        }
      }, 1500);

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
