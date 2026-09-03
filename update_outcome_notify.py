# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = r'const contact = await prisma\.contact\.findUnique\(\{ where: \{ id: id \} \}\);'
replacement1 = 'const contact = await prisma.contact.findUnique({ where: { id: id }, include: { assignedTo: true } });'
code = re.sub(target1, replacement1, code)

target2 = '''    const transaction = [];'''
replacement2 = '''    const transaction = [];
    const role = (session.user as any).role;
    const userName = (session.user as any).name || "Operatore";
    if (contact.assignedTo?.role === "COMMERCIALE" && role === "OPERATORE") {
      transaction.push(prisma.notification.create({
        data: {
          userId: contact.assignedToId!,
          title: "Richiamo Lavorato (Esito)",
          message: `L'operatore ${userName} ha lavorato il tuo richiamo "${contact.name}". Nuovo esito: ${outcome}.`,
          contactId: contact.id
        }
      }));
    }'''
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")