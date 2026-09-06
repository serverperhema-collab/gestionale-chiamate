import re

path = "src/app/api/tl/appointments/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'const legacyAppts = await prisma\.appointment\.findMany\(\{[\s\S]*?\}\);', 'const legacyAppts: any[] = [];', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

path2 = "src/app/api/tl/appointments/historical/route.ts"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

content2 = re.sub(r'const existing = await prisma\.appointment\.findFirst\(\{[\s\S]*?\}\);', 'const existing = null;', content2)

with open(path2, "w", encoding="utf-8") as f:
    f.write(content2)

path3 = "src/app/api/tl/appointments/[id]/route.ts"
with open(path3, "r", encoding="utf-8") as f:
    content3 = f.read()
    
content3 = re.sub(r'const appointment = await prisma\.appointment\.findUnique\(\{[\s\S]*?\}\);', 'const appointment = null;', content3)

with open(path3, "w", encoding="utf-8") as f:
    f.write(content3)

path4 = "src/app/api/tl/appointments/[id]/action/route.ts"
with open(path4, "r", encoding="utf-8") as f:
    content4 = f.read()
    
content4 = re.sub(r'const appointment = await prisma\.appointment\.findUnique\(\{[\s\S]*?\}\);', 'const appointment = null;', content4)

with open(path4, "w", encoding="utf-8") as f:
    f.write(content4)