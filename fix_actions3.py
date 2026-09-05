import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\trattative\\[id]\\actions\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = """      case "upload-quote":
        result = await service.uploadQuote(params.id, payload, userId, userRole);
        break;
"""

content = content.replace('      case "richiamo":\n        result = await service.setRichiamo(params.id, payload, userId, userRole);\n        break;', '      case "richiamo":\n        result = await service.setRichiamo(params.id, payload, userId, userRole);\n        break;\n' + mapping)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)