# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''      await prisma.appointment.update({
        where: { id },
        data: { isApproved: true, status: "CONFIRMED" }
      });'''
replacement1 = '''      const appt = await prisma.appointment.update({
        where: { id },
        data: { isApproved: true, status: "CONFIRMED" }
      });
      if (appt.commercialeId) {
        await prisma.notification.create({
          data: {
            userId: appt.commercialeId,
            title: "Deroga Approvata",
            message: `La tua richiesta di appuntamento fuori agenda per il ${new Date(appt.date).toLocaleString('it-IT')} è stata approvata.`,
            appointmentId: appt.id,
            contactId: appt.contactId
          }
        });
      }'''
code = code.replace(target1, replacement1)

target2 = '''          if (appt.commercialeId) {
            await tx.contact.update({
              where: { id: appt.contactId },
              data: {
                assignedToId: appt.commercialeId,
                hiddenUntil: null
              }
            });
          }'''
replacement2 = '''          if (appt.commercialeId) {
            await tx.contact.update({
              where: { id: appt.contactId },
              data: {
                assignedToId: appt.commercialeId,
                hiddenUntil: null
              }
            });
            await tx.notification.create({
              data: {
                userId: appt.commercialeId,
                title: "Deroga Rifiutata",
                message: `La tua richiesta di deroga è stata rifiutata dal TL. Il contatto è tornato nelle tue Trattative In Corso.`,
                contactId: appt.contactId
              }
            });
          }'''
code = code.replace(target2, replacement2)

target3 = '''      await prisma.appointment.update({
        where: { id },
        data: { 
          isApproved: true, 
          status: "CONFIRMED",
          date: new Date(newDate)
        }
      });'''
replacement3 = '''      const appt = await prisma.appointment.update({
        where: { id },
        data: { 
          isApproved: true, 
          status: "CONFIRMED",
          date: new Date(newDate)
        }
      });
      if (appt.commercialeId) {
        await prisma.notification.create({
          data: {
            userId: appt.commercialeId,
            title: "Deroga Spostata e Approvata",
            message: `La tua deroga è stata spostata dal TL al ${new Date(newDate).toLocaleString('it-IT')} e confermata.`,
            appointmentId: appt.id,
            contactId: appt.contactId
          }
        });
      }'''
code = code.replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")