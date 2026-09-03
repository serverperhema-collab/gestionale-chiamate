# -*- coding: utf-8 -*-
import sys
import re

path = 'src/components/OutcomeModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '  onSuccess: () => void;'
replacement1 = '  onSuccess: (triggerFixAppt?: boolean, contactId?: string, cap?: string) => void;'
code = code.replace(target1, replacement1)

target2 = '''        if (payload.nextActionType === "FISSA_NUOVO_APP" && wantsToFixAppt) {
          // Instruct parent to open fix appt modal, passing data
          // For now, we will just rely on onSuccess and let the UI know if needed.
          // Ideally, we'd trigger a callback `onFissaNuovo(appointmentId)`
        }
        
        onSuccess();'''
replacement2 = '''        if (payload.nextActionType === "FISSA_NUOVO_APP" && wantsToFixAppt) {
          onSuccess(true, appointment.contactId, appointment.contact.cap);
        } else {
          onSuccess();
        }'''
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")