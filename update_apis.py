# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/appointments/dates/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = 'if (!session || (session.user as any).role !== "OPERATORE") {'
replacement = 'if (!session || !["OPERATORE", "COMMERCIALE", "TEAM_LEADER"].includes((session.user as any).role)) {'
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

path2 = 'src/app/api/appointments/slots/route.ts'
with open(path2, 'r', encoding='utf-8') as f:
    code2 = f.read()
code2 = code2.replace(target, replacement)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(code2)

path3 = 'src/app/api/appointments/route.ts'
with open(path3, 'r', encoding='utf-8') as f:
    code3 = f.read()

target_post = 'if (!session || (session.user as any).role !== "OPERATORE") {'
code3 = code3.replace(target_post, replacement)

with open(path3, 'w', encoding='utf-8') as f:
    f.write(code3)

print("SUCCESS")