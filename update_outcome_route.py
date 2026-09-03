# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/api/commerciale/appointments/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = r'''        \} else if \(quoteRequested \|\| quoteAttached\) \{
          nextStatus = "PREVENTIVO_IN_CORSO";
        \} else if \(nextActionType\) \{
          nextStatus = "FOLLOW_UP";
        \} else \{'''

replacement = '''        } else if (quoteRequested || quoteAttached) {
          nextStatus = "PREVENTIVO_IN_CORSO";
        } else if (nextActionType || outcomeFinal === "TRATTATIVA_IN_CORSO" || outcomeFinal === "FOLLOWUP") {
          nextStatus = "FOLLOW_UP";
        } else {'''

code = re.sub(target, replacement, code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)