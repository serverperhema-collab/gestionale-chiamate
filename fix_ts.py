with open('src/app/api/contacts/import/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('source: row.source || "MANUAL"', 'source: (row.source || "MANUAL") as any')
with open('src/app/api/contacts/import/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
