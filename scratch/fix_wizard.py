import re

with open('src/app/api/tl/wizard-trattativa/route.ts', 'r', encoding='utf-8') as f:
    c = f.read()

bad = """    const trattativa = await prisma.trattativaSheet.create({
      data: {
        contactId,
        status: trattativaStatus,
        currentOperatorId: operatorId,
        currentCommercialeId: commercialeId || null,
        nextActionType: (!isPast || outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") ? "RICHIAMO" : "NONE",
        nextActionDate: isPast ? (nextDate && nextTime ? new Date(`${nextDate}T${nextTime}`) : null) : eventDateTime
      }
    });"""

good = """    const trattativa = await prisma.trattativaSheet.create({
      data: {
        contactId,
        status: trattativaStatus,
        currentOperatorId: operatorId,
        createdByOperatorId: operatorId,
        currentCommercialeId: commercialeId || null,
        nextActionType: (!isPast || outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") ? "RICHIAMO" : "NONE",
        nextActionDate: isPast ? (nextDate && nextTime ? new Date(`${nextDate}T${nextTime}`) : null) : eventDateTime
      }
    });"""

c = c.replace(bad, good)

with open('src/app/api/tl/wizard-trattativa/route.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
