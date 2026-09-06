import re
path = "src/app/api/contacts/next/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'import\s*\{\s*autoDelegateIfNeeded\s*\}\s*from\s*"@/lib/delegationHelper";', '', content)
content = re.sub(r'const delegated = await autoDelegateIfNeeded\([^)]*\);', 'const delegated = false;', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)