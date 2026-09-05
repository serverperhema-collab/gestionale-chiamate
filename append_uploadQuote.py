import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

method = """  async uploadQuote(trattativaId: string, params: { url: string; notes?: string; nextActionDate?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen'); // Or any suitable permission (TL)
    if (userRole !== Role.TEAM_LEADER && userRole !== Role.ADMIN) {
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
          fileType: "PREVENTIVO"
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
}
"""

content = re.sub(r'}\s*$', method, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)