import re

path = "src/app/api/tl/fix-commerciale/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'const existing = await prisma\.appointment\.findFirst\(\{[\s\S]*?\}\);', 'const existing = null;', content)
content = re.sub(r'await prisma\.appointment\.create\(\{[\s\S]*?\}\);', '', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

path2 = "src/app/api/tl/reset-system/route.ts"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()
    
content2 = re.sub(r'await prisma\.appointmentOutcome\.deleteMany\(\);\n', '', content2)
content2 = re.sub(r'await prisma\.quoteRequest\.deleteMany\(\);\n', '', content2)
content2 = re.sub(r'await prisma\.appointment\.deleteMany\(\);\n', '', content2)
content2 = re.sub(r'await prisma\.negotiation\.deleteMany\(\);\n', '', content2)
content2 = re.sub(r'reviewRequestedAt: null,\n', '', content2)

with open(path2, "w", encoding="utf-8") as f:
    f.write(content2)