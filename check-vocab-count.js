const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.vocabulary.groupBy({
    by: ['level'],
    _count: { id: true },
    orderBy: { level: 'asc' },
  });
  console.log('=== Vocabulary counts by level ===');
  counts.forEach(c => console.log(`Level ${c.level}: ${c._count.id} words`));
  const total = await prisma.vocabulary.count();
  console.log(`Total: ${total} words`);
  // サンプル確認
  const samples = await prisma.vocabulary.findMany({ where: { level: 2 }, take: 5, orderBy: { id: 'asc' } });
  console.log('\nLevel 2 sample (first 5):');
  samples.forEach(v => console.log(`  ${v.id.slice(0,8)} - ${v.word}: ${v.meaning}`));
  const samplesLast = await prisma.vocabulary.findMany({ where: { level: 2 }, take: 5, orderBy: { id: 'desc' } });
  console.log('\nLevel 2 sample (last 5):');
  samplesLast.forEach(v => console.log(`  ${v.id.slice(0,8)} - ${v.word}: ${v.meaning}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
