const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const db = new Database('./prisma/dev.db', { readonly: true });

async function main() {
  console.log("Inizio migrazione da SQLite a PostgreSQL...");

  try {
    // Leggi tutti i contatti da SQLite
    const contacts = db.prepare('SELECT * FROM Contact').all();
    console.log(`Trovati ${contacts.length} contatti in SQLite.`);

    let imported = 0;
    let skipped = 0;

    for (const contact of contacts) {
      // Verifica se esiste già in postgres (stesso placeId o stesso nome)
      const existing = await prisma.contact.findFirst({
        where: {
          OR: [
            { placeId: contact.placeId },
            { name: contact.name }
          ]
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Crea il contatto in PostgreSQL
      await prisma.contact.create({
        data: {
          placeId: contact.placeId,
          name: contact.name,
          cap: contact.cap,
          address: contact.address,
          website: contact.website,
          originalPhone: contact.phone,
          sector: contact.sector,
          businessStatus: contact.businessStatus,
          hours: contact.hours,
          phones: contact.phone ? {
            create: [
              { phone: contact.phone, label: "Principale (Migrato)" }
            ]
          } : undefined
        }
      });

      imported++;
      if (imported % 100 === 0) {
        console.log(`Migrati ${imported} contatti...`);
      }
    }

    console.log(`Migrazione completata!`);
    console.log(`Importati: ${imported}`);
    console.log(`Scartati (già esistenti): ${skipped}`);

  } catch (error) {
    console.error("Errore durante la migrazione:", error);
  } finally {
    await prisma.$disconnect();
    db.close();
  }
}

main();
