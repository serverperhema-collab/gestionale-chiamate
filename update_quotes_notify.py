# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/quotes/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, quoteRequest: updated });'''
replacement = '''    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: dataToUpdate
    });

    if (status === "COMPLETATO" && updated.commercialeId) {
      await prisma.notification.create({
        data: {
          userId: updated.commercialeId,
          title: "Preventivo Sviluppato",
          message: `Il TL ha completato la tua richiesta di preventivo.`,
          appointmentId: updated.appointmentId
        }
      });
    }

    return NextResponse.json({ success: true, quoteRequest: updated });'''
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")