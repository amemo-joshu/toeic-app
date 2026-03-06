const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const withEx = await p.vocabulary.groupBy({ by: ['level'], _count: { id: true }, where: { example: { not: null } }, orderBy: { level: 'asc' } });
  const total = await p.vocabulary.groupBy({ by: ['level'], _count: { id: true }, orderBy: { level: 'asc' } });
  console.log('=== 例文状況 ===');
  total.forEach(t => {
    const w = withEx.find(x => x.level === t.level);
    console.log(`Level ${t.level}: ${w?._count.id ?? 0}/${t._count.id}件 例文あり`);
  });
  const noEx = await p.vocabulary.count({ where: { OR: [{ example: null }, { example: '' }] } });
  console.log(`\n例文なし: ${noEx}件残り`);
}
main().catch(console.error).finally(() => p.$disconnect());
