import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const extras = [
  { word: "remittance", meaning: "送金・振込", example: "Please process the remittance by end of day.", category: "noun", level: 2, difficulty: "easy" },
  { word: "workload", meaning: "仕事量・業務負荷", example: "The team managed a heavy workload this quarter.", category: "noun", level: 2, difficulty: "easy" },
  { word: "consensus", meaning: "合意・コンセンサス", example: "The committee reached a consensus on the budget.", category: "noun", level: 2, difficulty: "easy" },
  { word: "forthcoming", meaning: "近々予定の・協力的な", example: "Details will be provided at the forthcoming meeting.", category: "adjective", level: 3, difficulty: "medium" },
  { word: "stipulate", meaning: "規定する・条件を定める", example: "The contract stipulates a 30-day notice period.", category: "verb", level: 3, difficulty: "medium" },
  { word: "contingency", meaning: "不測の事態・緊急対応", example: "We need a contingency plan for system failures.", category: "noun", level: 4, difficulty: "hard" },
  { word: "amortize", meaning: "償却する・分割返済する", example: "The loan will be amortized over ten years.", category: "verb", level: 4, difficulty: "hard" },
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
