const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.vocabulary.groupBy({ by: ['level'], _count: { id: true } })
  .then(r => {
    let total = 0;
    r.sort((a,b) => a.level - b.level).forEach(x => {
      console.log(`Level ${x.level}: ${x._count.id} 単語`);
      total += x._count.id;
    });
    console.log(`合計: ${total} 単語`);
    p.$disconnect();
  });
