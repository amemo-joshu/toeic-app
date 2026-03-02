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
  {
    level: 1,
    desc: "TOEIC 400点台レベル。日常・基礎ビジネス英語。中学〜高校基礎レベルの単語、E,
    categories: ["動詁Everb)", "名詁Enoun)", "形容詁Eadjective)", "副詁Eadverb)"],
  },
  {
    level: 2,
    desc: "TOEIC 500点台レベル。基礎ビジネス英語。高校レベルの単語、E,
    categories: ["動詁Everb)", "名詁Enoun)", "形容詁Eadjective)", "副詁Eadverb)"],
  },
  {
    level: 3,
    desc: "TOEIC 600点台レベル。中級ビジネス英語。大学入試レベルの単語、E,
    categories: ["動詁Everb)", "名詁Enoun)", "形容詁Eadjective)", "副詁Eadverb)"],
  },
  {
    level: 4,
    desc: "TOEIC 700点台レベル。上級ビジネス英語。TOEICで頻出の単語、E,
    categories: ["動詁Everb)", "名詁Enoun)", "形容詁Eadjective)", "副詁Eadverb)"],
  },
  {
    level: 5,
    desc: "TOEIC 800点以上レベル。趁E��級ビジネス英語。難関・専門皁E��単語、E,
    categories: ["動詁Everb)", "名詁Enoun)", "形容詁Eadjective)", "副詁Eadverb)"],
  },
];

async function generateWordsForLevel(level: number, desc: string, category: string, count: number, existingWords: Set<string>): Promise<VocabWord[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  const prompt = `Generate ${count} unique English vocabulary words for TOEIC exam preparation.

Level: ${level}/5
Description: ${desc}
Category: ${category}
Already used words (do NOT repeat): ${Array.from(existingWords).slice(-50).join(", ")}

Requirements:
- Words must be appropriate for TOEIC business English context
- Each word must be unique and not in the "already used" list
- Meaning must be in Japanese (natural Japanese translation)
- Example must be a natural business English sentence (not too long, max 15 words)
- Category should be one of: verb, noun, adjective, adverb

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {"word": "accomplish", "meaning": "達�Eする", "example": "We accomplished all project goals ahead of schedule.", "category": "verb"},
  ...
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed: VocabWord[] = JSON.parse(text);
    return parsed.filter(w => w.word && w.meaning && w.example && !existingWords.has(w.word.toLowerCase()));
  } catch (e) {
    console.error(`Error generating level ${level} ${category}:`, e);
    return [];
  }
}

async function main() {
  console.log("🚀 Generating 1000 vocabulary words with Gemini...\n");

  // Clear existing vocabulary
  await prisma.userVocabulary.deleteMany();
  await prisma.vocabulary.deleteMany();
  console.log("🗑�E�E Cleared existing vocabulary\n");

  const existingWords = new Set<string>();
  let totalCreated = 0;

  for (const config of LEVEL_CONFIGS) {
    console.log(`\n📚 Level ${config.level}: ${config.desc}`);
    const levelWords: VocabWord[] = [];

    // Generate 50 words per category (4 categories ÁE50 = 200 per level)
    for (const category of config.categories) {
      console.log(`  Generating ${category}...`);
      let attempts = 0;
      let words: VocabWord[] = [];

      while (words.length < 45 && attempts < 3) {
        const batch = await generateWordsForLevel(config.level, config.desc, category, 55, existingWords);
        for (const w of batch) {
          if (!existingWords.has(w.word.toLowerCase()) && words.length < 50) {
            existingWords.add(w.word.toLowerCase());
            words.push(w);
          }
        }
        attempts++;
        if (words.length < 45) {
          console.log(`    Retry ${attempts}: got ${words.length} so far...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      levelWords.push(...words);
      console.log(`  ✁E${category}: ${words.length} words`);
      await new Promise(r => setTimeout(r, 1500));
    }

    // Save to DB
    for (const w of levelWords) {
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

    totalCreated += levelWords.length;
    console.log(`✁ELevel ${config.level}: ${levelWords.length} words saved`);
  }

  console.log(`\n🎉 Done! Total: ${totalCreated} words created`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
