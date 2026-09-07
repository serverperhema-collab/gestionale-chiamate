import re
path = "src/app/api/contacts/[id]/review-request/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()

content = re.sub(
    r'prisma\.callLog\.create\(\{\s*data:\s*\{\s*userId,\s*contactId:\s*id,\s*outcome:\s*"REVIEW_REQUEST",\s*notes:\s*notes\s*\}\s*\}\),',
    '',
    content
)

with open(path, "w", encoding="utf-8") as f: f.write(content)