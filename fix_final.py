import re

path = "src/app/api/contacts/next/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'import \{ autoDelegateIfNeeded \} from "@/lib/delegationHelper";', '', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)

path2 = "src/app/api/tl/contacts/all/route.ts"
with open(path2, "r", encoding="utf-8") as f: content2 = f.read()
content2 = re.sub(r'c\._count\.appointments\s*>\s*0', 'false', content2)
content2 = re.sub(r'c\._count\.appointments', '0', content2)
with open(path2, "w", encoding="utf-8") as f: f.write(content2)