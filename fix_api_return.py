# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/live-monitor/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """        skipCount: op.skipCount,"""
replacement = """        recentSkips,
        maxSkip: op.maxSkip || 5,"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)