import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\trattative\\[id]\\actions\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = """      case "richiamo":
        result = await service.setRichiamo(params.id, payload, userId, userRole);
        break;
"""

content = content.replace('      case "richiamo":\n        // Fallback al domain service setRecall (da definire o map to nextAction)\n        // Per ora usiamo submitOutcome o aggiungiamo method a Service\n        throw new Error("Action richiamo not fully mapped yet");\n        break;', mapping)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)