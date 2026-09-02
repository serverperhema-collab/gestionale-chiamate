import sys

path = 'src/app/globals.css'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Remove the landscape rule
code = code.replace('@media print {\n  @page {\n    size: landscape;\n  }\n}', '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
