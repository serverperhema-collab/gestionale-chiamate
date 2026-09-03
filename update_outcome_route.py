# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/commerciale/appointments/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE") {"""

replacement = """      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "TEAM_LEADER") {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: {
            assignedToId: null,
            hiddenUntil: null,
            reviewRequestedAt: new Date(),
            reviewNote: `Richiamo richiesto dal Commerciale. Data: ${nextActionDate ? new Date(nextActionDate).toLocaleDateString() : 'N/D'}. Note: ${notes}`
          }
        });
      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE") {"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)