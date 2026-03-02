const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    where: { part: 1 },
    select: { id: true, questionText: true },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${questions.length} Part 1 questions`);

  for (let i = 0; i < questions.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    const imageUrl = `/images/part1/photo_${num}.png`;
    await prisma.question.update({
      where: { id: questions[i].id },
      data: { imageUrl }
    });
    console.log(`Updated question ${i+1}: ${imageUrl}`);
  }

  console.log('Done!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
