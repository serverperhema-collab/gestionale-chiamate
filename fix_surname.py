import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\api\\tl\\backup\\hidden-contacts\\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(", surname: true", "")
content = content.replace(" ${c.assignedTo.surname}", "")
content = content.replace(" ${c.appointments[0].operator.surname}", "")
content = content.replace(" ${c.callLogs[0].user.surname}", "")
content = content.replace(" ${lastCall.user.surname}", "")
content = content.replace(" ${lastActivity.user.surname}", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)