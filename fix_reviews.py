import re

path = "src/app/api/tl/reviews/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# This file reads legacy and new deroghe. We will strip the legacy parts.
content = re.sub(r'const deroghe = await prisma\.appointment\.findMany\(\{[\s\S]*?\}\);', 'const deroghe: any[] = [];', content)
content = re.sub(r'reviewRequestedAt: null,?', '', content)
content = re.sub(r'reviewRequestedAt: new Date\(\),?', '', content)
content = re.sub(r'c\.reviewRequestedAt', 'null', content)
content = re.sub(r'c\.reviewNote', 'null', content)

# Remove the legacy POST part
content = re.sub(r'if \(type === "appointment"\) \{[\s\S]*?\} else if \(type === "contact"\)', 'if (type === "contact")', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)