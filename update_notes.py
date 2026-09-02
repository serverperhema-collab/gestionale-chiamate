import sys

path = 'src/app/api/commerciale/appointments/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('notes: "Richiamo Personale generato da precedente esito."', 'tlNotes: "Richiamo Personale generato da precedente esito.",\n          referentName: appointment.referentName || "",\n          referentRole: appointment.referentRole || "",\n          phone: appointment.phone || "",\n          clientNeeds: appointment.clientNeeds || "Richiamo"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
