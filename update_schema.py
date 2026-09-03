# -*- coding: utf-8 -*-
import sys

path = 'prisma/schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

model = """
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  title     String
  message   String
  isRead    Boolean  @default(false)
  
  contactId     String?
  appointmentId String?
  
  createdAt DateTime @default(now())
}
"""

if "model Notification" not in code:
    code += model

# Add to User model
if "notifications Notification[]" not in code:
    target_user = '''  attendances        Attendance[] @relation("AttendanceOperator")
  attendanceUpdates  Attendance[] @relation("AttendanceUpdatedBy")'''
    replacement_user = '''  attendances        Attendance[] @relation("AttendanceOperator")
  attendanceUpdates  Attendance[] @relation("AttendanceUpdatedBy")
  notifications      Notification[]'''
    code = code.replace(target_user, replacement_user)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")