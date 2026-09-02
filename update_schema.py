import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """  maxGestioneSeparata Int @default(5)
  maxGestioneSeparataMins Int @default(60)"""

replacement = """  maxGestioneSeparata Int @default(5)
  maxGestioneSeparataMins Int @default(60)
  
  // Operatore Fidato
  isTrusted Boolean @default(false)"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
