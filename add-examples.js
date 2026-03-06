const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const BATCH_SIZE = 20;
const DELAY_MS = 5000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateExamples(words) {
  const list = words.map((w, i) => `${i + 1}. ${w.word} (${w.meaning})`).join('\n');
  const prompt = `以下のTOEIC英単語それぞれについて、TOEICビジネスシーンに沿った自然な英語例文を1つずつ作成してください。
例文は10〜20語程度で、単語を自然に使用してください。

単語リスト:
${list}

以下のJSON形式で返してください（コードブロックなし）:
[
  {"word": "単語1", "example": "例文1"},
  {"word": "単語2", "example": "例文2"},
  ...
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim()
    .replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(text);
}

async function main() {
  // 例文がない単語を全取得
  const noExample = await prisma.vocabulary.findMany({
    where: { OR: [{ example: null }, { example: '' }] },
    orderBy: { level: 'asc' },
  });

  console.log(`例文なし: ${noExample.length}単語`);

  let updated = 0;
  for (let i = 0; i < noExample.length; i += BATCH_SIZE) {
    const batch = noExample.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total = Math.ceil(noExample.length / BATCH_SIZE);
    console.log(`バッチ ${batchNum}/${total} 処理中... (${batch[0].word} 〜 ${batch[batch.length-1].word})`);

    try {
      const examples = await generateExamples(batch);

      // DBを更新
      for (const ex of examples) {
        const vocab = batch.find(w => w.word === ex.word);
        if (vocab && ex.example) {
          await prisma.vocabulary.update({
            where: { id: vocab.id },
            data: { example: ex.example },
          });
          updated++;
        }
      }
      console.log(`  → ${examples.length}件更新完了`);
    } catch (err) {
      console.error(`  バッチ ${batchNum} エラー:`, err.message);
      // エラーが出たら個別に処理
      for (const word of batch) {
        try {
          const res = await generateExamples([word]);
          if (res[0]?.example) {
            await prisma.vocabulary.update({
              where: { id: word.id },
              data: { example: res[0].example },
            });
            updated++;
          }
          await sleep(1000);
        } catch (e2) {
          console.error(`  "${word.word}" スキップ:`, e2.message);
        }
      }
    }

    if (i + BATCH_SIZE < noExample.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n完了！ ${updated}/${noExample.length}単語に例文を追加しました`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
