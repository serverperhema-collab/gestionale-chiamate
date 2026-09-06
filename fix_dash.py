import re

path = "src/app/tl-dashboard/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'prisma\.appointment\.count\(\{[\s\S]*?\}\)', 'Promise.resolve(0)', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)