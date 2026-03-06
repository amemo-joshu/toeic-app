const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const users = await p.user.findMany({ select: { id: true, email: true, name: true, createdAt: true } });
  console.log('=== Users ===');
  users.forEach(u => console.log(`${u.email} | ${u.name} | ${u.createdAt}`));
}
main().catch(console.error).finally(() => p.$disconnect());
