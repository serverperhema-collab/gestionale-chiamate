import sys

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'contactUpdateData.hiddenUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 anno',
    'contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (Invisibile al calderone)'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
