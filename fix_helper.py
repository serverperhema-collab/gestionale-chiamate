import re

path = "src/lib/delegationHelper.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'negotiations: \{\s*where: \{ isAbandoned: false \},\s*take: 1\s*\}', '', content)
content = re.sub(r'const negotiation = currentContact\.negotiations\?\.\[0\];', 'const negotiation = null;', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)