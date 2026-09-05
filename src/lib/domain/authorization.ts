import { Role } from '@prisma/client';

export type TrattativaAction =
  | 'createOrReopen'
  | 'setRecall'
  | 'scheduleAppointment'
  | 'confirmAppointment'
  | 'rescheduleAppointment'
  | 'cancelAppointment'
  | 'markAppointmentDone'
  | 'submitOutcome'
  | 'requestDeroga'
  | 'resolveDeroga'
  | 'requestQuote'
  | 'completeQuote'
  | 'closeWon'
  | 'closeLost'
  | 'reopen'
  | 'reassign'
  | 'patchData'
  | 'addNote';

export const ROLE_ACTIONS: Record<string, TrattativaAction[]> = {
  OPERATORE: [
    'createOrReopen',
    'setRecall',
    'scheduleAppointment',
    'patchData',
    'addNote',
  ],
  COMMERCIALE: [
    'scheduleAppointment',
    'markAppointmentDone',
    'submitOutcome',
    'requestDeroga',
    'requestQuote',
    'closeWon',
    'closeLost',
    'patchData',
    'addNote',
  ],
  TEAM_LEADER: [
    'createOrReopen',
    'setRecall',
    'scheduleAppointment',
    'confirmAppointment',
    'rescheduleAppointment',
    'cancelAppointment',
    'markAppointmentDone',
    'submitOutcome',
    'requestDeroga',
    'resolveDeroga',
    'requestQuote',
    'completeQuote',
    'closeWon',
    'closeLost',
    'reopen',
    'reassign',
    'patchData',
    'addNote',
  ],
};

export function canPerformAction(role: Role, action: TrattativaAction): boolean {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}