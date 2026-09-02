import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add fields to User
target_user = """  maxNotAvailable     Int @default(15)
  maxNotAvailableMins Int @default(30)"""
replacement_user = """  maxNotAvailable     Int @default(15)
  maxNotAvailableMins Int @default(30)
  maxGestioneSeparata Int @default(5)
  maxGestioneSeparataMins Int @default(60)"""
code = code.replace(target_user, replacement_user)

target_lock = "notAvailableLockTime Int @default(10)"
replacement_lock = "notAvailableLockTime Int @default(10)\n  gestioneSeparataLockTime Int @default(10)"
code = code.replace(target_lock, replacement_lock)

# 2. Add fields to Contact
target_contact = "isPersonalCallback Boolean   @default(false)"
replacement_contact = "isPersonalCallback Boolean   @default(false)\n  isGestioneSeparata Boolean   @default(false)"
code = code.replace(target_contact, replacement_contact)

# 3. Add GestioneSeparataRequest Model
new_model = """
model GestioneSeparataRequest {
  id         String   @id @default(cuid())
  contactId  String   @unique
  operatorId String
  reason     String
  isResolved Boolean  @default(false)
  isApproved Boolean?

  createdAt  DateTime  @default(now())
  resolvedAt DateTime?
}
"""
code = code + new_model

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
