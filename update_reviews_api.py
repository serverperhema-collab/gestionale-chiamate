# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''    const gestioneSeparata = await prisma.gestioneSeparataRequest.findMany({'''
replacement1 = '''    const deroghe = await prisma.appointment.findMany({
      where: {
        isDeroga: true,
        isApproved: false,
        status: "PENDING"
      },
      include: {
        contact: {
          select: { name: true, cap: true, originalPhone: true, address: true }
        },
        commerciale: { select: { name: true } },
        operator: { select: { name: true } }
      }
    });

    const gestioneSeparata = await prisma.gestioneSeparataRequest.findMany({'''
code = code.replace(target1, replacement1)

target2 = '''    const combined = [
      ...standardReviews.map(r => ({ ...r, type: 'REVIEW', date: r.reviewRequestedAt })),
      ...gestioneSeparata.map(g => ({'''
replacement2 = '''    const combined = [
      ...standardReviews.map(r => ({ ...r, type: 'REVIEW', date: r.reviewRequestedAt })),
      ...deroghe.map(d => ({
        id: d.id,
        contactId: d.contactId,
        name: d.contact?.name || "Sconosciuto",
        cap: d.contact?.cap,
        originalPhone: d.contact?.originalPhone,
        address: d.contact?.address,
        reviewRequestedAt: d.createdAt,
        reviewNote: `Richiesta appuntamento in deroga il ${new Date(d.date).toLocaleString('it-IT')} da ${d.commerciale?.name || d.operator?.name || 'Utente'}. Data/Ora appuntamento: ${new Date(d.date).toLocaleString('it-IT')}. Note: ${d.clientNeeds}`,
        type: 'DEROGA',
        date: d.createdAt
      })),
      ...gestioneSeparata.map(g => ({'''
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")