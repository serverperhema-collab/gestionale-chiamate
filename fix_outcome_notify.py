# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/api/contacts/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''    const userName = (session.user as any).name || "Operatore";'''
code = code.replace(target, '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")