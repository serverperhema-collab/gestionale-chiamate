import re
path = "src/app/api/tl/backup/hidden-contacts/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'"ID,Nome,CAP,Indirizzo,Telefono Originale,HiddenUntil,isKo,Operatore,Motivazione,Note\\n"', '"ID,Nome,CAP,Indirizzo,Telefono Originale,Scadenza Blocco,isKo,Operatore,Motivazione,Note\\n"', content)
content = re.sub(r'const hiddenUntilStr = c\.hiddenUntil \? c\.hiddenUntil\.toISOString\(\) : "";', 'const hiddenUntilStr = c.hiddenUntil ? new Date(c.hiddenUntil).toLocaleString("it-IT") : "";', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)