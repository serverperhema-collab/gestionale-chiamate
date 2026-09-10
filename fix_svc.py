with open('src/lib/services/TrattativaService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'status: "APPUNTAMENTO",\n          currentAppointmentId: appt.id,',
    'status: "APPUNTAMENTO",\n          hadAppointment: true,\n          currentAppointmentId: appt.id,'
)

with open('src/lib/services/TrattativaService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
