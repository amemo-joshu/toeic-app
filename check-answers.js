const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, streak: true, lastStudiedAt: true } });
  console.log('Users:', JSON.stringify(users, null, 2));

  const answers = await prisma.userAnswer.findMany({ take: 5 });
  console.log('UserAnswers count:', await prisma.userAnswer.count());
  console.log('Sample answers:', JSON.stringify(answers, null, 2));

  const sessions = await prisma.studySession.findMany({ take: 5 });
  console.log('StudySessions count:', await prisma.studySession.count());

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
