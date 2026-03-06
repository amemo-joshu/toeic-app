const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
async function main() {
  const email = 'gen1666@yahoo.co.jp';
  const password = 'Masashi2024!';
  const hash = await bcrypt.hash(password, 12);
  const user = await p.user.upsert({
    where: { email },
    create: { email, name: '岩下昌司', password: hash },
    update: { password: hash },
  });
  console.log('✅ ユーザー作成/更新完了:', user.email);
  console.log('   パスワード:', password);
}
main().catch(console.error).finally(() => p.$disconnect());
