import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getContactsWithHistory() {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { appointments: { some: {} } },
        { negotiations: { some: { isAbandoned: false } } }
      ]
    },
    include: {
      appointments: {
        include: { outcomes: true, quoteRequest: true }
      },
      negotiations: {
        where: { isAbandoned: false }
      }
    }
  });
  return contacts;
}

type LegacyEvent = {
  type: string;
  occurredAt: Date;
  sourceModel: string;
  sourceId: string;
  payload: any;
};

function normalizeLegacyTimeline(contact: any): LegacyEvent[] {
  const events: LegacyEvent[] = [];

  for (const appt of contact.appointments) {
    events.push({
      type: "APPOINTMENT_SCHEDULED",
      occurredAt: appt.createdAt,
      sourceModel: "Appointment",
      sourceId: appt.id,
      payload: appt
    });

    if (appt.outcomes && appt.outcomes.length > 0) {
      events.push({
        type: "APPOINTMENT_OUTCOME",
        occurredAt: appt.outcomes[0].createdAt,
        sourceModel: "AppointmentOutcome",
        sourceId: appt.outcomes[0].id,
        payload: appt.outcomes[0]
      });
    }

    if (appt.quoteRequest) {
      events.push({
        type: "QUOTE_REQUEST",
        occurredAt: appt.quoteRequest.createdAt,
        sourceModel: "QuoteRequest",
        sourceId: appt.quoteRequest.id,
        payload: appt.quoteRequest
      });
    }
  }

  for (const neg of contact.negotiations) {
    events.push({
      type: "NEGOTIATION_SCHEDULED",
      occurredAt: neg.createdAt,
      sourceModel: "Negotiation",
      sourceId: neg.id,
      payload: neg
    });
  }

  return events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}

function validateMigration(contact: any, normalized: LegacyEvent[], report: any) {
  if (normalized.length === 0) return; // Should not happen

  report.stPreviste++;
  report.eventPrevisti += normalized.length;
  
  const appts = contact.appointments.length;
  report.appointmentPrevisti += appts;

  // Simulate status calculation
  let status = "TRATTATIVA_IN_CORSO";
  const lastEvent = normalized[normalized.length - 1];
  
  if (lastEvent.type === "NEGOTIATION_SCHEDULED") {
    status = "RICHIAMO_PERSONALE";
  } else if (lastEvent.type === "APPOINTMENT_SCHEDULED") {
    const isFuture = lastEvent.payload.date > new Date();
    status = isFuture ? "APPUNTAMENTO" : "TRATTATIVA_IN_CORSO"; // simplify
  }

  report.migrated++;
}

async function migrateContact(contact: any, normalized: LegacyEvent[], report: any) {
  if (normalized.length === 0) return;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Check if already migrated
      const existing = await tx.migrationMapping.findFirst({
        where: { legacyModel: "Contact", legacyId: contact.id }
      });
      if (existing) {
        report.skipped++;
        return;
      }

      // Determine final state
      let currentStatus = "TRATTATIVA_IN_CORSO";
      let nextActionType = "NONE";
      let nextActionDate = null;
      let closedAt = null;
      let currentOp = null;
      let currentComm = null;
      
      const lastEvent = normalized[normalized.length - 1];
      if (lastEvent.type === "NEGOTIATION_SCHEDULED") {
        currentStatus = "RICHIAMO_PERSONALE";
        nextActionType = "RICHIAMO";
        nextActionDate = lastEvent.payload.recallDate;
        currentOp = lastEvent.payload.operatorId;
      } else if (lastEvent.type === "APPOINTMENT_SCHEDULED") {
        currentStatus = "APPUNTAMENTO";
        currentComm = lastEvent.payload.commercialeId;
        nextActionDate = lastEvent.payload.date;
      } else if (lastEvent.type === "APPOINTMENT_OUTCOME") {
        currentStatus = "TRATTATIVA_IN_CORSO"; // semplificato
        currentComm = lastEvent.payload.commercialeId || contact.assignedToId;
      }

      if (contact.isKo) {
        currentStatus = "CHIUSA_PERSA";
        closedAt = new Date();
      }

      // Create ST
      const st = await tx.trattativaSheet.create({
        data: {
          contactId: contact.id,
          status: currentStatus as any,
          nextActionType: nextActionType as any,
          nextActionDate: nextActionDate,
          closedAt: closedAt,
          currentOperatorId: currentOp,
          currentCommercialeId: currentComm,
          createdByOperatorId: currentOp || "SYSTEM",
          version: 1
        }
      });

      // Write Mappings & Events
      for (const ev of normalized) {
        await tx.migrationMapping.create({
          data: {
            legacyModel: ev.sourceModel,
            legacyId: ev.sourceId,
            newModel: "TrattativaEvent",
            newEntityId: st.id
          }
        });

        // Appts -> TrattativaAppointment
        if (ev.type === "APPOINTMENT_SCHEDULED") {
          const apptState = ev.payload.date > new Date() ? "FISSATO" : "SVOLTO_ESITATO"; // semplificato
          const tAppt = await tx.trattativaAppointment.create({
            data: {
              trattativaId: st.id,
              date: ev.payload.date,
              isPhoneAppt: ev.payload.isDeroga || false,
              commercialeId: ev.payload.commercialeId,
              zoneAgendaId: ev.payload.zoneAgendaId,
              status: apptState as any
            }
          });
          
          await tx.migrationMapping.create({
            data: {
              legacyModel: "Appointment",
              legacyId: ev.payload.id,
              newModel: "TrattativaAppointment",
              newEntityId: tAppt.id
            }
          });
        }
      }

      // Contact -> ST mapping
      await tx.migrationMapping.create({
        data: {
          legacyModel: "Contact",
          legacyId: contact.id,
          newModel: "TrattativaSheet",
          newEntityId: st.id
        }
      });

      report.migrated++;
    });
  } catch (e: any) {
    report.errors.push({ contactId: contact.id, error: e.message });
  }
}

async function main() {
  const mode = process.argv[2] || "dry-run";
  console.log(`Starting FASE 7 Migration in ${mode} mode...`);

  const contacts = await getContactsWithHistory();
  console.log(`Found ${contacts.length} contacts with history.`);

  const report = { 
    contactAnalizzati: contacts.length, 
    stPreviste: 0, 
    appointmentPrevisti: 0,
    eventPrevisti: 0,
    migrated: 0, 
    skipped: 0, 
    warnings: [] as any[], 
    errors: [] as any[] 
  };

  for (const contact of contacts) {
    const normalized = normalizeLegacyTimeline(contact);
    
    if (mode === "dry-run") {
      validateMigration(contact, normalized, report);
    } else if (mode === "run") {
      await migrateContact(contact, normalized, report);
    }
  }

  console.log("\n=== MIGRATION REPORT ===");
  console.log(`CONTACT ANALIZZATI: ${report.contactAnalizzati}`);
  if (mode === "dry-run") {
    console.log(`ST PREVISTE: ${report.stPreviste}`);
    console.log(`APPOINTMENT PREVISTI: ${report.appointmentPrevisti}`);
    console.log(`EVENT PREVISTI: ${report.eventPrevisti}`);
  }
  console.log(`MIGRATED: ${report.migrated}`);
  console.log(`SKIPPED: ${report.skipped}`);
  console.log(`WARNINGS: ${report.warnings.length}`);
  console.log(`ERRORS: ${report.errors.length}`);

  if (report.errors.length > 0) {
    console.error("First 5 errors:", report.errors.slice(0, 5));
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});