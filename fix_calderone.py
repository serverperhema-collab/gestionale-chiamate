import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\contacts\\next\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

legacy_where = """    // Filter conditions
    const whereCondition: any = {
      isKo: false,
      blacklisted: false,
      assignedToId: null, // Not assigned to anyone else
      OR: [
        { hiddenUntil: null },
        { hiddenUntil: { lte: new Date() } }
      ],
      cap: { in: caps }
    };"""

new_where = """    // Filter conditions
    const whereCondition: any = {
      isKo: false,
      blacklisted: false,
      assignedToId: null, // Not assigned to anyone else
      OR: [
        { hiddenUntil: null },
        { hiddenUntil: { lte: new Date() } }
      ],
      AND: [
        {
          OR: [
            { trattativaSheet: null },
            { trattativaSheet: { status: "CHIUSA_PERSA" } }
          ]
        }
      ],
      cap: { in: caps }
    };"""

content = content.replace(legacy_where, new_where)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)