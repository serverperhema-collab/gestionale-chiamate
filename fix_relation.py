import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

target = """model GestioneSeparataRequest {
  id         String   @id @default(cuid())
  contactId  String   @unique
  operatorId String
  reason     String"""

replacement = """model GestioneSeparataRequest {
  id         String   @id @default(cuid())
  contactId  String   @unique
  contact    Contact  @relation(fields: [contactId], references: [id])
  operatorId String
  reason     String"""
code = code.replace(target, replacement)

target2 = """    appointments Appointment[]
    koRecords    KoRecord[]"""
replacement2 = """    appointments Appointment[]
    koRecords    KoRecord[]
    gestioneSeparataRequest GestioneSeparataRequest?"""
code = code.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
