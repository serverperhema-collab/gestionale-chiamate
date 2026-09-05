import { TrattativaStatus } from '@prisma/client';

export const VALID_TRATTATIVA_TRANSITIONS: Record<TrattativaStatus, TrattativaStatus[]> = {
  RICHIAMO_PERSONALE: [TrattativaStatus.APPUNTAMENTO, TrattativaStatus.CHIUSA_PERSA],
  APPUNTAMENTO: [
    TrattativaStatus.TRATTATIVA_IN_CORSO,
    TrattativaStatus.PREVENTIVO,
    TrattativaStatus.SOSPESA,
    TrattativaStatus.CHIUSA_VINTA,
    TrattativaStatus.CHIUSA_PERSA,
  ],
  TRATTATIVA_IN_CORSO: [
    TrattativaStatus.APPUNTAMENTO,
    TrattativaStatus.PREVENTIVO,
    TrattativaStatus.SOSPESA,
    TrattativaStatus.CHIUSA_VINTA,
    TrattativaStatus.CHIUSA_PERSA,
  ],
  PREVENTIVO: [
    TrattativaStatus.TRATTATIVA_IN_CORSO,
    TrattativaStatus.APPUNTAMENTO,
    TrattativaStatus.CHIUSA_VINTA,
    TrattativaStatus.CHIUSA_PERSA,
  ],
  SOSPESA: [
    TrattativaStatus.RICHIAMO_PERSONALE,
    TrattativaStatus.APPUNTAMENTO,
    TrattativaStatus.CHIUSA_PERSA,
  ],
  CHIUSA_VINTA: [],
  CHIUSA_PERSA: [],
};

export function validateTrattativaTransition(from: TrattativaStatus, to: TrattativaStatus): boolean {
  if (from === to) return true;
  return VALID_TRATTATIVA_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTrattativaClosedStatus(status: TrattativaStatus): boolean {
  return status === TrattativaStatus.CHIUSA_VINTA || status === TrattativaStatus.CHIUSA_PERSA;
}