import sys

path = 'src/app/tl-dashboard/quotes/QuotesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('{!externalTab && (\n{/* Sidebar */}', '{/* Sidebar */}\n{!externalTab && (')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
