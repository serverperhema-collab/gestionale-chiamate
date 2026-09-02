import sys

path = 'src/app/tl-dashboard/settings/contacts/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('setHistContact(contact)', 'setHistContact(c)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
