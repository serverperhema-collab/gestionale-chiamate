import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Inizio estrazione contatti nascosti/Ko...");
  
  const hiddenContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { hiddenUntil: { not: null } },
        { isKo: true },
        { koRecords: { some: { isResolved: false } } }
      ]
    },
    include: {
      phones: true,
      koRecords: true
    }
  });

  const exportPath = path.join(process.cwd(), "backup_contatti_nascosti_ko.json");
  fs.writeFileSync(exportPath, JSON.stringify(hiddenContacts, null, 2));
  
  // Create a CSV version too for easy viewing
  let csv = "ID,Nome,Provincia,CAP,Indirizzo,Telefono Originale,HiddenUntil,isKo,Motivo KO\n";
  for (const c of hiddenContacts) {
    const koReason = c.koRecords && c.koRecords.length > 0 ? 'Non specificato' : "";
    csv += `"${c.id}","${c.name}","","${c.cap}","${c.address}","${c.originalPhone}","${c.hiddenUntil}","${c.isKo}","${koReason}"\n`;
  }
  
  const csvPath = path.join(process.cwd(), "backup_contatti_nascosti_ko.csv");
  fs.writeFileSync(csvPath, csv);
  
  console.log(`Esportati ${hiddenContacts.length} contatti nel file: ${exportPath}`);
  console.log(`Versione CSV esportata in: ${csvPath}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());