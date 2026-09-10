with open('src/app/api/tl/wizard-trattativa/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'contactId,',
    'contactId,\n          hadAppointment: appuntamentoSvolto,'
)

with open('src/app/api/tl/wizard-trattativa/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)
