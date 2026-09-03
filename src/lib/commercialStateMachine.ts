import { CommercialStatus } from "@prisma/client";

// Definisce le transizioni valide per il workflow commerciale
const VALID_TRANSITIONS: Record<CommercialStatus, CommercialStatus[]> = {
  [CommercialStatus.ASSEGNATO]: [
    CommercialStatus.VISITATO,
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.KO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],
  [CommercialStatus.VISITATO]: [
    CommercialStatus.VISITATO,
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.KO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],
  [CommercialStatus.FOLLOW_UP]: [
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.VISITATO,
    CommercialStatus.KO,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],
  [CommercialStatus.PREVENTIVO_IN_CORSO]: [
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.KO,
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.VISITATO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],
  [CommercialStatus.VENDUTO]: [], // Stato terminale
  [CommercialStatus.KO]: [],      // Stato terminale
  [CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE]: [CommercialStatus.ASSEGNATO],
  [CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO]: [CommercialStatus.KO, CommercialStatus.ASSEGNATO],
  [CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE]: [CommercialStatus.ASSEGNATO],
  [CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO]: [CommercialStatus.KO, CommercialStatus.ASSEGNATO]
};

/**
 * Valida la transizione di stato commerciale.
 * Se from è null, significa che è un nuovo appuntamento commerciale (inizia virtualmente con ASSEGNATO).
 */
export function validateCommercialTransition(from: CommercialStatus | null, to: CommercialStatus): boolean {
  if (!from) {
    return to === CommercialStatus.ASSEGNATO || VALID_TRANSITIONS[CommercialStatus.ASSEGNATO]?.includes(to);
  }
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
