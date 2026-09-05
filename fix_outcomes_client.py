import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\outcomes\\OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """      {outcomeModalApptId && (
        <OutcomeModal
          appointmentId={outcomeModalApptId}
          onClose={() => setOutcomeModalApptId(null)}"""

good = """      {outcomeModalApptId && (
        <OutcomeModal
          appointmentId={outcomeModalApptId}
          trattativaId={data.find(a => a.id === outcomeModalApptId)?.trattativaId}
          onClose={() => setOutcomeModalApptId(null)}"""

content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)