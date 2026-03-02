import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, streak: true },
  });

  const ranking = [];
  for (const user of users) {
    const answers = await prisma.userAnswer.aggregate({
      where: { userId: user.id },
      _count: { id: true },
    });
    const correct = await prisma.userAnswer.aggregate({
      where: { userId: user.id, isCorrect: true },
      _count: { id: true },
    });
    const total = answers._count.id;
    const correctCount = correct._count.id;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const estimatedScore = Math.min(990, Math.round(300 + accuracy * 6.9));

    ranking.push({
      id: user.id,
      name: user.name || "匿名",
      streak: user.streak,
      total,
      accuracy,
      estimatedScore,
    });
  }

  ranking.sort((a, b) => b.estimatedScore - a.estimatedScore);
  return NextResponse.json(ranking);
}
