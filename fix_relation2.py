import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = "koRecords    KoRecord[]"
replacement = "koRecords    KoRecord[]\n  gestioneSeparataRequest GestioneSeparataRequest?"
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
