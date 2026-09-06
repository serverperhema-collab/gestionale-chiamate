import re

path = "src/app/api/tl/reset-system/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'reviewNote: null,?', '', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)