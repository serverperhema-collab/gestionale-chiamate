import sys

path = 'src/app/tl-dashboard/outcomes/OutcomesClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('<span className="font-bold text-lg mb-1">Da Svolgere</span>', '<span className="font-bold text-lg mb-1">Da Esitare</span>')
code = code.replace('<span className="font-bold text-lg mb-1">Svolti</span>', '<span className="font-bold text-lg mb-1">Esitati</span>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
