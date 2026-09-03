# -*- coding: utf-8 -*-
import sys
import re

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'enum OutcomeFinal \{\n  VENDUTO\n  NON_VENDUTO\n  RIPENSARCI\n  STANDBY\n  FOLLOWUP\n  KO\n\}'
replacement = '''enum OutcomeFinal {
  VENDUTO
  NON_VENDUTO
  RIPENSARCI
  STANDBY
  FOLLOWUP
  TRATTATIVA_IN_CORSO
  KO
}'''

new_code = re.sub(target, replacement, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_code)