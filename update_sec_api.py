# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/users/[id]/settings/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """      maxDeroghe,
      maxDerogheHours,
      isTrusted,"""
replacement = """      maxDeroghe,
      maxDerogheHours,
      maxGestioneSeparata,
      maxGestioneSeparataMins,
      isTrusted,"""
code = code.replace(target, replacement)

target2 = """        maxDeroghe,
        maxDerogheHours,
        isTrusted,"""
replacement2 = """        maxDeroghe,
        maxDerogheHours,
        maxGestioneSeparata,
        maxGestioneSeparataMins,
        isTrusted,"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)