import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_metadata = """      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Richiamo impostato", {
        recallDate: params.recallDate,
        notes: params.notes
      }, userId, userRole);"""

good_metadata = """      await this.appendEvent(tx, trattativaId, "NOTA_AGGIUNTA", "Richiamo impostato", {
        note: `Data richiamo: ${params.recallDate}. Note: ${params.notes || ''}`
      }, userId, userRole);"""

content = content.replace(bad_metadata, good_metadata)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)