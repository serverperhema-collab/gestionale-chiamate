import re
path = "src/app/api/contacts/next/route.ts"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(r'import \{ checkExpiredDelegations \} from "@/lib/delegationHelper";\n', '', content)
content = re.sub(r'await checkExpiredDelegations\(\);\n', '', content)
with open(path, "w", encoding="utf-8") as f: f.write(content)