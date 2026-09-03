# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/appointments/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''    // 1. Controlla se il contatto esiste ed  disponibile
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });'''
replacement = '''    // 1. Controlla se il contatto esiste ed  disponibile
    const contact = await prisma.contact.findUnique({ where: { id: contactId }, include: { assignedTo: true } });'''
code = code.replace(target, replacement)

target2 = '''      return appt;
    });'''
replacement2 = '''      // Notifica il commerciale se il contatto era assegnato a lui
      if (contact.assignedTo?.role === "COMMERCIALE" && role === "OPERATORE") {
        await tx.notification.create({
          data: {
            userId: contact.assignedToId,
            title: "Richiamo Lavorato",
            message: `L'operatore ${userName} ha fissato un appuntamento per il tuo richiamo "${contact.name}".`,
            appointmentId: appt.id,
            contactId: contact.id
          }
        });
      }

      return appt;
    });'''
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")