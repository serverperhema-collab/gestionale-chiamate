import sys

path = 'src/app/api/contacts/[id]/details/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('action: { not: "PESCATO DAL CALDERONE" }', 'action: { notIn: ["PESCATO DAL CALDERONE", "CONTACT_EXTRACTED"] }')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
