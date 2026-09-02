import sys
import re

path = 'src/app/tl-dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('Esiti Commerciali', 'Appuntamenti')
code = code.replace('Gestisci gli esiti delle visite e decidi sui KO richiesti.', 'Gestisci lo storico degli appuntamenti, gli esiti delle visite e i pregressi.')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

path2 = 'src/app/tl-dashboard/outcomes/page.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    code2 = f.read()
code2 = code2.replace('Esiti Commerciali', 'Appuntamenti')
with open(path2, 'w', encoding='utf-8') as f:
    f.write(code2)
