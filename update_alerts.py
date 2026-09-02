import sys

path = 'src/app/api/tl/alerts-status/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    derogaApps.forEach(app => {
      activeAlerts.push({
        type: 'DEROGA_APP_REQUEST',
        appId: app.id,"""

replacement = """    const gestioneSeparataRequests = await prisma.gestioneSeparataRequest.findMany({
      where: { isResolved: false },
      include: {
        contact: { select: { name: true } },
      }
    });

    gestioneSeparataRequests.forEach(req => {
      activeAlerts.push({
        type: 'GESTIONE_SEPARATA_REQUEST',
        requestId: req.id,
        contactId: req.contactId,
        contactName: req.contact?.name || "Sconosciuto",
        operatorId: req.operatorId,
        reason: req.reason,
        requestedAt: req.createdAt
      });
    });

    derogaApps.forEach(app => {
      activeAlerts.push({
        type: 'DEROGA_APP_REQUEST',
        appId: app.id,"""
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
