# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Using regex to replace the entire TRASH_REQUEST block
import re

pattern = re.compile(r'(\} else if \(outcome === "TRASH_REQUEST"\) \{).*?(?=\} else if \(outcome === "REVIEW_REQUEST"\) \{)', re.DOTALL)

replacement = """} else if (outcome === "TRASH_REQUEST") {
        if (user.isTrusted) {
          contactUpdateData.isKo = true;
          contactUpdateData.blacklisted = true;
          contactUpdateData.blacklistReason = notes || "Cestinato da operatore fidato";
          contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni
          
          // Activity log is handled below generically, but we want to specify it's auto-approved
          contactUpdateData.reviewRequestedAt = null;
        } else {
          contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (per sempre finchè TL non sblocca)
          contactUpdateData.reviewRequestedAt = new Date();
          contactUpdateData.reviewNote = `RICHIESTA ELIMINAZIONE: ${notes || "Nessuna motivazione"}`;
          
          eventEmitter.emit("tl-alert", { 
            type: "REVIEW", 
            operatorName: userName, 
            reason: `Richiesta eliminazione contatto da valutare.` 
          });
  
          transaction.push(prisma.deletionRequest.create({
            data: {
              contactId: id,
              operatorId: userId,
              reason: notes || "Nessuna motivazione"
            }
          }));
        }
      """

code = re.sub(pattern, replacement, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)