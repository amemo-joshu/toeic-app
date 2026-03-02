import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const users = await prisma.user.findMany({ select: { id: true, name: true, streak: true } });
  const ranking = [];
  for (const u of users) {
    const answers = await prisma.userAnswer.aggregate({ where: { userId: u.id }, _count: { id: true } });
    const correct = await prisma.userAnswer.aggregate({ where: { userId: u.id, isCorrect: true }, _count: { id: true } });
    const total = answers._count.id;
    const correctCount = correct._count.id;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    ranking.push({ id: u.id, name: u.name || "匿名", streak: u.streak, total, accuracy,
      estimatedScore: Math.min(990, Math.round(300 + accuracy * 6.9)) });
  }
  ranking.sort((a, b) => b.estimatedScore - a.estimatedScore);
  return NextResponse.json(ranking);
}
