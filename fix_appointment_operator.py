import sys

path = 'src/app/api/appointments/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target1 = '''    // 1. Controlla se il contatto esiste ed è disponibile
    const contact = await prisma.contact.findUnique({ where: { id: contactId }, include: { assignedTo: true } });'''
repl1 = '''    // 1. Controlla se il contatto esiste ed è disponibile
    const contact = await prisma.contact.findUnique({ 
      where: { id: contactId }, 
      include: { 
        assignedTo: true,
        appointments: {
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      } 
    });'''
code = code.replace(target1, repl1)

target2 = '''          operatorId: role === "OPERATORE" ? userId : undefined,'''
repl2 = '''          operatorId: role === "OPERATORE" ? userId : (contact.appointments[0]?.operatorId || userId),'''
code = code.replace(target2, repl2)

# Also support isSecondAppt from the payload since we're here
target3 = '''      clientNeeds,
      zoneAgendaId
    } = body;'''
repl3 = '''      clientNeeds,
      zoneAgendaId,
      isSecondAppt
    } = body;'''
code = code.replace(target3, repl3)

target4 = '''          email,
          clientNeeds
        }
      });'''
repl4 = '''          email,
          clientNeeds,
          isSecondAppt: isSecondAppt || false
        }
      });'''
code = code.replace(target4, repl4)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")