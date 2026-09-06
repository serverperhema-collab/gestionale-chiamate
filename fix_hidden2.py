import re

path = "src/app/api/tl/hidden-contacts/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix logic accessing appointments and negotiations
content = re.sub(r'if \(c\.appointments\.length > 0[\s\S]*?\} else if', 'if', content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)