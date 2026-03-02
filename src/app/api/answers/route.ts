import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// TOEIC配点に近い重み（Listening 495点 / Reading 495点）
const PART_WEIGHTS: Record<number, number> = {
  1: 30,   // Part1: 6問 × Listening
  2: 124,  // Part2: 25問
  3: 193,  // Part3: 39問
  4: 148,  // Part4: 30問
  5: 149,  // Part5: 30問 × Reading
  6: 79,   // Part6: 16問
  7: 267,  // Part7: 54問
};
const ALL_PARTS = [1, 2, 3, 4, 5, 6, 7];
const MAX_PART_SCORE = Object.values(PART_WEIGHTS).reduce((a, b) => a + b, 0); // 990

function calcEstimatedScore(
  partMap: Record<number, { total: number; correct: number }>,
  totalAnswers: number,
  vocabStudied: number
): number | null {
  // 全Partに1問以上回答していないと解放しない
  const allDone = ALL_PARTS.every((p) => (partMap[p]?.total ?? 0) > 0);
  if (!allDone) return null;

  // Part別正答率 × 重みで基礎スコアを計算
  let weightedScore = 0;
  for (const p of ALL_PARTS) {
    const ps = partMap[p];
    const accuracy = ps && ps.total > 0 ? ps.correct / ps.total : 0;
    weightedScore += accuracy * PART_WEIGHTS[p];
  }

  // 解答数ボーナス（最大100点：200問以上で満点）
  const volumeBonus = Math.min(100, totalAnswers * 0.5);

  // 単語学習ボーナス（最大50点：500単語以上で満点）
  const vocabBonus = Math.min(50, vocabStudied * 0.1);

  const score = Math.round(weightedScore + volumeBonus + vocabBonus);
  return Math.min(990, Math.max(10, score));
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    const userId = token.id as string;

    const body = await req.json();
    const { questionId, selectedAnswer, isCorrect, part, totalQuestions, correctCount, duration } = body;

    if (!questionId) return NextResponse.json({ error: "questionIdが必要です" }, { status: 400 });

    await prisma.userAnswer.create({
      data: { userId, questionId, selectedAnswer, isCorrect: Boolean(isCorrect) },
    });

    // 連続学習日数を更新
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const lastStudied = user.lastStudiedAt ? new Date(user.lastStudiedAt) : null;
      if (lastStudied) lastStudied.setHours(0, 0, 0, 0);
      let newStreak = user.streak;
      if (!lastStudied || lastStudied.getTime() < today.getTime()) {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        newStreak = lastStudied?.getTime() === yesterday.getTime() ? user.streak + 1 : 1;
        await prisma.user.update({
          where: { id: userId },
          data: { streak: newStreak, lastStudiedAt: new Date() },
        });
      }
    }

    // セッション情報を保存（パート完了時）
    if (part && totalQuestions && correctCount !== undefined && duration !== undefined) {
      await prisma.studySession.create({
        data: { userId, part, totalQuestions, correctCount, duration },
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
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.id) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    const userId = token.id as string;

    const stats = await prisma.userAnswer.groupBy({
      by: ["isCorrect"],
      where: { userId },
      _count: true,
    });

    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, targetScore: true, lastStudiedAt: true },
    });

    const partAnswers = await prisma.userAnswer.findMany({
      where: { userId },
      include: { question: { select: { part: true } } },
    });

    const partMap: Record<number, { total: number; correct: number }> = {};
    for (const a of partAnswers) {
      const p = a.question.part;
      if (!partMap[p]) partMap[p] = { total: 0, correct: 0 };
      partMap[p].total++;
      if (a.isCorrect) partMap[p].correct++;
    }

    // 単語学習数
    const vocabStudied = await prisma.userVocabulary.count({ where: { userId } });

    const totalAnswers = stats.reduce((acc, s) => acc + s._count, 0);
    const estimatedScore = calcEstimatedScore(partMap, totalAnswers, vocabStudied);

    return NextResponse.json({ stats, sessions, user, partStats: partMap, estimatedScore });
  } catch (error) {
    console.error("GET /api/answers error:", error);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
