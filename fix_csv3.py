import re
path = "src/app/api/tl/backup/hidden-contacts/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()

# Replace literal newlines inside the csv header
content = content.replace('let csv = "ID,Nome,CAP,Indirizzo,Telefono Originale,Data Blocco,Scadenza Blocco,isKo,Operatore,Motivazione,Note\n";', 'let csv = "ID,Nome,CAP,Indirizzo,Telefono Originale,Data Blocco,Scadenza Blocco,isKo,Operatore,Motivazione,Note\\n";')
content = content.replace('let csv = "ID,Nome,CAP,Indirizzo,Telefono Originale,Scadenza Blocco,isKo,Operatore,Motivazione,Note\n";', 'let csv = "ID,Nome,CAP,Indirizzo,Telefono Originale,Data Blocco,Scadenza Blocco,isKo,Operatore,Motivazione,Note\\n";')

with open(path, "w", encoding="utf-8") as f: f.write(content)