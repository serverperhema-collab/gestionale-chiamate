import { AppointmentState } from '@prisma/client';

export const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentState, AppointmentState[]> = {
  FISSATO: [
    AppointmentState.CONFERMATO,
    AppointmentState.RIFISSATO,
    AppointmentState.ANNULLATO,
    AppointmentState.SALTATO,
  ],
  CONFERMATO: [
    AppointmentState.SVOLTO_DA_ESITARE,
    AppointmentState.RIFISSATO,
    AppointmentState.ANNULLATO,
    AppointmentState.SALTATO,
  ],
  SVOLTO_DA_ESITARE: [AppointmentState.SVOLTO_ESITATO],
  SVOLTO_ESITATO: [],
  SALTATO: [],
  RIFISSATO: [],
  ANNULLATO: [],
};

export function validateAppointmentTransition(from: AppointmentState, to: AppointmentState): boolean {
  if (from === to) return true;
  return VALID_APPOINTMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isAppointmentTerminalState(state: AppointmentState): boolean {
  return ([
    AppointmentState.SVOLTO_ESITATO,
    AppointmentState.SALTATO,
    AppointmentState.RIFISSATO,
    AppointmentState.ANNULLATO,
  ] as AppointmentState[]).includes(state);
}