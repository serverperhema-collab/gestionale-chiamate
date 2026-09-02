import sys

path = 'src/app/tl-dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('<div className="mb-8">\n          <div className="h-64">\n            <TlTasksWidget />', '<div className="mt-8 mb-8">\n          <div className="h-64">\n            <TlTasksWidget />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
