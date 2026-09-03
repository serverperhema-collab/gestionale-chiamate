# -*- coding: utf-8 -*-
import sys

path = 'src/app/commercial-app/CommercialeAgendaClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# I need to add state for FixAppt
target1 = '''  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);'''
replacement1 = '''  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [fixApptContactInfo, setFixApptContactInfo] = useState<{contactId: string, cap: string, referentName?: string, phone?: string} | null>(null);'''
code = code.replace(target1, replacement1)

# Import AppointmentModal
target_import = '''import OutcomeModal from "@/components/OutcomeModal";'''
replacement_import = '''import OutcomeModal from "@/components/OutcomeModal";
import AppointmentModal from "@/components/AppointmentModal";'''
code = code.replace(target_import, replacement_import)

# Update OutcomeModal rendering
target_outcome = '''        {selectedApptId && (
          <OutcomeModal 
            appointmentId={selectedApptId} 
            onClose={() => setSelectedApptId(null)} 
            onSuccess={() => { setSelectedApptId(null); fetchAppointments(); }} 
          />
        )}'''
replacement_outcome = '''        {selectedApptId && (
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
code = code.replace(target_outcome, replacement_outcome)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

path2 = 'src/components/OutcomeModal.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    code2 = f.read()

# Fix onSuccess in OutcomeModal
target_on_success = '''          if (payload.nextActionType === "FISSA_NUOVO_APP" && wantsToFixAppt) {
            onSuccess(true, appointment.contactId, appointment.contact.cap);
          } else {'''
replacement_on_success = '''          if (payload.nextActionType === "FISSA_NUOVO_APP" && wantsToFixAppt) {
            onSuccess(true);
          } else {'''
code2 = code2.replace(target_on_success, replacement_on_success)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(code2)

print("SUCCESS")