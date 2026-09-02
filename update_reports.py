import sys

path = 'src/app/api/reports/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = """const [activityStats, apptStats, skipStats, noAnswerStats] = await Promise.all(["""
replacement1 = """const [activityStats, apptStats, skipStats, noAnswerStats, gestioneSeparataStats] = await Promise.all(["""
code = code.replace(target1, replacement1)

target2 = """prisma.callLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte, lt }, outcome: "NO_ANSWER" },
          _count: { id: true }
        })
      ]);"""
replacement2 = """prisma.callLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte, lt }, outcome: "NO_ANSWER" },
          _count: { id: true }
        }),
        prisma.activityLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte, lt }, action: "GESTIONE_SEPARATA_REQUESTED" },
          _count: { id: true }
        })
      ]);"""
code = code.replace(target2, replacement2)

target3 = """const getNoAnswerCount = (id: string) => noAnswerStats.find(s => s.userId === id)?._count.id || 0;"""
replacement3 = """const getNoAnswerCount = (id: string) => noAnswerStats.find(s => s.userId === id)?._count.id || 0;
      const getGestioneSeparataCount = (id: string) => gestioneSeparataStats.find(s => s.userId === id)?._count.id || 0;"""
code = code.replace(target3, replacement3)

target4 = """        const noAnswerCount = getNoAnswerCount(op.id);"""
replacement4 = """        const noAnswerCount = getNoAnswerCount(op.id);
        const gestioneSeparataCount = getGestioneSeparataCount(op.id);"""
code = code.replace(target4, replacement4)

target5 = """"Appuntamenti Fissati": apptsCount,"""
replacement5 = """"Appuntamenti Fissati": apptsCount,
          "Gestione Separata (Pulizie)": gestioneSeparataCount,"""
code = code.replace(target5, replacement5)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
