import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix resolveDeroga REJECTED
bad_reject = """          // Rifiutata
          const updated = await tx.trattativaSheet.updateMany({
            where: { id: trattativaId, version: st.version },
            data: {
              derogaStatus: DerogaStatus.REJECTED,
              nextActionType: NextActionType.NONE,
              nextActionDate: null,
              version: { increment: 1 }
            }
          });"""

good_reject = """          // Rifiutata
          const updated = await tx.trattativaSheet.updateMany({
            where: { id: trattativaId, version: st.version },
            data: {
              status: TrattativaStatus.TRATTATIVA_IN_CORSO,
              derogaStatus: DerogaStatus.REJECTED,
              nextActionType: NextActionType.NONE,
              nextActionDate: null,
              version: { increment: 1 }
            }
          });"""
content = content.replace(bad_reject, good_reject)

# Fix uploadQuote -> completePreventivo
content = content.replace("uploadQuote(trattativaId", "completePreventivo(trattativaId")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)