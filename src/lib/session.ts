import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const AUTH_SECRET = process.env.AUTH_SECRET || "kwisatz-haderach-pragyan-2026-secret-key-32chars";
const PARTICIPANT_COOKIE_NAME = "kh_participant_token";

export interface ParticipantPayload {
  participantId: string;
  uniqueCode: string;
  quizId: string;
  sessionId: string;
}

export function signParticipantToken(payload: ParticipantPayload): string {
  return jwt.sign(payload, AUTH_SECRET, {
    expiresIn: "6h",
  });
}

export function verifyParticipantToken(token: string): ParticipantPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as ParticipantPayload;
    if (decoded && decoded.participantId && decoded.uniqueCode) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getParticipantSession(): Promise<ParticipantPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARTICIPANT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyParticipantToken(token);
}

export function getParticipantTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get(PARTICIPANT_COOKIE_NAME);
  if (cookie?.value) return cookie.value;

  const header = req.headers.get("x-participant-token");
  if (header) return header;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export function checkParticipantAuth(req: NextRequest): ParticipantPayload | null {
  const token = getParticipantTokenFromRequest(req);
  if (!token) return null;
  return verifyParticipantToken(token);
}

export { PARTICIPANT_COOKIE_NAME };
