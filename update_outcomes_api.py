# -*- coding: utf-8 -*-
import sys

path = 'src/app/api/tl/outcomes/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """    let whereClause: any = {
      status: { notIn: ["CANCELLED"] }
    };"""

replacement = """    let whereClause: any = {};"""

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)