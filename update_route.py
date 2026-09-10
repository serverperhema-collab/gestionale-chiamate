import re

with open('src/app/api/tl/wizard-trattativa/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace body destruct
content = content.replace(
    'preventivoFile, contrattoFile\n    } = body;',
    'preventivoFile, contrattoFile, actionMode\n    } = body;'
)

# Replace IN_CORSO logic
old_logic = '''      // ---- SET STATUS E NEXT ACTION ----
      if (flow === "IN_CORSO") {
        if (!nextActionDate || !nextActionTime || !nextActionTo) {
          throw new Error("Dati di pianificazione mancanti per la trattativa in corso");
        }
        nextDateObj = nextActionIso ? new Date(nextActionIso) : null;
        
        // Se la prossima azione è del commerciale, in corso.
        // Se è dell'operatore e ha l'appuntamento, APPUNTAMENTO, se no RICHIAMO_PERSONALE
        if (nextActionTo === "COMMERCIALE") {
            trattativaStatus = "TRATTATIVA_IN_CORSO";
            if (!commercialeId) throw new Error("Seleziona un Commerciale dal menu a tendina.");
        } else {
            trattativaStatus = appuntamentoSvolto ? "APPUNTAMENTO" : "RICHIAMO_PERSONALE";
        }
        nextActionType = "RICHIAMO";

      }'''

new_logic = '''      // ---- SET STATUS E NEXT ACTION ----
      if (flow === "IN_CORSO") {
        if (actionMode === "APPUNTAMENTO_PENDING") {
          trattativaStatus = "TRATTATIVA_IN_CORSO";
          nextActionType = "APPUNTAMENTO";
        } else {
          if (!nextActionDate || !nextActionTime || !nextActionTo) {
            throw new Error("Dati di pianificazione mancanti per la trattativa in corso");
          }
          nextDateObj = nextActionIso ? new Date(nextActionIso) : null;
          
          if (nextActionTo === "COMMERCIALE") {
              trattativaStatus = "TRATTATIVA_IN_CORSO";
              if (!commercialeId) throw new Error("Seleziona un Commerciale dal menu a tendina.");
          } else {
              trattativaStatus = appuntamentoSvolto ? "APPUNTAMENTO" : "RICHIAMO_PERSONALE";
          }
          nextActionType = "RICHIAMO";
        }
      }'''

# Handle the encoding issue in old_logic by using regex
content = re.sub(
    r'// ---- SET STATUS E NEXT ACTION ----\s*if \(flow === "IN_CORSO"\) \{.*?\n\s*\} else if',
    new_logic + ' else if',
    content,
    flags=re.DOTALL
)

# Fix Log 2
content = content.replace(
    'if (flow === "IN_CORSO") {\n        await tx.trattativaEvent.create({',
    'if (flow === "IN_CORSO" && actionMode !== "APPUNTAMENTO_PENDING") {\n        await tx.trattativaEvent.create({'
)

with open('src/app/api/tl/wizard-trattativa/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)