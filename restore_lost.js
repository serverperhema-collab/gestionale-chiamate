const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const lost = await prisma.appointmentOutcome.findMany({
    where: {
      nextActionType: "RICHIAMO",
      nextActionTarget: "COMMERCIALE"
    },
    include: {
      appointment: true
    }
  });
  
  console.log(`Found ${lost.length} lost recalls.`);

  for (const l of lost) {
    const existing = await prisma.appointment.findFirst({
      where: {
        contactId: l.appointment.contactId,
        status: "DA_GESTIRE_COMMERCIALE"
      }
    });

    if (!existing) {
      await prisma.appointment.create({
        data: {
          contactId: l.appointment.contactId,
          operatorId: l.appointment.operatorId,
          commercialeId: l.appointment.commercialeId,
          date: l.nextActionDate || new Date(),
          status: "DA_GESTIRE_COMMERCIALE",
          commercialStatus: "ASSEGNATO",
          tlNotes: "Richiamo Personale generato (Recuperato).",
          referentName: l.appointment.referentName || "Sconosciuto",
          referentRole: l.appointment.referentRole || "",
          phone: l.appointment.phone || "",
          clientNeeds: l.appointment.clientNeeds || "Richiamo"
        }
      });
      console.log(`Restored for contact ${l.appointment.contactId}`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
