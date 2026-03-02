import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  const userId = token.id as string;

  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const mode = searchParams.get("mode");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (mode === "review") {
    const wrongVocabs = await prisma.userVocabulary.findMany({
      where: { userId, wrongCount: { gt: 0 } },
      include: { vocab: true },
      orderBy: { wrongCount: "desc" },
    });
    const shuffled = wrongVocabs.sort(() => Math.random() - 0.5).slice(0, limit);
    return NextResponse.json(shuffled.map(uv => ({
      ...uv.vocab,
      progress: { correctCount: uv.correctCount, wrongCount: uv.wrongCount },
    })));
  }

  const where = level ? { level: parseInt(level) } : {};
  const allVocabs = await prisma.vocabulary.findMany({ where, select: { id: true } });
  const shuffledIds = allVocabs.sort(() => Math.random() - 0.5).slice(0, limit).map(v => v.id);
  const vocabs = await prisma.vocabulary.findMany({ where: { id: { in: shuffledIds } } });

  const userVocabs = await prisma.userVocabulary.findMany({
    where: { userId, vocabId: { in: shuffledIds } },
    select: { vocabId: true, correctCount: true, wrongCount: true },
  });
  const progressMap = Object.fromEntries(userVocabs.map((v) => [v.vocabId, v]));

  const result = vocabs.map((v) => ({
    ...v,
    progress: progressMap[v.id] || null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  const userId = token.id as string;

  const { vocabId, correct } = await req.json();

  const existing = await prisma.userVocabulary.findUnique({
    where: { userId_vocabId: { userId, vocabId } },
  });

  let interval = existing?.interval ?? 1;
  let easeFactor = existing?.easeFactor ?? 2.5;

  if (correct) {
    if (interval === 1) interval = 3;
    else if (interval === 3) interval = 7;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  await prisma.userVocabulary.upsert({
    where: { userId_vocabId: { userId, vocabId } },
    create: {
      userId,
      vocabId,
      interval,
      easeFactor,
      nextReviewAt,
      correctCount: correct ? 1 : 0,
      wrongCount: correct ? 0 : 1,
    },
    update: {
      interval,
      easeFactor,
      nextReviewAt,
      correctCount: correct ? { increment: 1 } : undefined,
      wrongCount: !correct ? { increment: 1 } : undefined,
    },
  });

  // ストリーク更新
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = user.lastStudiedAt ? new Date(user.lastStudiedAt) : null;
    if (last) last.setHours(0, 0, 0, 0);
    let streak = user.streak;
    if (!last || last.getTime() < today.getTime()) {
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      streak = last?.getTime() === yesterday.getTime() ? streak + 1 : 1;
      await prisma.user.update({ where: { id: userId }, data: { streak, lastStudiedAt: new Date() } });
    }
  }

  return NextResponse.json({ success: true });
}
