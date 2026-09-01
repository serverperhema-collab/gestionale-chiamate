import sys

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """      // 1. Crea il CallLog
      transaction.push(prisma.callLog.create({
        data: {
          userId,
          contactId: id,
          outcome: outcome as CallOutcome,
          notes: notes || null
        }
      }));"""

new_block = """      // 1. Crea il CallLog
      transaction.push(prisma.callLog.create({
        data: {
          userId,
          contactId: id,
          outcome: outcome as CallOutcome,
          notes: notes || null
        }
      }));

      // 1.b Crea l'ActivityLog per farlo apparire nella vista Globale del TL
      // (Escludiamo TRASH_REQUEST perche' lo crea gia' sotto come CONTACT_REVIEW_REQUESTED)
      if (outcome !== "TRASH_REQUEST") {
        transaction.push(prisma.activityLog.create({
          data: {
            userId,
            contactId: id,
            action: "OUTCOME_" + outcome,
            details: notes || "Nessuna nota"
          }
        }));
      }"""

code = code.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
