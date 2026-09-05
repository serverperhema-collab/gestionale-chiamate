import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\scripts\\migration\\migrate-to-trattativa.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("outcome: true", "outcomes: true")
content = content.replace("appt.outcome.", "appt.outcomes[0].")
content = content.replace("if (appt.outcome)", "if (appt.outcomes && appt.outcomes.length > 0)")
content = content.replace("payload: appt.outcome", "payload: appt.outcomes[0]")

content = content.replace("quoteRequests: true", "quoteRequest: true")
content = content.replace("for (const qr of appt.quoteRequests)", "if (appt.quoteRequest)")
content = content.replace("qr.", "appt.quoteRequest.")
content = content.replace("payload: qr", "payload: appt.quoteRequest")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)