import re
path = "src/app/api/contacts/next/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()

content = content.replace("trattativaSheet: null", "trattativa: null")
content = content.replace("trattativaSheet: {", "trattativa: {")

with open(path, "w", encoding="utf-8") as f: f.write(content)