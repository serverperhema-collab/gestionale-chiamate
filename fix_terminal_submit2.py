import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\operator-terminal\\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_new_submit = """      // FASE 5: Se l'esito è RICHIAMO_PERSONALE, crea/riapre la ST e poi imposta il NextAction
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
      } else {"""

better_new_submit = """      // FASE 5: Se l'esito è RICHIAMO_PERSONALE, crea/riapre la ST e poi imposta il NextAction
      if (outcome === "RICHIAMO_PERSONALE") {
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
          
          const actionPayload = {
            recallDate: recallDateStr,
            notes: notes
          };
          
          res = await fetch(`/api/trattative/${trattativaId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "richiamo", payload: actionPayload })
          });
          data = await res.json();
        }
      } else {"""

content = content.replace(bad_new_submit, better_new_submit)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)