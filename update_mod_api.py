# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/contacts/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    // Se l'operatore è bloccato per le modifiche, rifiuta
    if (user.role === "OPERATORE" && user.modLockedUntil && user.modLockedUntil > new Date()) {"""

replacement = """    // Se l'operatore è bloccato per le modifiche, rifiuta
    if (!user.isTrusted && user.role === "OPERATORE" && user.modLockedUntil && user.modLockedUntil > new Date()) {"""
code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)