import { prisma } from '@/lib/prisma';
import { TrattativaStatus } from '@prisma/client';

export class CalderoneService {
  async isContactAvailableInCalderone(contactId: string): Promise<boolean> {
    const stCount = await prisma.trattativaSheet.count({
      where: {
        contactId,
        closedAt: null, // Aperta
      }
    });
    if (stCount > 0) return false;

    const vintaCount = await prisma.trattativaSheet.count({
      where: {
        contactId,
        status: TrattativaStatus.CHIUSA_VINTA
      }
    });
    if (vintaCount > 0) return false;

    const activeKoCount = await prisma.koRecord.count({
      where: {
        contactId,
        isResolved: false,
        frozenUntil: { gt: new Date() }
      }
    });
    if (activeKoCount > 0) return false;

    // Aggiungere logica legacy (e.g. blacklisted) o se esiste DeletionRequest non approvata
    return true;
  }

  async getAvailableContactsForCalderone(): Promise<any[]> {
    // Implementazione grezza, da perfezionare in fase di query
    return prisma.$queryRaw`
      SELECT c.* FROM "Contact" c
      WHERE NOT EXISTS (
        SELECT 1 FROM "TrattativaSheet" st
        WHERE st."contactId" = c.id
          AND st."closedAt" IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM "KoRecord" ko
        WHERE ko."contactId" = c.id
          AND ko."isResolved" = false
          AND ko."frozenUntil" > NOW()
      )
      AND NOT EXISTS (
        SELECT 1 FROM "TrattativaSheet" st2
        WHERE st2."contactId" = c.id
          AND st2."status" = 'CHIUSA_VINTA'
      )
    `;
  }
}