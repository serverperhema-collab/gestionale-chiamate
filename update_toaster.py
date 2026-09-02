# -*- coding: utf-8 -*-
import sys

path = 'src/app/layout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """<Toaster position="top-right" />"""
replacement = """<Toaster position="bottom-right" />"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)