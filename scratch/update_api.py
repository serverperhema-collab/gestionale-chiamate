import re

with open('src/app/api/trattative/[id]/route.ts', 'r', encoding='utf-8') as f:
    c = f.read()

if 'attachments: true' not in c:
    c = c.replace('currentCommerciale: true }', 'currentCommerciale: true, attachments: true }')
    with open('src/app/api/trattative/[id]/route.ts', 'w', encoding='utf-8') as f:
        f.write(c)

print('Done')
