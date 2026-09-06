import re

# alerts
path = "src/app/api/tl/alerts-status/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'reviewRequestedAt: null,?', '', content)
content = re.sub(r'reviewRequestedAt: new Date\(\),?', '', content)
content = re.sub(r'appointments: \{[\s\S]*?\},', '', content)
content = re.sub(r'negotiations: \{[\s\S]*?\},', '', content)
content = re.sub(r'reviewNote: true', '', content)
content = re.sub(r'reviewRequestedAt: true', '', content)
content = re.sub(r'c\.appointments', '[]', content)
content = re.sub(r'c\.negotiations', '[]', content)
content = re.sub(r'c\.reviewNote', '""', content)
content = re.sub(r'c\.reviewRequestedAt', 'null', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)

# contacts/all
path = "src/app/api/tl/contacts/all/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'appointments: true,?', '', content)
content = re.sub(r'c\._count\.appointments > 0 \|\|', '', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)

# reviews
path = "src/app/api/tl/reviews/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'reviewRequestedAt: null,?', '', content)
content = re.sub(r'c\.reviewRequestedAt', 'null', content)
content = re.sub(r'c\.reviewNote', 'null', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)