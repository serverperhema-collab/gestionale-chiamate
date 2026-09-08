import { prisma } from '@/lib/prisma';
import { 
  TrattativaStatus, 
  AppointmentState, 
  NextActionType, 
  TrattativaEventType,
  Prisma,
  Role,
  DerogaStatus
} from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors';
import { validateTrattativaTransition, isTrattativaClosedStatus } from '../domain/trattativa-state-machine';
import { validateAppointmentTransition, isAppointmentTerminalState } from '../domain/appointment-state-machine';
import { canPerformAction, TrattativaAction } from '../domain/authorization';
import { EventMetadataMap } from '../domain/trattativa-event-metadata';

export class TrattativaService {
  
  private async appendEvent<K extends keyof EventMetadataMap>(
    tx: Prisma.TransactionClient,
    trattativaId: string,
    eventType: K,
    description: string,
    metadata: EventMetadataMap[K],
    userId: string,
    userRole: string
  ) {
    await tx.trattativaEvent.create({
      data: {
        trattativaId,
        eventType: eventType as any,
        description,
        metadata: metadata as any,
        userId,
        userRole,
      },
    });
  }

  private validateRole(userRole: Role, action: TrattativaAction) {
    if (!canPerformAction(userRole, action)) {
      throw new ForbiddenError(`Ruolo ${userRole} non autorizzato per l'azione ${action}`);
    }
  }

  async createOrReopen(contactId: string, operatorId: string, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen');

    return prisma.$transaction(async (tx) => {
      const existing = await tx.trattativaSheet.findUnique({
        where: { contactId },
      });

      if (existing) {
        if (existing.closedAt === null) {
          return existing;
        }

        if (existing.status === TrattativaStatus.CHIUSA_VINTA) {
          throw new ForbiddenError("Impossibile risvegliare una Trattativa CHIUSA_VINTA in questo modo. Richiede intervento TL.");
        }
        
        const activeKo = await tx.koRecord.findFirst({
          where: { contactId, isResolved: false, frozenUntil: { gt: new Date() } }
        });
        if (activeKo) {
          throw new ValidationError("Impossibile riaprire: il contatto è bloccato da un KoRecord attivo.");
        }

        const updated = await tx.trattativaSheet.updateMany({
          where: { id: existing.id, version: existing.version },
          data: {
            status: TrattativaStatus.RICHIAMO_PERSONALE,
            closedAt: null,
            outcomeFinal: null,
            outcomeNotes: null,
            derogaStatus: DerogaStatus.NONE,
            nextActionType: NextActionType.NONE,
            nextActionDate: null,
            currentAppointmentId: null,
            currentOperatorId: operatorId,
            version: { increment: 1 }
          }
        });

        if (updated.count === 0) throw new ConflictError("Conflitto di versione durante la riapertura.");

        await this.appendEvent(tx, existing.id, "RIAPERTA", "Trattativa riaperta da stato CHIUSA_PERSA", {
          previousStatus: existing.status,
          previousClosedAt: existing.closedAt.toISOString(),
          reason: "Riapertura standard operatore",
          operatorId
        }, userId, userRole);

        return await tx.trattativaSheet.findUnique({ where: { id: existing.id } });
      }

      const newSt = await tx.trattativaSheet.create({
        data: {
          contactId,
          createdByOperatorId: operatorId,
          currentOperatorId: operatorId,
          status: TrattativaStatus.RICHIAMO_PERSONALE,
        }
      });

      await this.appendEvent(tx, newSt.id, "CREATA", "Trattativa creata", {
        operatorId
      }, userId, userRole);

      return newSt;
    });
  }

