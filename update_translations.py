import sys

path = 'src/app/tl-dashboard/monitoring/logs/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """  'CONTACT_SKIPPED': 'Contatto Saltato',"""
new_block = """  'CONTACT_SKIPPED': 'Contatto Saltato (Skip)',
  'OUTCOME_NO_ANSWER': 'Esito: Non Risponde',
  'OUTCOME_NOT_AVAILABLE': 'Esito: Non Reperibile',
  'OUTCOME_NON_INTERESSATO': 'Esito: Non Interessato',
  'OUTCOME_NO_INFO': 'Esito: Richiamo Generico',
  'OUTCOME_NEGOTIATION': 'Esito: Richiamo Personale',
  'OUTCOME_APPOINTMENT': 'Esito: Appuntamento Preso',"""

code = code.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
