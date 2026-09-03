# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/appointments/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''    const operatorId = (session.user as any).id;
    const userName = (session.user as any).name || "Operatore";'''
replacement1 = '''    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const userName = (session.user as any).name || "Utente";'''
code = code.replace(target1, replacement1)

target2 = '''    if (isDeroga) {
      const user = await prisma.user.findUnique({ where: { id: operatorId } });
      const hoursAgo = new Date(Date.now() - (user!.maxDerogheHours * 60 * 60 * 1000));
      const recentDerogheCount = await prisma.appointment.count({
        where: {
          operatorId,
          isDeroga: true,
          createdAt: { gte: hoursAgo }
        }
      });
      if (recentDerogheCount >= user!.maxDeroghe) {
        return NextResponse.json({ 
          error: `Limite raggiunto: puoi inserire massimo ${user!.maxDeroghe} appuntamenti in deroga ogni ${user!.maxDerogheHours} ore.` 
        }, { status: 403 });
      }
    }'''
replacement2 = '''    if (isDeroga && role === "OPERATORE") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const hoursAgo = new Date(Date.now() - (user!.maxDerogheHours * 60 * 60 * 1000));
      const recentDerogheCount = await prisma.appointment.count({
        where: {
          operatorId: userId,
          isDeroga: true,
          createdAt: { gte: hoursAgo }
        }
      });
      if (recentDerogheCount >= user!.maxDeroghe) {
        return NextResponse.json({ 
          error: `Limite raggiunto: puoi inserire massimo ${user!.maxDeroghe} appuntamenti in deroga ogni ${user!.maxDerogheHours} ore.` 
        }, { status: 403 });
      }
    }'''
code = code.replace(target2, replacement2)

target3 = '''          operatorId,
          commercialeId: assignedCommercialeId,'''
replacement3 = '''          operatorId: role === "OPERATORE" ? userId : undefined,
          commercialeId: role === "COMMERCIALE" ? userId : assignedCommercialeId,'''
code = code.replace(target3, replacement3)

target4 = '''          userId: operatorId,'''
replacement4 = '''          userId: userId,'''
code = code.replace(target4, replacement4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")