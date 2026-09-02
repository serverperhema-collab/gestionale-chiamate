import sys

path = 'src/app/tl-dashboard/settings/contacts/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Find the button for Cronologia and add the Storico button after it
lines = code.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'Cronologia' in line and '</button>' in lines[i+1]:
        # we found the button
        new_lines.append('                        </button>')
        new_lines.append('                        <button')
        new_lines.append('                          onClick={() => { setHistContact(contact); setShowHistModal(true); }}')
        new_lines.append('                          className="inline-flex items-center px-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 rounded border border-blue-800 transition"')
        new_lines.append('                        >')
        new_lines.append('                          App. Storico')
        
code_str = '\n'.join(new_lines)
code_str = code_str.replace('                        </button>\n                        </button>', '                        </button>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code_str)
