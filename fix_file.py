# -*- coding: utf-8 -*-
import sys

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = 'if (!file) {'
replacement = 'if (files.length === 0) {'
code = code.replace(target, replacement)

target2 = '} else if (quoteOption === "ATTACH") {'
replacement2 = '} else if (quoteOption === "ATTACH" && outcomeFinal !== "VENDUTO") {'
code = code.replace(target2, replacement2)

target3 = '''        } else if (quoteOption === "ATTACH" && outcomeFinal !== "VENDUTO") {
          if (files.length === 0) {
            toast.error("Allega il file del preventivo.");
            return;
          }
        }'''
replacement3 = '''        } else if (quoteOption === "ATTACH" && outcomeFinal !== "VENDUTO") {
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
code = code.replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)