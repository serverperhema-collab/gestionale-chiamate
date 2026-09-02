# -*- coding: utf-8 -*-
import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """  maxGestioneSeparata     Int @default(5)
  maxGestioneSeparataMins Int @default(60)"""

replacement = """  maxGestioneSeparata     Int @default(5)
  maxGestioneSeparataMins Int @default(60)
  
  // Operatore Fidato
  isTrusted Boolean @default(false)"""

code = code.replace(target, replacement)

# Check if it was replaced
if "isTrusted Boolean" not in code:
    print("Replace failed. Appending directly.")
    # Find the end of model User
    # Actually just add it after maxDailyModifications
    target2 = "maxDailyModifications Int @default(5)"
    replacement2 = "maxDailyModifications Int @default(5)\n  isTrusted Boolean @default(false)"
    code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)