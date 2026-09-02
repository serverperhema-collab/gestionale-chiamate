import sys

path = 'src/app/api/commerciale/appointments/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE") {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { hiddenUntil: new Date(nextActionDate), assignedToId: null }
        });
      }"""

new_block = """      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE") {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { hiddenUntil: new Date(nextActionDate), assignedToId: null }
        });
        
        // FIX: Crea un nuovo record Appuntamento in stato DA_GESTIRE_COMMERCIALE
        // in modo che appaia nella tab "Da Gestire" del Commerciale!
        await tx.appointment.create({
          data: {
            contactId: appointment.contactId,
            operatorId: appointment.operatorId,
            commercialeId: commercialeId,
            date: new Date(nextActionDate),
            status: "DA_GESTIRE_COMMERCIALE",
            commercialStatus: "NUOVO",
            notes: "Richiamo Personale generato da precedente esito."
          }
        });
      }"""

code = code.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
