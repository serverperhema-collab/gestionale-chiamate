import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\scripts\\export_hidden_contacts.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("c.koRecords[0].reason", "'Non specificato'")
content = content.replace("${c.province}", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)