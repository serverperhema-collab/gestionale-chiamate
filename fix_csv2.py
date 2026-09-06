import re
path = "src/app/api/tl/backup/hidden-contacts/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'"ID,Nome,CAP,Indirizzo,Telefono Originale,Scadenza Blocco,isKo,Operatore,Motivazione,Note\\n"', '"ID,Nome,CAP,Indirizzo,Telefono Originale,Data Blocco,Scadenza Blocco,isKo,Operatore,Motivazione,Note\\n"', content)

old_logic = r'''      const isKoStr = c.isKo \? "SI" : "NO";

      csv \+= `\$\{escapeCsv\(c\.id\)\},\$\{escapeCsv\(c\.name\)\},\$\{escapeCsv\(c\.cap\)\},\$\{escapeCsv\(c\.address\)\},\$\{escapeCsv\(c\.originalPhone\)\},\$\{escapeCsv\(hiddenUntilStr\)\},\$\{escapeCsv\(isKoStr\)\},\$\{escapeCsv\(blockedBy\)\},\$\{escapeCsv\(reason\)\},\$\{escapeCsv\(note\)\}\\n`;'''

new_logic = r'''      const isKoStr = c.isKo ? "SI" : "NO";
      
      let dataBlocco = "";
      if (c.callLogs && c.callLogs.length > 0) {
          dataBlocco = new Date(c.callLogs[0].createdAt).toLocaleString("it-IT");
      } else if (c.activityLogs && c.activityLogs.length > 0) {
          dataBlocco = new Date(c.activityLogs[0].createdAt).toLocaleString("it-IT");
      }

      csv += `${escapeCsv(c.id)},${escapeCsv(c.name)},${escapeCsv(c.cap)},${escapeCsv(c.address)},${escapeCsv(c.originalPhone)},${escapeCsv(dataBlocco)},${escapeCsv(hiddenUntilStr)},${escapeCsv(isKoStr)},${escapeCsv(blockedBy)},${escapeCsv(reason)},${escapeCsv(note)}\n`;'''

content = re.sub(old_logic, new_logic, content)
with open(path, "w", encoding="utf-8") as f: f.write(content)