import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\operator\\negotiations\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_logic = """    const negotiations = await prisma.negotiation.findMany({
      where: { 
        OR: [
          { operatorId: userId },
          { originalOperatorId: userId }
        ],
        isAbandoned: false
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, originalPhone: true, address: true, delegatedUntil: true }
        },
        operator: { select: { id: true, name: true } }
      },
      orderBy: { recallDate: "asc" }
    });

    const userIdsToFetch = new Set<string>();
    negotiations.forEach(n => {
      if (n.originalOperatorId) userIdsToFetch.add(n.originalOperatorId);
    });

    let originalUsers: Record<string, string> = {};
    if (userIdsToFetch.size > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIdsToFetch) } },
        select: { id: true, name: true }
      });
      users.forEach(u => originalUsers[u.id] = u.name);
    }

    const mappedNegotiations = negotiations.map(n => ({
      ...n,
      originalOperator: n.originalOperatorId ? { id: n.originalOperatorId, name: originalUsers[n.originalOperatorId] || "Sconosciuto" } : null
    }));

    return NextResponse.json({ 
      negotiations: mappedNegotiations,
      currentUserId: userId 
    });"""

new_logic = """    const negotiations = await prisma.negotiation.findMany({
      where: { 
        OR: [
          { operatorId: userId },
          { originalOperatorId: userId }
        ],
        isAbandoned: false
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, originalPhone: true, address: true, delegatedUntil: true }
        },
        operator: { select: { id: true, name: true } }
      },
      orderBy: { recallDate: "asc" }
    });

    const newSTs = await prisma.trattativaSheet.findMany({
      where: {
        currentOperatorId: userId,
        status: "RICHIAMO_PERSONALE",
        closedAt: null
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, originalPhone: true, address: true, delegatedUntil: true }
        },
        operator: { select: { id: true, name: true } }
      }
    });

    const userIdsToFetch = new Set<string>();
    negotiations.forEach(n => {
      if (n.originalOperatorId) userIdsToFetch.add(n.originalOperatorId);
    });

    let originalUsers: Record<string, string> = {};
    if (userIdsToFetch.size > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIdsToFetch) } },
        select: { id: true, name: true }
      });
      users.forEach(u => originalUsers[u.id] = u.name);
    }

    let mappedNegotiations = negotiations.map(n => ({
      ...n,
      originalOperator: n.originalOperatorId ? { id: n.originalOperatorId, name: originalUsers[n.originalOperatorId] || "Sconosciuto" } : null
    }));

    // Mappiamo le ST per il formato legacy
    const mappedSTs = newSTs.map(st => ({
      id: st.id,
      isNewSystem: true, // Flag per il frontend
      contactId: st.contactId,
      operatorId: st.currentOperatorId,
      recallDate: st.nextActionDate || new Date(), // Se non c'è, mettiamo oggi
      reason: st.outcomeNotes || "Trattativa (Nuovo Sistema)",
      contact: st.contact,
      operator: st.operator,
      originalOperator: null
    }));

    mappedNegotiations = [...mappedNegotiations, ...mappedSTs].sort((a, b) => 
      new Date(a.recallDate as any).getTime() - new Date(b.recallDate as any).getTime()
    );

    return NextResponse.json({ 
      negotiations: mappedNegotiations,
      currentUserId: userId 
    });"""

content = content.replace(legacy_logic, new_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)