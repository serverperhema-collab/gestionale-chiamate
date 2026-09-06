import re

path = "src/app/api/tl/deletions/appointments/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'await prisma\.appointment\.findMany\(\{[\s\S]*?\}\);', '[]', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)