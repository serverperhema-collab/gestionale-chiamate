import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\operator\\negotiations\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# First query is for negotiation
bad = """    const negotiations = await prisma.negotiation.findMany({
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
        currentOperator: { select: { id: true, name: true } }
      },"""

good = """    const negotiations = await prisma.negotiation.findMany({
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
      },"""

content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)