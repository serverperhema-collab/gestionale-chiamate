# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    const reviews = await prisma.contact.findMany({
      where: {
        reviewRequestedAt: { not: null }
      },
      select: {
        id: true,
        name: true,
        cap: true,
        originalPhone: true,
        address: true,
        reviewRequestedAt: true,
        reviewNote: true
      },
      orderBy: {
        reviewRequestedAt: "asc"
      }
    });

    return NextResponse.json({ reviews });"""

replacement = """    const standardReviews = await prisma.contact.findMany({
      where: {
        reviewRequestedAt: { not: null }
      },
      select: {
        id: true,
        name: true,
        cap: true,
        originalPhone: true,
        address: true,
        reviewRequestedAt: true,
        reviewNote: true
      }
    });

    const gestioneSeparata = await prisma.gestioneSeparataRequest.findMany({
      where: {
        isResolved: false
      },
      include: {
        contact: {
          select: { name: true, cap: true, originalPhone: true, address: true }
        }
      }
    });

    const combined = [
      ...standardReviews.map(r => ({ ...r, type: 'REVIEW', date: r.reviewRequestedAt })),
      ...gestioneSeparata.map(g => ({
        id: g.id,
        contactId: g.contactId,
        name: g.contact?.name || "Sconosciuto",
        cap: g.contact?.cap,
        originalPhone: g.contact?.originalPhone,
        address: g.contact?.address,
        reviewRequestedAt: g.createdAt,
        reviewNote: g.reason,
        type: 'GESTIONE_SEPARATA',
        date: g.createdAt
      }))
    ];

    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ reviews: combined });"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)