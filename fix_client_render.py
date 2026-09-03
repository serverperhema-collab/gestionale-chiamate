# -*- coding: utf-8 -*-
import sys
import re

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = '''      {selectedApptId && (
        <OutcomeModal 
          appointmentId={selectedApptId} 
          onClose={() => setSelectedApptId(null)} 
          onSuccess={() => { setSelectedApptId(null); fetchAppointments(); }} 
        />
      )}'''

replacement = '''      {selectedApptId && (
        <OutcomeModal 
          appointmentId={selectedApptId} 
          onClose={() => setSelectedApptId(null)} 
          onSuccess={(triggerFixAppt) => { 
            const appt = appointments.find(a => a.id === selectedApptId);
            setSelectedApptId(null); 
            fetchAppointments(); 
            if (triggerFixAppt && appt) {
              setFixApptContactInfo({
                contactId: appt.contactId,
                cap: appt.contact.cap,
                referentName: appt.referentName || appt.contact.name,
                phone: appt.phone || appt.contact.originalPhone
              });
            }
          }} 
        />
      )}

      {fixApptContactInfo && (
        <AppointmentModal
          contactId={fixApptContactInfo.contactId}
          cap={fixApptContactInfo.cap}
          initialReferentName={fixApptContactInfo.referentName}
          initialPhone={fixApptContactInfo.phone}
          onClose={() => setFixApptContactInfo(null)}
          onSuccess={() => {
            setFixApptContactInfo(null);
            fetchAppointments();
          }}
        />
      )}'''

code = code.replace(target, replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")