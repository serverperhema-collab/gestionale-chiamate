import re

with open('src/app/tl-dashboard/appointments/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove "Inserisci App. Senza Agenda" button
content = re.sub(
    r'<button\s*onClick=\{[^\}]+\}\s*className="px-4 py-2 bg-indigo-600[^"]+"\s*>\s*<Plus[^>]+/>\s*Inserisci App\. Senza Agenda\s*</button>',
    '',
    content
)

# Remove "Nuovo Appuntamento in questa Agenda" button
content = re.sub(
    r'<button\s*onClick=\{[^\}]+\}\s*className="p-1\.5 bg-indigo-600/20[^"]+"\s*title="Nuovo Appuntamento in questa Agenda"\s*>\s*<Plus[^>]+/>\s*</button>',
    '',
    content
)

# Remove CreateAppointmentModalTL from render
content = re.sub(
    r'\{createModalOpen && \(\s*<CreateAppointmentModalTL[\s\S]*?</CreateAppointmentModalTL>\s*\)\}',
    '',
    content
)

with open('src/app/tl-dashboard/appointments/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
