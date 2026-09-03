import sys

path = 'src/components/AppointmentModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''interface AppointmentModalProps {
  contactId: string;
  cap: string;
  initialReferentName?: string;
  initialPhone?: string;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}'''
repl1 = '''interface AppointmentModalProps {
  contactId: string;
  cap: string;
  initialReferentName?: string;
  initialPhone?: string;
  initialEmail?: string;
  isSecondAppt?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}'''
code = code.replace(target1, repl1)

target2 = '''  initialPhone = "",
  initialEmail = "",
  onClose, 
  onSuccess 
}: AppointmentModalProps) {'''
repl2 = '''  initialPhone = "",
  initialEmail = "",
  isSecondAppt = false,
  onClose, 
  onSuccess 
}: AppointmentModalProps) {'''
code = code.replace(target2, repl2)

target3 = '''      const payload: any = {
        contactId,
        referentName,
        referentRole,
        phone,
        email,
        clientNeeds,
      };'''
repl3 = '''      const payload: any = {
        contactId,
        referentName,
        referentRole,
        phone,
        email,
        clientNeeds,
        isSecondAppt,
      };'''
code = code.replace(target3, repl3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")