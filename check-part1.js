const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    where: { part: 1 },
    select: { id: true, questionText: true, explanation: true, imageUrl: true },
    orderBy: { createdAt: 'desc' }
  });

  questions.forEach((q, i) => {
    console.log(`\n--- 表示順 ${i+1} ---`);
    console.log(`imageUrl: ${q.imageUrl}`);
    console.log(`questionText: ${q.questionText}`);
    console.log(`explanation: ${q.explanation}`);
  });

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
