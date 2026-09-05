import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\trattative\\[id]\\actions\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = """      case "riapri":
        result = await service.reopen(params.id, payload, userId, userRole);
        break;
      case "deroga":
        result = await service.requestDeroga(params.id, payload, userId, userRole);
        break;
      case "nota":
        result = await service.addNote(params.id, payload, userId, userRole);
        break;"""

content = content.replace('      case "riapri":\n        result = await service.reopen(params.id, payload, userId, userRole);\n        break;', mapping)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)