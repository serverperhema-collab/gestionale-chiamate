import sys

path = 'src/app/api/appointments/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'hiddenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),',
    'hiddenUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 anni (Invisibile al calderone)'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
