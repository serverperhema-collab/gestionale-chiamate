# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/operator-terminal/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Instead of exact string matching, we use regex to find the button
pattern_btn = re.compile(r'(<button disabled=\{noAnswerLocked\} onClick=\{.*?>\s*<span className="font-bold">RICHIEDI REVISIONE TL</span>\s*<span.*?>.*?</span>\s*</button>)')

replacement_btn = r"""\1
                    {!contact.isGestioneSeparata && (
                      <button disabled={noAnswerLocked} onClick={() => { setGestioneSeparataNotes(""); setGestioneSeparataModalOpen(true); }} className="px-6 py-3 bg-teal-900/30 text-teal-400 hover:bg-teal-800 hover:text-white border border-teal-700/50 rounded-lg transition shadow-sm disabled:opacity-50 flex flex-col items-center justify-center gap-1">
                        <span className="font-bold">GESTIONE SEPARATA</span>
                        <span className="text-xs italic opacity-85 font-normal">invia alla società di pulizie</span>
                      </button>
                    )}"""

code = re.sub(pattern_btn, replacement_btn, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)