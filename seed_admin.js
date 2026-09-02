const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@admin.com',
      password: hash,
      name: 'Team Leader Locale',
      role: 'TEAM_LEADER'
    }
  });
  console.log("Creato utente locale: admin (password: password)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
