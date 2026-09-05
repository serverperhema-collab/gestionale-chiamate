import sys

# 1. Fix TL appointments
path1 = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\appointments\\route.ts'
with open(path1, 'r', encoding='utf-8') as f: content1 = f.read()

bad1 = """        zoneAgenda: { select: { id: true, name: true, caps: true } },
        commerciale: { select: { id: true, name: true } }
      }"""
good1 = """        zoneAgenda: { select: { id: true, name: true, caps: true } }
      }"""
content1 = content1.replace(bad1, good1)
content1 = content1.replace("appt.commerciale || appt.trattativa.currentCommerciale", "appt.trattativa.currentCommerciale")
with open(path1, 'w', encoding='utf-8') as f: f.write(content1)

# 2. Fix TL quotes
path2 = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\quotes\\route.ts'
with open(path2, 'r', encoding='utf-8') as f: content2 = f.read()

bad_legacy = """           appointment: {
             include: {
               contact: true,
               currentCommerciale: { select: { id: true, name: true } },
               currentOperator: { select: { id: true, name: true } }
             }
           }"""
good_legacy = """           appointment: {
             include: {
               contact: true,
               commerciale: { select: { id: true, name: true } },
               operator: { select: { id: true, name: true } }
             }
           }"""
content2 = content2.replace(bad_legacy, good_legacy)

bad_legacy2 = """           appointment: {
             include: {
               contact: true,
               currentOperator: { select: { id: true, name: true } },
               currentCommerciale: { select: { id: true, name: true } }
             }
           },"""
good_legacy2 = """           appointment: {
             include: {
               contact: true,
               operator: { select: { id: true, name: true } }
             }
           },"""
content2 = content2.replace(bad_legacy2, good_legacy2)
with open(path2, 'w', encoding='utf-8') as f: f.write(content2)