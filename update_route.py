# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/commerciale/appointments/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    let dateFilter: any = {};
    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr); // istanza separata per evitare mutazione
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lt: end };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { gte: today };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        commercialeId: commercialeId,
        date: dateFilter,
        // Solo quelli non cancellati nǸ gi lavorati
        status: {
          in: ["PENDING", "CONFIRMED", "NOT_CONFIRMED", "DA_GESTIRE_COMMERCIALE"] 
        }
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true, originalPhone: true }
        },
        operator: { select: { id: true, name: true } },
        commerciale: { select: { id: true, name: true } }
      },"""

replacement = """    const whereClause: any = {
      commercialeId: commercialeId,
      status: { notIn: ["CANCELLED"] }
    };

    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr); 
      end.setHours(23, 59, 59, 999);
      whereClause.date = { gte: start, lt: end };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true, originalPhone: true }
        },
        operator: { select: { id: true, name: true } },
        commerciale: { select: { id: true, name: true } },
        outcomes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },"""

# Notice the encoding replacement (nǸ gi) which might fail, so let's use regex or just replace the specific part