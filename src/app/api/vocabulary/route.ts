import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
// Prisma import removed (no longer using $queryRaw)
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// crypto ベースの Fisher-Yates シャッフル（真のランダム）
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUInt32BE(0) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

  // GETは後方互換のため残すが、フロントはPOSTを使用
  const where = level ? { level: parseInt(level) } : {};
  const allVocabs = await prisma.vocabulary.findMany({ where });
  const shuffled = shuffle(allVocabs).slice(0, limit);
  return NextResponse.json(shuffled.map(v => ({ ...v, progress: null })), {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const body = await req.json();

  // action: "fetch" → 単語取得（POSTでキャッシュ回避）
  if (body.action === "fetch") {
    const level: string | undefined = body.level;
    const mode: string | undefined = body.mode;
    const limit: number = Number(body.limit) || 10;

    if (mode === "review") {
      const wrongVocabs = await prisma.userVocabulary.findMany({
        where: { userId: user.id, wrongCount: { gt: 0 } },
        include: { vocab: true },
        orderBy: { wrongCount: "desc" },
      });
      const selected = shuffle(wrongVocabs).slice(0, limit);
      return NextResponse.json(selected.map(uv => ({
        ...uv.vocab,
        progress: { correctCount: uv.correctCount, wrongCount: uv.wrongCount },
        _ts: Date.now(),
      })));
    }

    const lvl = level ? parseInt(level) : null;
    const where = lvl !== null ? { level: lvl } : {};

    // 全単語取得 → crypto Fisher-Yates でシャッフル → 上位 limit 件
    const allVocabs = await prisma.vocabulary.findMany({ where });
    const allIds = allVocabs.map(v => v.id);
    const selected = shuffle(allVocabs).slice(0, limit);

    // ユーザー進捗取得
    const userVocabs = await prisma.userVocabulary.findMany({
      where: { userId: user.id, vocabId: { in: allIds } },
      select: { vocabId: true, correctCount: true, wrongCount: true },
    });
    const progressMap = new Map(userVocabs.map(v => [v.vocabId, v]));

    return NextResponse.json(selected.map(v => ({
      ...v,
      progress: progressMap.has(v.id)
        ? { correctCount: progressMap.get(v.id)!.correctCount, wrongCount: progressMap.get(v.id)!.wrongCount }
        : null,
      _ts: Date.now(),
    })));
  }

  // action: "answer" or legacy → 回答記録
  const { vocabId, correct } = body;
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
