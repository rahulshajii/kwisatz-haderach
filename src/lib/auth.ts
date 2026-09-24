import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const AUTH_SECRET = process.env.AUTH_SECRET || "kwisatz-haderach-pragyan-2026-secret-key-32chars";
const ADMIN_COOKIE_NAME = "kh_admin_token";

export interface AdminPayload {
  id: string;
  username: string;
  role: "admin";
}

export function signAdminToken(payload: { id: string; username: string }): string {
  return jwt.sign({ ...payload, role: "admin" }, AUTH_SECRET, {
    expiresIn: "12h",
  });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as AdminPayload;
    if (decoded && decoded.role === "admin") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value) return cookie.value;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export function checkAdminAuth(req: NextRequest): AdminPayload | null {
  const token = getAdminTokenFromRequest(req);
  if (!token) return null;
  return verifyAdminToken(token);
}

export { ADMIN_COOKIE_NAME };
