# -*- coding: utf-8 -*-
import sys
import re

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'        \} else if \(quoteOption === "ATTACH"\) \{\n          if \(!file\) \{\n            toast\.error\("Allega il file del preventivo\."\);\n            return;\n          \}\n        \}'
replacement = '''        } else if (quoteOption === "ATTACH" && outcomeFinal !== "VENDUTO") {
          if (files.length === 0) {
            toast.error("Allega il file del preventivo.");
            return;
          }
        } else if (outcomeFinal === "VENDUTO") {
          if (files.length === 0) {
            toast.error("Allega il contratto e i documenti richiesti.");
            return;
          }
        }'''
code = re.sub(target, replacement, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)