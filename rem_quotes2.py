import sys

path = 'src/app/tl-dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Delete the Preventivi Link
start_idx = code.find('<Link href="/tl-dashboard/quotes"')
if start_idx != -1:
    end_idx = code.find('</Link>', start_idx) + len('</Link>')
    code = code[:start_idx] + code[end_idx:]

# Rename Appuntamenti
code = code.replace('<h2 className="text-lg font-semibold text-white">Appuntamenti</h2>', '<h2 className="text-lg font-semibold text-white">Appuntamenti e Preventivi</h2>')
code = code.replace('<p className="text-sm text-gray-400 mt-2">Gestisci lo storico degli appuntamenti, gli esiti delle visite e i pregressi.</p>', '<p className="text-sm text-gray-400 mt-2">Gestisci lo storico degli appuntamenti, gli esiti e sviluppa i preventivi richiesti.</p>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
