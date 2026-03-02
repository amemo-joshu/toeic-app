const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 表示順（createdAt desc）で取得
  const questions = await prisma.question.findMany({
    where: { part: 1 },
    select: { id: true, explanation: true },
    orderBy: { createdAt: 'desc' }
  });

  for (let i = 0; i < questions.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    const imageUrl = `/images/part1/photo_${num}.png`;
    await prisma.question.update({
      where: { id: questions[i].id },
      data: { imageUrl }
    });
    console.log(`表示順${i+1} → ${imageUrl} | ${questions[i].explanation?.substring(0, 30)}`);
  }

  console.log('\n完了！');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
