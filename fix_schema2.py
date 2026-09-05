import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\prisma\\schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicates added by prisma format
content = re.sub(r"  TrattativaSheet TrattativaSheet\[\]\n", "", content)
content = re.sub(r"  TrattativaEvent TrattativaEvent\[\]\n", "", content)

# 1. Contact
if "trattativa TrattativaSheet?" not in content:
    content = content.replace("model Contact {", "model Contact {\n  trattativa TrattativaSheet?")

# 2. User
if "trattativaEvents TrattativaEvent[]" not in content:
    content = content.replace("model User {", "model User {\n  trattativeAsOperatore TrattativaSheet[] @relation(\"TrattativaOperatore\")\n  trattativeAsCommerciale TrattativaSheet[] @relation(\"TrattativaCommerciale\")\n  trattativaEvents TrattativaEvent[]")

# 3. ZoneAgenda
if "trattativaAppointments TrattativaAppointment[]" not in content:
    content = content.replace("model ZoneAgenda {", "model ZoneAgenda {\n  trattativaAppointments TrattativaAppointment[]")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")