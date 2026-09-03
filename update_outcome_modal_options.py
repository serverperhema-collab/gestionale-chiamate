# -*- coding: utf-8 -*-
import sys
import re

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'''\{\[
                        \{ val: "VENDUTO", label: "VENDUTO" \},
                        \{ val: "NON_VENDUTO", label: "NON VENDUTO" \},
                        \{ val: "STANDBY", label: "STANDBY" \},
                        \{ val: "FOLLOWUP", label: "TRATTATIVA IN CORSO" \},
                        \{ val: "KO", label: "KO" \}
                      \]\.map'''

replacement = '''{[
                        { val: "FOLLOWUP", label: "TRATTATIVA IN CORSO" },
                        { val: "KO", label: "KO" },
                        { val: "STANDBY", label: "STANDBY" },
                        { val: "VENDUTO", label: "CONTRATTO FIRMATO" }
                      ].map'''

new_code = re.sub(target, replacement, code, flags=re.DOTALL)
if new_code == code:
    print("FAILED")
else:
    print("SUCCESS")
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_code)