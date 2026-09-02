import sys

path = 'src/app/api/tl/appointments/historical/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('notes: "Appuntamento Storico inserito manualmente dalla TL",', '')
code = code.replace('resolved: false', 'isResolved: false')
code = code.replace('resolved: true', 'isResolved: true')
code = code.replace('decision: "REJECT", tlNotes: "Chiusa automaticamente: segnato come App. Storico"', 'isApproved: false, resolvedAt: new Date()')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
