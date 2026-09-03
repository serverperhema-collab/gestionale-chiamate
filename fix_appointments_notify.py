# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/api/appointments/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = r'const contact = await prisma\.contact\.findUnique\(\{ where: \{ id: contactId \} \}\);'
replacement1 = 'const contact = await prisma.contact.findUnique({ where: { id: contactId }, include: { assignedTo: true } });'
code = re.sub(target1, replacement1, code)

target2 = 'userId: contact.assignedToId,'
replacement2 = 'userId: contact.assignedToId!,'
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")