  async scheduleAppointment(
    trattativaId: string, 
    params: { date: string; isPhoneAppt: boolean; zoneAgendaId?: string; commercialeId?: string; referentName: string; phone: string; clientNeeds?: string }, 
    userId: string, 
    userRole: Role
  ) {
    this.validateRole(userRole, 'scheduleAppointment');

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Impossibile aggiungere appuntamenti a una Trattativa chiusa");
      
      if (!validateTrattativaTransition(st.status, TrattativaStatus.APPUNTAMENTO)) {
        throw new ValidationError(`Transizione non valida da ${st.status} a APPUNTAMENTO`);
      }

      
      let finalCommercialeId = params.commercialeId || st.currentCommercialeId;
      if (!params.isPhoneAppt && params.zoneAgendaId) {
        const agenda = await tx.zoneAgenda.findUnique({ where: { id: params.zoneAgendaId } });
        if (agenda && agenda.commercialeId) {
          finalCommercialeId = agenda.commercialeId;
        }
      }

      const appt = await tx.trattativaAppointment.create({
        data: {
          trattativaId,
          date: new Date(params.date),
          isPhoneAppt: params.isPhoneAppt,
          zoneAgendaId: params.zoneAgendaId,
          commercialeId: finalCommercialeId,
          status: AppointmentState.FISSATO,
        }
      });

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          status: TrattativaStatus.APPUNTAMENTO,
          currentAppointmentId: appt.id,
          nextActionType: NextActionType.APPUNTAMENTO,
          nextActionDate: appt.date,
          referentName: params.referentName,
          commercialPhone: params.phone,
          clientNeeds: params.clientNeeds,
          currentCommercialeId: finalCommercialeId,
          version: { increment: 1 }
        }
      });

      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      const evtDesc = `Fissato appuntamento ${params.isPhoneAppt ? "telefonico" : "fisico"} per il ${new Date(params.date).toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "short", timeStyle: "short" })}` + (params.clientNeeds ? `\nNote: ${params.clientNeeds}` : "");
      await this.appendEvent(tx, trattativaId, "APPUNTAMENTO_FISSATO", evtDesc, {
        date: params.date,
        isPhoneAppt: params.isPhoneAppt,
        commercialeId: finalCommercialeId
      }, userId, userRole);

      if (finalCommercialeId && userRole === 'OPERATORE') {
        const currentUser = await tx.user.findUnique({ where: { id: userId } });
        await tx.notification.create({
          data: {
            userId: finalCommercialeId,
            title: "Nuovo Appuntamento",
            message: `L'operatore ${currentUser?.name || 'Operatore'} ha fissato un appuntamento per il ${new Date(params.date).toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "short", timeStyle: "short" })}. Referente: ${params.referentName}.`,
            contactId: st.contactId,
            appointmentId: appt.id
          }
        });
      }


      return appt;
    });
  }

  async rescheduleAppointment(
    trattativaId: string,
    appointmentId: string,
    params: { newDate: string; zoneAgendaId?: string },
    userId: string,
    userRole: Role
  ) {
    this.validateRole(userRole, 'rescheduleAppointment');

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      
      const appt = await tx.trattativaAppointment.findUnique({ where: { id: appointmentId } });
      if (!appt) throw new NotFoundError("Appuntamento non trovato");
      
      if (isAppointmentTerminalState(appt.status)) {
        throw new ValidationError("Impossibile modificare un appuntamento in stato terminale.");
      }

      const nextCount = await tx.trattativaAppointment.count({ where: { previousAppointmentId: appointmentId } });
      if (nextCount > 0) {
        throw new ValidationError("Impossibile rifissare: questo appuntamento ha già generato una ri-fissazione.");
      }

      await tx.trattativaAppointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentState.RIFISSATO }
      });

      const newAppt = await tx.trattativaAppointment.create({
        data: {
          trattativaId,
          date: new Date(params.newDate),
          isPhoneAppt: appt.isPhoneAppt,
          zoneAgendaId: params.zoneAgendaId || appt.zoneAgendaId,
          commercialeId: appt.commercialeId,
          status: AppointmentState.FISSATO,
          rescheduleCount: appt.rescheduleCount + 1,
          previousAppointmentId: appt.id
        }
      });

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          currentAppointmentId: newAppt.id,
          nextActionDate: newAppt.date,
          version: { increment: 1 }
        }
      });

      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      const rescheduleDesc = `Appuntamento rifissato al ${new Date(params.newDate).toLocaleString("it-IT", { timeZone: "Europe/Rome", dateStyle: "short", timeStyle: "short" })}` + (params.notes ? `\nNote: ${params.notes}` : "");
      await this.appendEvent(tx, trattativaId, "APPUNTAMENTO_RIFISSATO", rescheduleDesc, {
        oldDate: appt.date.toISOString(),
        newDate: params.newDate,
        rescheduleCount: appt.rescheduleCount + 1
      }, userId, userRole);

      return newAppt;
    });
  }

  async submitOutcome(
    trattativaId: string,
    appointmentId: string,
    params: { outcomeFinal: any; outcomeNotes: string; nextActionType?: NextActionType; nextActionDate?: string },
    userId: string,
    userRole: Role
  ) {
    this.validateRole(userRole, 'submitOutcome');

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      
      const appt = await tx.trattativaAppointment.findUnique({ where: { id: appointmentId } });
      if (!appt) throw new NotFoundError("Appuntamento non trovato");
      if (isAppointmentTerminalState(appt.status)) throw new ValidationError("Appuntamento già in stato terminale");

      await tx.trattativaAppointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentState.SVOLTO_ESITATO }
      });

      let nextStStatus: TrattativaStatus = TrattativaStatus.TRATTATIVA_IN_CORSO;
      if (params.nextActionType === NextActionType.PREVENTIVO) nextStStatus = TrattativaStatus.PREVENTIVO;
      
      let dbOutcomeFinal = params.outcomeFinal;
      if (dbOutcomeFinal === 'TRATTATIVA_IN_CORSO') dbOutcomeFinal = null;

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          status: nextStStatus,
          outcomeFinal: dbOutcomeFinal,
          outcomeNotes: params.outcomeNotes,
          nextActionType: params.nextActionType || NextActionType.NONE,
          nextActionDate: params.nextActionDate ? new Date(params.nextActionDate) : null,
          currentAppointmentId: null,
          version: { increment: 1 }
        }
      });

      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      await this.appendEvent(tx, trattativaId, "ESITO_INSERITO", "Esito inserito", {
        outcomeFinal: params.outcomeFinal,
        nextActionType: params.nextActionType,
        nextActionDate: params.nextActionDate,
        notes: params.outcomeNotes
      }, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }

  async closeLost(trattativaId: string, params: { outcomeNotes?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'closeLost');

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Trattativa già chiusa");

      if (!validateTrattativaTransition(st.status, TrattativaStatus.CHIUSA_PERSA)) {
         if (st.status !== TrattativaStatus.RICHIAMO_PERSONALE) {
             throw new ValidationError(`Transizione non valida da ${st.status} a CHIUSA_PERSA`);
         }
      }

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          status: TrattativaStatus.CHIUSA_PERSA,
          closedAt: new Date(),
          outcomeNotes: params.outcomeNotes || st.outcomeNotes,
          currentAppointmentId: null,
          nextActionType: NextActionType.NONE,
          nextActionDate: null,
          version: { increment: 1 }
        }
      });

      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      if (st.currentAppointmentId) {
        await tx.trattativaAppointment.update({
          where: { id: st.currentAppointmentId },
          data: { status: AppointmentState.ANNULLATO }
        });
      }

      await this.appendEvent(tx, trattativaId, "KO_DEFINITIVO", "KO Definitivo inserito", {
        outcomeNotes: params.outcomeNotes
      }, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }
  
  async reopen(trattativaId: string, params: { operatorId?: string; commercialeId?: string; reason: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'reopen');

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt === null) throw new ValidationError("La trattativa è già aperta");
      
      if (st.status === TrattativaStatus.CHIUSA_VINTA && userRole !== Role.TEAM_LEADER) {
        throw new ForbiddenError("Solo un TL o ADMIN può riaprire una Trattativa Vinta");
      }

      if (st.status === TrattativaStatus.CHIUSA_PERSA) {
        const activeKo = await tx.koRecord.findFirst({
          where: { contactId: st.contactId, isResolved: false, frozenUntil: { gt: new Date() } }
        });
        if (activeKo) {
          throw new ValidationError("Impossibile riaprire: KoRecord attivo.");
        }
      }

      if (!params.operatorId && !params.commercialeId) {
         throw new ValidationError("Riapertura richiede almeno l'assegnazione di un Operatore o Commerciale.");
      }

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          status: TrattativaStatus.RICHIAMO_PERSONALE,
          closedAt: null,
          outcomeFinal: null,
          outcomeNotes: null,
          derogaStatus: DerogaStatus.NONE,
          nextActionType: NextActionType.NONE,
          nextActionDate: null,
          currentAppointmentId: null,
          currentOperatorId: params.operatorId || null,
          currentCommercialeId: params.commercialeId || null,
          version: { increment: 1 }
        }
      });

      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      await this.appendEvent(tx, trattativaId, "RIAPERTA", "Trattativa riaperta esplicitamente", {
        previousStatus: st.status,
        previousClosedAt: st.closedAt.toISOString(),
        reason: params.reason,
        operatorId: params.operatorId || 'N/A',
        commercialeId: params.commercialeId
      }, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }

  async requestDeroga(trattativaId: string, params: { requestedDate: string; notes?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'requestDeroga');
    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt) throw new ValidationError("Trattativa chiusa");
      if (st.derogaStatus === "PENDING") throw new ValidationError("Deroga già in attesa");

      
      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          derogaStatus: "PENDING",
          nextActionType: "APPROVAZIONE_TL",
          nextActionDate: new Date(params.requestedDate),
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      await this.appendEvent(tx, trattativaId, "DEROGA_RICHIESTA", "Richiesta deroga", {
        requestedDate: params.requestedDate,
        notes: params.notes
      }, userId, userRole);

      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const tls = await tx.user.findMany({ where: { role: "TEAM_LEADER" } });
      for (const tl of tls) {
        await tx.notification.create({
          data: {
            userId: tl.id,
            title: "Richiesta Deroga Appuntamento",
            message: `L'operatore ${currentUser?.name || 'Operatore'} ha richiesto una deroga per la data ${new Date(params.requestedDate).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}`,
            contactId: st.contactId
          }
        });
      }


      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }

  async addNote(trattativaId: string, params: { note: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'addNote');
    return prisma.$transaction(async (tx) => {
      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Nota", { note: params.note }, userId, userRole);
      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }
  
  async recordMissedCall(trattativaId: string, params: { recallDate: string; notes: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen');
    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Trattativa chiusa");

      const newCount = st.missedCallCount + 1;
      
      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          nextActionDate: new Date(params.recallDate),
          missedCallCount: newCount,
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const userName = currentUser?.name || 'Operatore';
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const timeStr = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
      const targetDate = new Date(params.recallDate);
      const targetDateStr = targetDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const targetTimeStr = targetDate.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });

      const eventDesc = `Il giorno ${dateStr} alle ore ${timeStr} l'operatore ${userName} ha tentato di contattare il cliente senza successo. Prossimo tentativo fissato per il ${targetDateStr} alle ${targetTimeStr}. Nota operatore: ${params.notes}. Tentativi totali senza risposta: ${newCount}`;

      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", eventDesc, {}, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }

  async postponeRecall(trattativaId: string, params: { recallDate: string; notes: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen');
    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Trattativa chiusa");

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          nextActionDate: new Date(params.recallDate),
          missedCallCount: 0,
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const userName = currentUser?.name || 'Operatore';
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const timeStr = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
      const targetDate = new Date(params.recallDate);
      const targetDateStr = targetDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const targetTimeStr = targetDate.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });

      const eventDesc = `Il giorno ${dateStr} alle ore ${timeStr} l'operatore ${userName} ha contattato il cliente. Il cliente ha chiesto di essere ricontattato il ${targetDateStr} alle ${targetTimeStr}. Nota operatore: ${params.notes}`;

      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", eventDesc, {}, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }

  async setRichiamo(trattativaId: string, params: { recallDate: string; notes?: string; commercialeId?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen'); // Or any other suitable permission
    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Trattativa chiusa");

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          nextActionType: params.commercialeId ? "NONE" : "RICHIAMO",
          nextActionDate: new Date(params.recallDate),
          ...(params.commercialeId ? { currentCommercialeId: params.commercialeId } : {}),
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      const now = new Date();
      const dateStr = now.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const timeStr = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
      const targetDate = new Date(params.recallDate);
      const targetDateStr = targetDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const targetTimeStr = targetDate.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
      
      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const userName = currentUser?.name || 'Operatore';

      const eventDesc = params.commercialeId 
        ? `Il giorno ${dateStr} alle ore ${timeStr} l'operatore ${userName} chiede ricontatto da parte del commerciale per il giorno ${targetDateStr} alle ore ${targetTimeStr}, note: ${params.notes || ''}`
        : `Richiamo impostato`;

      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", eventDesc, {
          ...(params.commercialeId ? {} : { note: `Data richiamo: ${params.recallDate}. Note: ${params.notes || ''}` })
        }, userId, userRole);

        if (params.commercialeId) {
          await tx.notification.create({
            data: {
              userId: params.commercialeId,
              title: "NUOVO CONTATTO ASSEGNATO",
              message: `L'operatore ti ha assegnato un nuovo contatto da chiamare in data ${new Date(params.recallDate).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}`, contactId: st.contactId
            }
          });
        }

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }
  async completePreventivo(trattativaId: string, params: { url: string; notes?: string; nextActionDate?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen'); // Or any suitable permission (TL)
    if (userRole !== Role.TEAM_LEADER ) {
        throw new ForbiddenError("Solo il Team Leader può caricare preventivi");
    }

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Trattativa chiusa");

      await tx.trattativaAttachment.create({
        data: {
          trattativaId,
          url: params.url,
          type: "PREVENTIVO", filename: "preventivo.pdf", uploadedById: userId
        }
      });

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          status: TrattativaStatus.TRATTATIVA_IN_CORSO, // Torna al commerciale
          nextActionType: NextActionType.NONE, // Or RICHIAMO_COMMERCIALE if available, wait, NextActionType has NONE
          nextActionDate: params.nextActionDate ? new Date(params.nextActionDate) : null,
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Preventivo caricato dal TL", {
        note: `URL Preventivo: ${params.url}. Note TL: ${params.notes || ''}`
      }, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }
  async resolveDeroga(trattativaId: string, params: { approved: boolean; newDate?: string; rejectReason?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen'); // Admin/TL
    if (userRole !== Role.TEAM_LEADER ) {
        throw new ForbiddenError("Solo il Team Leader può risolvere le deroghe");
    }

    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.derogaStatus !== DerogaStatus.PENDING) throw new ValidationError("Nessuna deroga in attesa");

      if (params.approved) {
        // Approvata
        const updated = await tx.trattativaSheet.updateMany({
          where: { id: trattativaId, version: st.version },
          data: {
            derogaStatus: DerogaStatus.APPROVED,
            nextActionType: NextActionType.APPUNTAMENTO,
            nextActionDate: params.newDate ? new Date(params.newDate) : st.nextActionDate,
            version: { increment: 1 }
          }
        });
        if (updated.count === 0) throw new ConflictError("Conflitto di versione");

        // Fissiamo l'appuntamento effettivo? (Oppure lo crea già il commerciale e resta in PENDING?)
        // Per semplicità, in FASE 6 lasciamo lo status in APPUNTAMENTO e lo loggiamo, e creiamo il record Appt.
        await tx.trattativaAppointment.create({
          data: {
            trattativaId,
            date: params.newDate ? new Date(params.newDate) : (st.nextActionDate || new Date()),
            isPhoneAppt: true, // E.g. forced phone if deroga
            commercialeId: st.currentCommercialeId || undefined,
            status: AppointmentState.FISSATO
          }
        });

        await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Deroga approvata dal TL", { note: `Data: ${params.newDate || st.nextActionDate}` }, userId, userRole);
      } else {
        // Rifiutata
        const updated = await tx.trattativaSheet.updateMany({
          where: { id: trattativaId, version: st.version },
          data: {
            derogaStatus: DerogaStatus.REJECTED,
            nextActionType: NextActionType.NONE,
            nextActionDate: null,
            version: { increment: 1 }
          }
        });
        if (updated.count === 0) throw new ConflictError("Conflitto di versione");

        await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Deroga rifiutata dal TL", { note: `Motivo: ${params.rejectReason}` }, userId, userRole);
      }

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }
}




