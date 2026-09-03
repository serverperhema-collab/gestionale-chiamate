# -*- coding: utf-8 -*-
import sys
import re

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = r'const \[outcomeFinal, setOutcomeFinal\] = useState<"VENDUTO" \| "NON_VENDUTO" \| "RIPENSARCI" \| "STANDBY" \| "FOLLOWUP" \| "KO" \| "">\(""\);'
replacement1 = '''const [outcomeFinal, setOutcomeFinal] = useState<"VENDUTO" | "NON_VENDUTO" | "RIPENSARCI" | "STANDBY" | "FOLLOWUP" | "TRATTATIVA_IN_CORSO" | "KO" | "">("");'''
code = re.sub(target1, replacement1, code)

target2 = r'\{ val: "FOLLOWUP", label: "TRATTATIVA IN CORSO" \},'
replacement2 = '''{ val: "TRATTATIVA_IN_CORSO", label: "TRATTATIVA IN CORSO" },'''
code = re.sub(target2, replacement2, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)