# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix contact update in REJECT
target1 = '''              data: {
                assignedToId: appt.commercialeId,
                commercialStatus: "FOLLOW_UP",
                hiddenUntil: null
              }'''
replacement1 = '''              data: {
                assignedToId: appt.commercialeId,
                hiddenUntil: null
              }'''
code = code.replace(target1, replacement1)

# Fix contact possibly null
target2 = '''            blacklistReason: contact.reviewNote || "Eliminato dopo revisione TL",'''
replacement2 = '''            blacklistReason: contact?.reviewNote || "Eliminato dopo revisione TL",'''
code = code.replace(target2, replacement2)

target3 = '''            details: `Contatto inserito in Blacklist dopo revisione TL. Motivo: ${contact.reviewNote}`'''
replacement3 = '''            details: `Contatto inserito in Blacklist dopo revisione TL. Motivo: ${contact?.reviewNote || "N/A"}`'''
code = code.replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")