import re

path = "src/app/api/tl/reviews/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'reviewNote: null,?', '', content)
content = re.sub(r'c\.reviewNote', 'null', content)
content = re.sub(r'const appointment = await prisma\.appointment\.findUnique\(\{[\s\S]*?\}\);', 'const appointment = null;', content)
content = re.sub(r'await prisma\.appointment\.update\(\{[\s\S]*?\}\);', '', content)
content = re.sub(r'reviewRequestedAt: null,?', '', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)