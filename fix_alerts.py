import re

path = "src/app/api/tl/alerts-status/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'const derogaApps = await prisma\.appointment\.findMany\(\{[\s\S]*?\}\);', 'const derogaApps: any[] = [];', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)