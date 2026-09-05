import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

method = """  async resolveDeroga(trattativaId: string, params: { approved: boolean; newDate?: string; rejectReason?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen'); // Admin/TL
    if (userRole !== Role.TEAM_LEADER && userRole !== Role.ADMIN) {
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
"""

content = re.sub(r'}\s*$', method, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)