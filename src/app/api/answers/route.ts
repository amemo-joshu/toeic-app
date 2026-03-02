import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

const PART_WEIGHTS: Record<number, number> = {
  1: 30, 2: 124, 3: 193, 4: 148, 5: 149, 6: 79, 7: 267,
};
const ALL_PARTS = [1, 2, 3, 4, 5, 6, 7];

function calcEstimatedScore(
  partMap: Record<number, { total: number; correct: number }>,
  totalAnswers: number,
  vocabStudied: number
): number | null {
  const allDone = ALL_PARTS.every((p) => (partMap[p]?.total ?? 0) > 0);
  if (!allDone) return null;
  let weightedScore = 0;
  for (const p of ALL_PARTS) {
    const ps = partMap[p];
    const accuracy = ps && ps.total > 0 ? ps.correct / ps.total : 0;
    weightedScore += accuracy * PART_WEIGHTS[p];
  }
  const volumeBonus = Math.min(100, totalAnswers * 0.5);
  const vocabBonus = Math.min(50, vocabStudied * 0.1);
  return Math.min(990, Math.max(10, Math.round(weightedScore + volumeBonus + vocabBonus)));
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

    const body = await req.json();
    const { questionId, selectedAnswer, isCorrect, part, totalQuestions, correctCount, duration } = body;
    if (!questionId) return NextResponse.json({ error: "questionIdが必要です" }, { status: 400 });

    await prisma.userAnswer.create({
      data: { userId: user.id, questionId, selectedAnswer, isCorrect: Boolean(isCorrect) },
    });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const lastStudied = dbUser.lastStudiedAt ? new Date(dbUser.lastStudiedAt) : null;
      if (lastStudied) lastStudied.setHours(0, 0, 0, 0);
      let newStreak = dbUser.streak;
      if (!lastStudied || lastStudied.getTime() < today.getTime()) {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        newStreak = lastStudied?.getTime() === yesterday.getTime() ? dbUser.streak + 1 : 1;
        await prisma.user.update({ where: { id: user.id }, data: { streak: newStreak, lastStudiedAt: new Date() } });
      }
    }

    if (part && totalQuestions && correctCount !== undefined && duration !== undefined) {
      await prisma.studySession.create({
        data: { userId: user.id, part, totalQuestions, correctCount, duration },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/answers error:", error);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

    const stats = await prisma.userAnswer.groupBy({
      by: ["isCorrect"],
      where: { userId: user.id },
      _count: true,
    });
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { streak: true, targetScore: true, lastStudiedAt: true },
    });
    const partAnswers = await prisma.userAnswer.findMany({
      where: { userId: user.id },
      include: { question: { select: { part: true } } },
    });
    const partMap: Record<number, { total: number; correct: number }> = {};
    for (const a of partAnswers) {
      const p = a.question.part;
      if (!partMap[p]) partMap[p] = { total: 0, correct: 0 };
      partMap[p].total++;
      if (a.isCorrect) partMap[p].correct++;
    }
    const vocabStudied = await prisma.userVocabulary.count({ where: { userId: user.id } });
    const totalAnswers = stats.reduce((acc, s) => acc + s._count, 0);
    const estimatedScore = calcEstimatedScore(partMap, totalAnswers, vocabStudied);

    return NextResponse.json({ stats, sessions, user: dbUser, partStats: partMap, estimatedScore });
  } catch (error) {
    console.error("GET /api/answers error:", error);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
