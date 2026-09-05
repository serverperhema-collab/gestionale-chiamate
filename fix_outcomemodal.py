import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\components\\OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("trattativaId: string;", "trattativaId?: string;")
content = content.replace("export default function OutcomeModal({ appointmentId, trattativaId, onClose, onSuccess }: OutcomeModalProps) {", "export default function OutcomeModal({ appointmentId, trattativaId, onClose, onSuccess }: OutcomeModalProps) {")

submit_logic_old = """      const res = await fetch(`/api/trattative/${trattativaId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "esito", payload })
      });"""

submit_logic_new = """      let res;
      if (trattativaId) {
        res = await fetch(`/api/trattative/${trattativaId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "esito", payload })
        });
      } else {
        // Fallback al sistema legacy
        res = await fetch(`/api/commerciale/appointments/${appointmentId}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }"""

content = content.replace(submit_logic_old, submit_logic_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)