import sys

# Update TL Dashboard Page
path1 = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\page.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    content1 = f.read()

bad1 = 'Appuntamenti e Preventivi'
good1 = 'TRATTATIVE'
content1 = content1.replace(bad1, good1)

bad1_desc = 'Gestisci lo storico degli appuntamenti, gli esiti e sviluppa i preventivi richiesti.'
good1_desc = 'STORICO DI TUTTE LE TRATTATIVE INTRAPRESE'
content1 = content1.replace(bad1_desc, good1_desc)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(content1)

# Update Outcomes Client
path2 = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\src\\app\\tl-dashboard\\outcomes\\OutcomesClient.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

bad2 = 'Appuntamenti & Preventivi'
good2 = 'TRATTATIVE'
content2 = content2.replace(bad2, good2)

bad2_desc = 'Monitora gli appuntamenti e gli esiti dei commerciali.'
good2_desc = 'STORICO DI TUTTE LE TRATTATIVE INTRAPRESE.'
content2 = content2.replace(bad2_desc, good2_desc)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)