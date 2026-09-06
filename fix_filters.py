import re
path = "src/app/tl-dashboard/settings/hidden-contacts/page.tsx"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = re.sub(
    r'const matchReason = filterReasons\.length === 0 \|\| filterReasons\.includes\(c\.reason\);',
    r'const matchReason = filterReasons.length === 0 || filterReasons.some(r => c.reason.startsWith(r));',
    content
)
with open(path, "w", encoding="utf-8") as f: f.write(content)