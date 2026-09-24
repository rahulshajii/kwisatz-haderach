import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = checkAdminAuth(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminRecord = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { id: true, username: true, createdAt: true },
  });

  if (!adminRecord) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, admin: adminRecord });
}
