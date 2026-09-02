import sys

path = 'src/app/api/tl/appointments/[id]/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """        operatorId,
        isPhoneAppt
      } = body;"""
replacement = """        operatorId,
        isPhoneAppt,
        status
      } = body;"""
code = code.replace(target, replacement)

target2 = """          zoneAgendaId: newZoneAgendaId !== undefined ? newZoneAgendaId : appointment.zoneAgendaId,
          commercialeId: newCommercialeId,
          operatorId: operatorId !== undefined ? operatorId : appointment.operatorId,
          isPhoneAppt: isPhoneAppt !== undefined ? isPhoneAppt : appointment.isPhoneAppt,
          isDeroga: newIsDeroga,
          isApproved: newIsApproved
        }"""
replacement2 = """          zoneAgendaId: newZoneAgendaId !== undefined ? newZoneAgendaId : appointment.zoneAgendaId,
          commercialeId: newCommercialeId,
          operatorId: operatorId !== undefined ? operatorId : appointment.operatorId,
          isPhoneAppt: isPhoneAppt !== undefined ? isPhoneAppt : appointment.isPhoneAppt,
          isDeroga: newIsDeroga,
          isApproved: newIsApproved,
          status: status !== undefined ? status : appointment.status
        }"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
