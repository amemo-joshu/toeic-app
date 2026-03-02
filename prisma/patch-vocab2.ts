import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const extras = [
  { word: "invoice", meaning: "請求書・インボイス", example: "Send the invoice to the client by Friday.", category: "noun", level: 2, difficulty: "easy" },
  { word: "negotiate", meaning: "交渉する", example: "We need to negotiate the contract terms.", category: "verb", level: 2, difficulty: "easy" },
  { word: "diligently", meaning: "勤勉に・熱心に", example: "She diligently reviewed all the documents.", category: "adverb", level: 2, difficulty: "easy" },
  { word: "incentive", meaning: "インセンティブ・動機づけ", example: "Bonuses serve as an incentive for employees.", category: "noun", level: 3, difficulty: "medium" },
  { word: "streamline", meaning: "効率化する・合理化する", example: "We aim to streamline our approval process.", category: "verb", level: 3, difficulty: "medium" },
  { word: "delegate", meaning: "権限を委譲する・代表者", example: "Managers should delegate tasks effectively.", category: "verb", level: 4, difficulty: "hard" },
  { word: "arbitration", meaning: "仲裁・調停", example: "The dispute was settled through arbitration.", category: "noun", level: 4, difficulty: "hard" },
  { word: "proprietary", meaning: "専有の・特許の", example: "This is proprietary software owned by the company.", category: "adjective", level: 4, difficulty: "hard" },
  { word: "solvency", meaning: "支払能力・債務弁済能力", example: "The auditors confirmed the firm's solvency.", category: "noun", level: 4, difficulty: "hard" },
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
