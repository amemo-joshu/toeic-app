import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function main() {
  const all = await prisma.vocabulary.findMany({ select: { word: true, level: true } });
  const existingWords = new Set(all.map(v => v.word.toLowerCase()));

  const gaps = [
    { level: 2, needed: 4, desc: "TOEIC 500点台。基礎ビジネス英語。高校レベル、E },
    { level: 3, needed: 6, desc: "TOEIC 600点台。中級ビジネス英語、E },
    { level: 4, needed: 8, desc: "TOEIC 700点台。上級ビジネス英語、E },
  ];

  for (const gap of gaps) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = `Generate ${gap.needed + 5} completely different English vocabulary words for TOEIC.
Level ${gap.level}: ${gap.desc}
These words are already taken  Euse entirely different words: ${Array.from(existingWords).slice(-100).join(", ")}
Return ONLY JSON array: [{"word":"...","meaning":"日本誁E,"example":"Business sentence.","category":"verb|noun|adjective|adverb"}]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const words = JSON.parse(text);
      let added = 0;
      for (const w of words) {
        if (!existingWords.has(w.word?.toLowerCase()) && added < gap.needed) {
          await prisma.vocabulary.create({
            data: { word: w.word, meaning: w.meaning, example: w.example, category: w.category || "noun",
              difficulty: "medium", level: gap.level },
          });
          existingWords.add(w.word.toLowerCase());
          added++;
        }
      }
      console.log(`✁ELevel ${gap.level}: ${added}単語追加`);
    } catch(e) { console.error(`Level ${gap.level} error:`, (e as Error).message.slice(0,80)); }
    await new Promise(r => setTimeout(r, 2000));
  }

  const total = await prisma.vocabulary.count();
  console.log(`\n🎉 総単語数: ${total}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
