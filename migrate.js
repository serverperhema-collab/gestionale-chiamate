const { PrismaClient } = require('@prisma/client');
const prismaSrc = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://gestionale_chiamate_db_user:rSKStxIM9FfHu00ChGugwXrW5EpnVKNN@dpg-d9k6qfvavr4c73aavi10-a.frankfurt-postgres.render.com/gestionale_chiamate_dbm"
    }
  }
});
const prismaDest = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://gestionale_chiamate_db_user:rSKStxIM9FfHu00ChGugwXrW5EpnVKNN@dpg-d9k6qfvavr4c73aavi10-a.frankfurt-postgres.render.com/gestionale_chiamate_db"
    }
  }
});

async function main() {
  console.log("Fetching contacts from dbm...");
  const contacts = await prismaSrc.contact.findMany();
  console.log(`Found ${contacts.length} contacts. Inserting into db...`);
  
  if (contacts.length > 0) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      await prismaDest.contact.createMany({
        data: batch.map(c => {
          return {
            ...c,
            operatorId: null,
            status: "DA_CHIAMARE",
            isLocked: false,
            lockedAt: null,
            lockedBy: null
          };
        }),
        skipDuplicates: true
      });
      console.log(`Inserted ${Math.min(i + BATCH_SIZE, contacts.length)} / ${contacts.length}`);
    }
  }
  console.log("Done!");
}

main().catch(console.error).finally(() => {
  prismaSrc.$disconnect();
  prismaDest.$disconnect();
});
