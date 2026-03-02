const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ select: { id: true, email: true, name: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); prisma.$disconnect(); });
