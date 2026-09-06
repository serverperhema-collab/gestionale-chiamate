import re

path = "src/app/api/tl/hidden-contacts/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove negotiations and appointments from select
content = re.sub(r'negotiations: \{[\s\S]*?\},', '', content)
content = re.sub(r'appointments: \{[\s\S]*?\}', '', content)
content = re.sub(r'reviewRequestedAt: null', '', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)