import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\brain\\a14be8b9-cb56-465f-b3ba-67a6167bb489\\implementation_plan.md'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Aggiorno FASE 5
target_fase5 = '''### FASE 5 — Frontend TL

**[MODIFY]** `src/app/tl-dashboard/appointments/page.tsx`'''
repl_fase5 = '''### FASE 5 — Frontend TL

**[NEW]** Apertura Diretta Trattativa da Database (TL)
- Inserimento pulsante "Apri Trattativa" vicino ad ogni contatto nel Database TL (`src/app/tl-dashboard/settings/contacts/page.tsx`).
- Permette alla TL di creare/aprire forzatamente una Scheda Trattativa bypassando il calderone degli operatori.

**[MODIFY]** `src/app/tl-dashboard/appointments/page.tsx`'''
code = code.replace(target_fase5, repl_fase5)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")