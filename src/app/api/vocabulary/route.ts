import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";

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

  const where = level ? { level: parseInt(level) } : {};

  // 全単語 + ユーザーの進捗を一括取得
  const allVocabs = await prisma.vocabulary.findMany({ where });
  const allIds = allVocabs.map(v => v.id);
  const userVocabs = await prisma.userVocabulary.findMany({
    where: { userId: user.id, vocabId: { in: allIds } },
    select: { vocabId: true, correctCount: true, wrongCount: true },
  });
  const progressMap = Object.fromEntries(userVocabs.map(v => [v.vocabId, v]));

  // 優先度スコア付きでシャッフル（Fisher-Yates + 重み付き）
  // スコア = ランダム値 + 苦手ボーナス（wrongRate が高いほど優先）
  const scored = allVocabs.map(v => {
    const prog = progressMap[v.id];
    let wrongRate = 0;
    if (prog) {
      const total = prog.correctCount + prog.wrongCount;
      wrongRate = total > 0 ? prog.wrongCount / total : 0;
    }
    const neverSeen = !prog ? 0.3 : 0; // 未学習にも少しボーナス
    const score = Math.random() + wrongRate * 1.5 + neverSeen;
    return { vocab: v, score };
  });

  // スコア降順でソートして上位 limit 件を取得
  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, limit).map(s => s.vocab);

  // Fisher-Yates で選ばれた単語の順番をシャッフル
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return NextResponse.json(selected.map(v => ({ ...v, progress: progressMap[v.id] || null })));
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
