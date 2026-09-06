import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\backup\\hidden-contacts\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad = """      select: {
        id: true,
        name: true,
        cap: true,
        address: true,
        originalPhone: true,
        hiddenUntil: true,
        noAnswerCount: true,
        isKo: true,
        assignedTo: {
          select: { name: true }
        },
        koRecords: {
          where: { isResolved: false },
          select: { frozenUntil: true }
        },
        callLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            outcome: true,
            createdAt: true,
            notes: true,
            user: { select: { name: true } }
          }
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            action: true,
            details: true,
            createdAt: true,
            user: { select: { name: true } }
          }
        },
        negotiations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            recallDate: true,
            operator: { select: { name: true } }
          }
        },
        appointments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            date: true,
            status: true,
            operator: { select: { name: true } }
          }
        }
      }"""

good = """      include: {
        assignedTo: true,
        koRecords: { where: { isResolved: false } },
        callLogs: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } },
        activityLogs: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } },
        negotiations: { orderBy: { createdAt: "desc" }, take: 1, include: { operator: true } },
        appointments: { orderBy: { createdAt: "desc" }, take: 1, include: { operator: true } }
      }"""

content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)