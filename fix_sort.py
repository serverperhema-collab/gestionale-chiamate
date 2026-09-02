# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/reviews/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = "combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());"
replacement = "combined.sort((a, b) => new Date(a.date || new Date()).getTime() - new Date(b.date || new Date()).getTime());"

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)