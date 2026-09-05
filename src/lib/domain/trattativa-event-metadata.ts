import { TrattativaStatus, NextActionType } from '@prisma/client';

export type EventMetadataMap = {
  CREATA: { operatorId: string; note?: string };
  RIAPERTA: { previousStatus: TrattativaStatus; previousClosedAt: string; reason: string; operatorId: string; commercialeId?: string };
  RICHIAMO_IMPOSTATO: { date: string; notes?: string };
  RICHIAMO_POSTICIPATO: { oldDate: string; newDate: string };
  APPUNTAMENTO_FISSATO: { date: string; isPhoneAppt: boolean; commercialeId?: string };
  APPUNTAMENTO_CONFERMATO: { date: string };
  APPUNTAMENTO_RIFISSATO: { oldDate: string; newDate: string; rescheduleCount: number };
  APPUNTAMENTO_ANNULLATO: { reason: string };
  APPUNTAMENTO_SALTATO: { reason?: string };
  APPUNTAMENTO_SVOLTO: {};
  ESITO_INSERITO: { outcomeFinal: string; nextActionType?: NextActionType; nextActionDate?: string; notes?: string };
  PREVENTIVO_RICHIESTO: { notes?: string };
  PREVENTIVO_COMPLETATO: { quoteUrl: string };
  DEROGA_RICHIESTA: { requestedDate: string; notes?: string };
  DEROGA_APPROVATA: { newDate?: string };
  DEROGA_RIFIUTATA: { motivazione: string };
  DEROGA_SPOSTATA: { oldDate: string; newDate: string };
  CONTRATTO_FIRMATO: { outcomeNotes?: string };
  KO_DEFINITIVO: { outcomeNotes?: string };
  STANDBY_IMPOSTATO: { reason?: string };
  RIASSEGNATO: { fromOperatorId?: string; toOperatorId?: string; fromCommercialeId?: string; toCommercialeId?: string };
  NOTA_AGGIUNTA: { note: string };
};