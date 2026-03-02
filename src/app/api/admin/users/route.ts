import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, streak: true, targetScore: true, createdAt: true,
      _count: { select: { answers: true, studySessions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}
