import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\domain\\appointment-state-machine.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("return [", "return ([")
content = content.replace("].includes(state);", "] as AppointmentState[]).includes(state);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\domain\\authorization.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("  ADMIN: [],\n", "")
content = content.replace("export const ROLE_ACTIONS: Record<Role, TrattativaAction[]> = {", "export const ROLE_ACTIONS: Record<string, TrattativaAction[]> = {")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\lib\\services\\TrattativaService.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("let nextStStatus = TrattativaStatus.TRATTATIVA_IN_CORSO;", "let nextStStatus: TrattativaStatus = TrattativaStatus.TRATTATIVA_IN_CORSO;")
content = content.replace("userRole !== Role.TEAM_LEADER && userRole !== Role.ADMIN", "userRole !== Role.TEAM_LEADER")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)