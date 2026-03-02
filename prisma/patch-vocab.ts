import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const extras = [
  // Level 2 (4単語)
  { word: "clarify", meaning: "明確にする", example: "Please clarify the requirements before starting.", category: "verb", level: 2, difficulty: "easy" },
  { word: "database", meaning: "データベース", example: "Update the customer database regularly.", category: "noun", level: 2, difficulty: "easy" },
  { word: "flexible", meaning: "柔軟な", example: "We need a flexible approach to this problem.", category: "adjective", level: 2, difficulty: "easy" },
  { word: "promptly", meaning: "迅速に・すぐに", example: "Please respond to client emails promptly.", category: "adverb", level: 2, difficulty: "easy" },
  // Level 3 (5単語)
  { word: "benchmark", meaning: "基準・指標", example: "Set a benchmark to measure project success.", category: "noun", level: 3, difficulty: "medium" },
  { word: "outsource", meaning: "外注する・アウトソースする", example: "The company decided to outsource its IT support.", category: "verb", level: 3, difficulty: "medium" },
  { word: "proactive", meaning: "積極的な・先手を打つ", example: "Take a proactive approach to risk management.", category: "adjective", level: 3, difficulty: "medium" },
  { word: "efficiently", meaning: "効率的に", example: "We need to use resources more efficiently.", category: "adverb", level: 3, difficulty: "medium" },
  { word: "workforce", meaning: "労働力・従業員", example: "The company plans to expand its workforce.", category: "noun", level: 3, difficulty: "medium" },
  // Level 4 (5単語)
  { word: "liquidate", meaning: "清算する・換金する", example: "They had to liquidate assets to pay debts.", category: "verb", level: 4, difficulty: "hard" },
  { word: "turnaround", meaning: "業績回復・転換", example: "The CEO led a remarkable turnaround.", category: "noun", level: 4, difficulty: "hard" },
  { word: "meticulous", meaning: "細心の・綿密な", example: "She is meticulous in her financial reporting.", category: "adjective", level: 4, difficulty: "hard" },
  { word: "stringently", meaning: "厳格に", example: "Safety regulations are stringently enforced.", category: "adverb", level: 4, difficulty: "hard" },
  { word: "depreciate", meaning: "減価償却する・価値が下がる", example: "The equipment will depreciate over five years.", category: "verb", level: 4, difficulty: "hard" },
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
