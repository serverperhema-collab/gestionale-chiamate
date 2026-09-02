import sys

path = 'src/app/api/tl/appointments/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('status: status !== undefined ? status : appointment.status', 'status: status !== undefined ? (status as any) : appointment.status')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
