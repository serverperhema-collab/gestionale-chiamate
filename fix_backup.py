import re

path = "src/app/api/tl/backup/hidden-contacts/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'negotiations: \{[\s\S]*?\},', '', content)
content = re.sub(r'appointments: \{[\s\S]*?\}', '', content)

content = re.sub(r'\} else if \(c\.appointments\.length > 0[\s\S]*?\}', '}', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)