# -*- coding: utf-8 -*-
import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = """enum OutcomeFinal {
  VENDUTO
  NON_VENDUTO
  RIPENSARCI
  FOLLOWUP
  KO
}"""
replacement1 = """enum OutcomeFinal {
  VENDUTO
  NON_VENDUTO
  RIPENSARCI
  STANDBY
  FOLLOWUP
  KO
}"""
code = code.replace(target1, replacement1)

target2 = """enum NextActionTarget {
  COMMERCIALE
  OPERATORE
}"""
replacement2 = """enum NextActionTarget {
  COMMERCIALE
  OPERATORE
  TEAM_LEADER
}"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)