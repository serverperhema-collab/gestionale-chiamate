import re
path = "src/app/api/contacts/gestione-separata/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()

content = content.replace(
    'if (!session || (session.user as any).role !== "OPERATORE")',
    'if (!session || !["OPERATORE", "TEAM_LEADER"].includes((session.user as any).role))'
)

with open(path, "w", encoding="utf-8") as f: f.write(content)