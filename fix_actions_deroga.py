import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\trattative\\[id]\\actions\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = """      case "resolve-deroga":
        result = await service.resolveDeroga(params.id, payload, userId, userRole);
        break;
"""

content = content.replace('      case "upload-quote":\n        result = await service.uploadQuote(params.id, payload, userId, userRole);\n        break;', '      case "upload-quote":\n        result = await service.uploadQuote(params.id, payload, userId, userRole);\n        break;\n' + mapping)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)