# -*- coding: utf-8 -*-
import sys
import re

path2 = 'src/components/OutcomeModal.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    code2 = f.read()

code2 = re.sub(r'onSuccess\(true, appointment\.contactId, appointment\.contact\.cap\);', 'onSuccess(true);', code2)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(code2)

print("SUCCESS")