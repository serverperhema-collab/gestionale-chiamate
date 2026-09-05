import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\operator-terminal\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_submit = """      const res = await fetch(`/api/contacts/${contact.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {"""

new_submit = """      let res;
      let data;

      // FASE 5: Se l'esito è RICHIAMO_PERSONALE, crea/riapre la ST e poi imposta il NextAction
      if (outcome === "RICHIAMO_PERSONALE") {
        // 1. Crea o riapri Trattativa
        const stRes = await fetch("/api/trattative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact.id })
        });
        
        if (!stRes.ok) {
          data = await stRes.json();
          res = stRes;
        } else {
          const stData = await stRes.json();
          const trattativaId = stData.trattativa.id;
          
          // 2. Chiamiamo l'azione per aggiornare lo stato e settare la nextActionDate
          // (per ora possiamo simulare inserendo una nota e settando i campi ST, oppure usare il controller events/actions se implementato).
          // N.B: createOrReopen setta già status=RICHIAMO_PERSONALE e nextActionType=NONE.
          // Se vogliamo settare la data precisa per il richiamo:
          const actionPayload = {
            outcomeFinal: "TRATTATIVA_IN_CORSO", // per mantenere aperta
            outcomeNotes: notes,
            nextActionType: "RICHIAMO",
            nextActionDate: recallDateStr
          };
          
          res = await fetch(`/api/trattative/${trattativaId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "esito", payload: actionPayload })
          });
          data = await res.json();
        }
      } else {
        // Fallback per NO_ANSWER, NOT_AVAILABLE, KO standard (su Contact)
        res = await fetch(`/api/contacts/${contact.id}/outcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      }
      
      if (res.ok) {"""

content = content.replace(legacy_submit, new_submit)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)