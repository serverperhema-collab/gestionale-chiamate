import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

methods = """
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
}
"""

content = content.replace("}\n", methods)
# Note: since the file ends with }\n, we replace the LAST } with the methods + }
# It's better to just use regex or rsplit.
import re
content = re.sub(r'}\s*$', methods, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)