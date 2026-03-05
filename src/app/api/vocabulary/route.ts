import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/get-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const mode = searchParams.get("mode");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (mode === "review") {
    const wrongVocabs = await prisma.userVocabulary.findMany({
      where: { userId: user.id, wrongCount: { gt: 0 } },
      include: { vocab: true },
      orderBy: { wrongCount: "desc" },
    });
    const shuffled = wrongVocabs.sort(() => Math.random() - 0.5).slice(0, limit);
    return NextResponse.json(shuffled.map(uv => ({
      ...uv.vocab,
      progress: { correctCount: uv.correctCount, wrongCount: uv.wrongCount },
    })));
  }

  const lvl = level ? parseInt(level) : null;

  // PostgreSQL の RANDOM() + 苦手優先スコアでDB側でランダム選択
  type RawRow = {
    id: string; word: string; meaning: string; example: string | null;
    category: string | null; level: number;
    correctCount: number | null; wrongCount: number | null;
  };

  const rows: RawRow[] = await prisma.$queryRaw`
    SELECT
      v.id, v.word, v.meaning, v.example, v.category, v.level,
      uv."correctCount", uv."wrongCount"
    FROM "Vocabulary" v
    LEFT JOIN "UserVocabulary" uv
      ON v.id = uv."vocabId" AND uv."userId" = ${user.id}
    WHERE ${lvl !== null ? Prisma.sql`v.level = ${lvl}` : Prisma.sql`TRUE`}
    ORDER BY (
      COALESCE(
        CAST(uv."wrongCount" AS float) /
        NULLIF(COALESCE(uv."correctCount",0) + COALESCE(uv."wrongCount",0), 0),
        0.3
      ) * 1.5 + RANDOM()
    ) DESC
    LIMIT ${limit}
  `;

  return NextResponse.json(rows.map(r => ({
    id: r.id, word: r.word, meaning: r.meaning,
    example: r.example, category: r.category, level: r.level,
    progress: (r.correctCount !== null || r.wrongCount !== null)
      ? { correctCount: r.correctCount ?? 0, wrongCount: r.wrongCount ?? 0 }
      : null,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { vocabId, correct } = await req.json();
  const existing = await prisma.userVocabulary.findUnique({
    where: { userId_vocabId: { userId: user.id, vocabId } },
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
    where: { userId_vocabId: { userId: user.id, vocabId } },
    create: { userId: user.id, vocabId, interval, easeFactor, nextReviewAt,
      correctCount: correct ? 1 : 0, wrongCount: correct ? 0 : 1 },
    update: { interval, easeFactor, nextReviewAt,
      correctCount: correct ? { increment: 1 } : undefined,
      wrongCount: !correct ? { increment: 1 } : undefined },
  });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = dbUser.lastStudiedAt ? new Date(dbUser.lastStudiedAt) : null;
    if (last) last.setHours(0, 0, 0, 0);
    if (!last || last.getTime() < today.getTime()) {
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const streak = last?.getTime() === yesterday.getTime() ? dbUser.streak + 1 : 1;
      await prisma.user.update({ where: { id: user.id }, data: { streak, lastStudiedAt: new Date() } });
    }
  }
  return NextResponse.json({ success: true });
}
