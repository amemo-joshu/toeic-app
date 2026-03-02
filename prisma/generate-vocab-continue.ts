import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface VocabWord {
  word: string;
  meaning: string;
  example: string;
  category: string;
}

const LEVEL_CONFIGS = [
  { level: 2, desc: "TOEIC 500点台レベル。基礎ビジネス英語。高校レベルの単語、E, target: 200 },
  { level: 3, desc: "TOEIC 600点台レベル。中級ビジネス英語。大学入試レベルの単語、E, target: 200 },
  { level: 4, desc: "TOEIC 700点台レベル。上級ビジネス英語。TOEICで頻出の単語、E, target: 200 },
  { level: 5, desc: "TOEIC 800点以上レベル。趁E��級ビジネス英語。難関・専門皁E��単語、E, target: 200 },
];

const CATEGORIES = ["verb", "noun", "adjective", "adverb"];

async function generateBatch(level: number, desc: string, category: string, count: number, existingWords: Set<string>): Promise<VocabWord[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const sample = Array.from(existingWords).slice(-30).join(", ");

  const prompt = `Generate ${count} unique English vocabulary words for TOEIC exam preparation.
Level: ${level}/5  E${desc}
Category: ${category}
Do NOT use these words: ${sample}

Return ONLY a JSON array (no markdown):
[{"word":"...","meaning":"日本語訳","example":"Business English sentence.","category":"${category}"},...]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: VocabWord[] = JSON.parse(text);
    return parsed.filter(w => w.word && w.meaning && !existingWords.has(w.word.toLowerCase()));
  } catch (e) {
    console.error("  ⚠ Gemini error:", (e as Error).message.slice(0, 80));
    return [];
  }
}

async function main() {
  // Load all existing words
  const all = await prisma.vocabulary.findMany({ select: { word: true, level: true } });
  const existingWords = new Set(all.map(v => v.word.toLowerCase()));
  console.log(`📖 既存単語数: ${all.length}`);

  let totalAdded = 0;

  for (const config of LEVEL_CONFIGS) {
    const current = all.filter(v => v.level === config.level).length;
    const needed = config.target - current;

    if (needed <= 0) {
      console.log(`✁ELevel ${config.level}: 既に${current}単語あり、スキチE�E`);
      continue;
    }

    console.log(`\n📚 Level ${config.level}: あと${needed}単語忁E��`);
    const perCategory = Math.ceil(needed / CATEGORIES.length);

    for (const category of CATEGORIES) {
      const catCount = await prisma.vocabulary.count({ where: { level: config.level, category } });
      const catNeeded = Math.ceil(config.target / CATEGORIES.length) - catCount;
      if (catNeeded <= 0) {
        console.log(`  ✁E${category}: 完亁E);
        continue;
      }

      console.log(`  Generating ${category} (${catNeeded}単誁E...`);
      let words: VocabWord[] = [];
      let attempts = 0;

      while (words.length < catNeeded - 5 && attempts < 4) {
        const batch = await generateBatch(config.level, config.desc, category, Math.min(catNeeded + 10, 60), existingWords);
        for (const w of batch) {
          if (!existingWords.has(w.word.toLowerCase()) && words.length < catNeeded) {
            existingWords.add(w.word.toLowerCase());
            words.push(w);
          }
        }
        attempts++;
        if (words.length < catNeeded - 5 && attempts < 4) {
          console.log(`    再試衁E${attempts}: ${words.length}単語取得済み`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      // Save
      for (const w of words) {
        await prisma.vocabulary.create({
          data: {
            word: w.word,
            meaning: w.meaning,
            example: w.example,
            category: w.category,
            difficulty: config.level <= 2 ? "easy" : config.level <= 3 ? "medium" : "hard",
            level: config.level,
          },
        });
      }
      totalAdded += words.length;
      console.log(`  ✁E${category}: ${words.length}単語追加`);
      await new Promise(r => setTimeout(r, 1500));
    }

    const finalCount = await prisma.vocabulary.count({ where: { level: config.level } });
    console.log(`✁ELevel ${config.level} 完亁E 合訁E{finalCount}単語`);
  }

  const grand = await prisma.vocabulary.count();
  console.log(`\n🎉 完亁E��総単語数: ${grand}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
