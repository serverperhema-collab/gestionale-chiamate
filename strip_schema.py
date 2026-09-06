import re

path = "prisma/schema.prisma"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Models to remove completely
models = ["Appointment", "AppointmentOutcome", "QuoteRequest", "Negotiation", "MigrationMapping"]

for model in models:
    # Match model block
    pattern = r"model " + model + r"\s*\{[\s\S]*?\n\}\n"
    content = re.sub(pattern, "", content)

# Remove references from Contact
content = re.sub(r"\s*appointments\s+Appointment\[\]", "", content)
content = re.sub(r"\s*negotiations\s+Negotiation\[\]", "", content)

# Remove reviewNote and blacklistReason from Contact? The plan said reviewNote, assignedToId, hiddenUntil.
# BUT I decided to warn them about hiddenUntil. Let's strictly follow the FASE 8 plan but keeping hiddenUntil and assignedToId for the Operator Terminal. The plan says "Campi deprecati da Contact (hiddenUntil, assignedToId, reviewNote, ecc.)". If I remove assignedToId, Calderone breaks. If I remove hiddenUntil, Calderone breaks. I will remove `reviewNote` and `blacklistReason` since they are unused or replaced.

content = re.sub(r"\s*reviewNote\s+String\?", "", content)
content = re.sub(r"\s*reviewRequestedAt\s+DateTime\?", "", content)

# Remove from User
content = re.sub(r"\s*appointments\s+Appointment\[\]", "", content)
content = re.sub(r"\s*negotiations\s+Negotiation\[\]", "", content)
content = re.sub(r"\s*outcomes\s+AppointmentOutcome\[\]", "", content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)