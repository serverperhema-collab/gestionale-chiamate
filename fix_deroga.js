const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.appointment.updateMany({
    where: {
      isDeroga: true,
      zoneAgendaId: {
        not: null
      }
    },
    data: {
      isDeroga: false,
      isApproved: true
    }
  });
  console.log(`Updated ${result.count} appointments.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
