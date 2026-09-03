import sys

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''    const body = await req.json();
    const { id, action, newDate } = body;'''
repl1 = '''    const body = await req.json();
    const { id, action, newDate, rejectReason } = body;'''
code = code.replace(target1, repl1)

target2 = '''            if (appt.commercialeId) {
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
repl2 = '''            if (appt.commercialeId) {
              await tx.contact.update({
                where: { id: appt.contactId },
                data: {
                  assignedToId: appt.commercialeId,
                  hiddenUntil: null
                }
              });
              const msg = rejectReason 
                ? `La tua richiesta di deroga è stata rifiutata dal TL. Motivazione: "${rejectReason}". Il contatto è tornato nelle tue Trattative In Corso.` 
                : `La tua richiesta di deroga è stata rifiutata dal TL. Il contatto è tornato nelle tue Trattative In Corso.`;
              await tx.notification.create({
                data: {
                  userId: appt.commercialeId,
                  title: "Deroga Rifiutata",
                  message: msg,
                  contactId: appt.contactId
                }
              });
            }'''
code = code.replace(target2, repl2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")