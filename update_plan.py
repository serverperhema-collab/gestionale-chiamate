import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\brain\\a14be8b9-cb56-465f-b3ba-67a6167bb489\\implementation_plan.md'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''| ST chiusa CHIUSA_VINTA | ✅ Sì — torna disponibile |'''
repl1 = '''| ST chiusa CHIUSA_VINTA (Contratto Firmato) | ❌ No — blocco perenne (sbloccabile solo da TL) |'''
code = code.replace(target1, repl1)

target2 = '''ESITO: CONTRATTO FIRMATO
  ST.status = CHIUSA_VINTA
  ST.outcomeFinal = VENDUTO
  ST.contractUrl = file allegati
  ST.closedAt = now()  ← ST chiusa
  TrattativaEvent { CONTRATTO_FIRMATO }
  Contact torna disponibile nel calderone'''
repl2 = '''ESITO: CONTRATTO FIRMATO
  ST.status = CHIUSA_VINTA
  ST.outcomeFinal = VENDUTO
  ST.contractUrl = file allegati
  ST.closedAt = now()  ← ST chiusa
  TrattativaEvent { CONTRATTO_FIRMATO }
  Contact bloccato perennemente (visibile solo alla TL)'''
code = code.replace(target2, repl2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")