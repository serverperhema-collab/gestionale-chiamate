import re
path = "src/lib/domain/authorization.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()

content = content.replace(
    "'setRecall',\n    'scheduleAppointment',",
    "'setRecall',\n    'scheduleAppointment',\n    'requestDeroga',"
)

with open(path, "w", encoding="utf-8") as f: f.write(content)