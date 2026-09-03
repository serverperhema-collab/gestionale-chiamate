# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/appointments/deroga-stats/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = 'if (!session || (session.user as any).role !== "OPERATORE") {'
replacement = 'if (!session || !["OPERATORE", "COMMERCIALE", "TEAM_LEADER"].includes((session.user as any).role)) {'
code = code.replace(target, replacement)

target2 = '''    const operatorId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: operatorId } });'''
replacement2 = '''    const role = (session.user as any).role;
    if (role === "COMMERCIALE" || role === "TEAM_LEADER") {
      return NextResponse.json({
        maxDeroghe: 999,
        maxDerogheHours: 24,
        usedDeroghe: 0,
        remainingDeroghe: 999
      });
    }

    const operatorId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: operatorId } });'''
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")