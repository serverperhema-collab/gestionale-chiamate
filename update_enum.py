import sys

path = 'src/app/api/commerciale/appointments/[id]/outcome/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('commercialStatus: "NUOVO"', 'commercialStatus: "ASSEGNATO"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
