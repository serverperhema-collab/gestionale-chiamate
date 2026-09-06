import re
path = "src/app/api/tl/contacts/all/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'c\._count\.appointments > 0 \|\| ', '', content)
content = re.sub(r'c\._count\.appointments\s*> 0', 'false', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)