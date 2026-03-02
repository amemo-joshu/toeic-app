import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id || token.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      streak: true,
      targetScore: true,
      createdAt: true,
      _count: { select: { answers: true, studySessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
