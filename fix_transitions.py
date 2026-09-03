import sys

path = 'src/lib/commercialStateMachine.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''  [CommercialStatus.VISITATO]: [
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.KO
  ],
  [CommercialStatus.FOLLOW_UP]: [
    CommercialStatus.VISITATO,
    CommercialStatus.KO,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO
  ],
  [CommercialStatus.PREVENTIVO_IN_CORSO]: [
    CommercialStatus.VENDUTO,
    CommercialStatus.KO,
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.VISITATO
  ],'''
repl = '''  [CommercialStatus.VISITATO]: [
    CommercialStatus.VISITATO,
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.KO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],
  [CommercialStatus.FOLLOW_UP]: [
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.VISITATO,
    CommercialStatus.KO,
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],
  [CommercialStatus.PREVENTIVO_IN_CORSO]: [
    CommercialStatus.PREVENTIVO_IN_CORSO,
    CommercialStatus.VENDUTO,
    CommercialStatus.KO,
    CommercialStatus.FOLLOW_UP,
    CommercialStatus.VISITATO,
    CommercialStatus.SALTATO_CLIENTE_DA_RIFISSARE,
    CommercialStatus.SALTATO_CLIENTE_KO_RICHIESTO,
    CommercialStatus.SALTATO_COMMERCIALE_DA_RIFISSARE,
    CommercialStatus.SALTATO_COMMERCIALE_KO_RICHIESTO
  ],'''
code = code.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")