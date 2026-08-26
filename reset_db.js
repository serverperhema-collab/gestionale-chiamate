const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetDb() {
  console.log("Inizio il reset dei dati...");

  try {
    // 1. Elimina i dati correlati (Tabelle accessorie)
    console.log("Eliminazione Appuntamenti...");
    await prisma.appointment.deleteMany();
    
    console.log("Eliminazione Trattative...");
    await prisma.negotiation.deleteMany();
    
    console.log("Eliminazione Log Attività...");
    await prisma.activityLog.deleteMany();
    
    console.log("Eliminazione Log Chiamate...");
    await prisma.callLog.deleteMany();
    
    console.log("Eliminazione Assegnazioni Giornaliere...");
    await prisma.dailyAssignment.deleteMany();
    
    console.log("Eliminazione Task TL...");
    await prisma.tlTask.deleteMany();
    
    console.log("Eliminazione Agende Zone...");
    await prisma.zoneAgenda.deleteMany();
    
    console.log("Eliminazione Richieste Preventivo...");
    await prisma.quoteRequest.deleteMany();
    
    console.log("Eliminazione Record KO...");
    await prisma.koRecord.deleteMany();

    // 2. Ripristino stato dei Contatti (rimuove assegnazioni, KO, blocchi, note TL, ecc)
    console.log("Ripristino stato iniziale dei Contatti...");
    await prisma.contact.updateMany({
      data: {
        noAnswerCount: 0,
        hiddenUntil: null,
        assignedToId: null,
        isKo: false,
        isPersonalCallback: false,
        blacklisted: false,
        blacklistReason: null,
        delegatedToId: null,
        delegatedUntil: null,
        reviewRequestedAt: null,
        reviewNote: null,
        skipCount: 0,
        lastOutcome: null,
        targetCompany: null
      }
    });

    // 3. Ripristino stato degli Utenti/Operatori (rimuove i blocchi di sicurezza)
    console.log("Sblocco e pulizia dello stato Operatori...");
    await prisma.user.updateMany({
      data: {
        skipCount: 0,
        skipLockedUntil: null,
        noAnswerLockedUntil: null,
        notAvailableLockedUntil: null,
        dailyModifications: 0,
        lastModificationDate: null,
        modLockedUntil: null,
        lastActivityAt: null
      }
    });

    console.log("RESET COMPLETATO CON SUCCESSO! ✅");
    console.log("I contatti, i numeri di telefono associati e gli account operatore sono rimasti intatti.");
  } catch (error) {
    console.error("Errore durante il reset:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDb();
