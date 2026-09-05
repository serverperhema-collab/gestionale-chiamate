import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

methods = """  async setRichiamo(trattativaId: string, params: { recallDate: string; notes?: string }, userId: string, userRole: Role) {
    this.validateRole(userRole, 'createOrReopen'); // Or any other suitable permission
    return prisma.$transaction(async (tx) => {
      const st = await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
      if (!st) throw new NotFoundError("Trattativa non trovata");
      if (st.closedAt !== null) throw new ValidationError("Trattativa chiusa");

      const updated = await tx.trattativaSheet.updateMany({
        where: { id: trattativaId, version: st.version },
        data: {
          nextActionType: NextActionType.RICHIAMO,
          nextActionDate: new Date(params.recallDate),
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) throw new ConflictError("Conflitto di versione");

      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Richiamo impostato", {
        recallDate: params.recallDate,
        notes: params.notes
      }, userId, userRole);

      return await tx.trattativaSheet.findUnique({ where: { id: trattativaId } });
    });
  }
}
"""

content = re.sub(r'}\s*$', methods, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)