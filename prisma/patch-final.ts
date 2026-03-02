import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const extras = [
  { word: "replenish", meaning: "補充する・補填する", example: "We need to replenish our office supplies.", category: "verb", level: 2, difficulty: "easy" },
  { word: "scalable", meaning: "拡張可能な・スケーラブルな", example: "We need a scalable solution for future growth.", category: "adjective", level: 3, difficulty: "medium" },
  { word: "divestiture", meaning: "資産売却・事業売却", example: "The company announced the divestiture of its retail division.", category: "noun", level: 4, difficulty: "hard" },
  { word: "encumbrance", meaning: "負担・担保権", example: "The property was sold free of any encumbrance.", category: "noun", level: 4, difficulty: "hard" },
];

async function main() {
  const existing = await prisma.vocabulary.findMany({ select: { word: true } });
  const existingSet = new Set(existing.map(v => v.word.toLowerCase()));
  let added = 0;
  for (const w of extras) {
    if (!existingSet.has(w.word.toLowerCase())) {
      await prisma.vocabulary.create({ data: w });
      added++;
    }
  }
  const total = await prisma.vocabulary.count();
  console.log(`✅ ${added}単語追加 → 総単語数: ${total}`);
  const byLevel = await prisma.vocabulary.groupBy({ by: ["level"], _count: { id: true } });
  byLevel.sort((a,b) => a.level - b.level).forEach(x => console.log(`  Level ${x.level}: ${x._count.id}単語`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
