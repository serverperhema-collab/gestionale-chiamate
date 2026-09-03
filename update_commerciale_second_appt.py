import sys

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''        <AppointmentModal
          contactId={fixApptContactInfo.contactId}
          cap={fixApptContactInfo.cap}
          initialReferentName={fixApptContactInfo.referentName}
          initialPhone={fixApptContactInfo.phone}
          onClose={() => setFixApptContactInfo(null)}'''
repl = '''        <AppointmentModal
          contactId={fixApptContactInfo.contactId}
          cap={fixApptContactInfo.cap}
          initialReferentName={fixApptContactInfo.referentName}
          initialPhone={fixApptContactInfo.phone}
          isSecondAppt={true}
          onClose={() => setFixApptContactInfo(null)}'''
code = code.replace(target, repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")