import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\scratch\\gestionale_estrazioni\\prisma\\schema.prisma'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fields to Contact
if "trattativa TrattativaSheet?" not in content:
    contact_target = "  koRecords           KoRecord[]"
    contact_repl = contact_target + "\n  trattativa          TrattativaSheet?"
    content = content.replace(contact_target, contact_repl)

# 2. Add fields to User
if "trattativaEvents TrattativaEvent[]" not in content:
    user_target = "  attendanceUpdates  Attendance[] @relation(\"AttendanceUpdatedBy\")"
    user_repl = user_target + "\n\n  // Trattativa (Nuovo Sistema)\n  trattativeAsOperatore TrattativaSheet[] @relation(\"TrattativaOperatore\")\n  trattativeAsCommerciale TrattativaSheet[] @relation(\"TrattativaCommerciale\")\n  trattativaEvents TrattativaEvent[]"
    content = content.replace(user_target, user_repl)

# 3. Add fields to ZoneAgenda
if "trattativaAppointments TrattativaAppointment[]" not in content:
    zone_target = "  appointments Appointment[]"
    zone_repl = zone_target + "\n  trattativaAppointments TrattativaAppointment[]"
    content = content.replace(zone_target, zone_repl)

# 4. Append Enums and Models
append_data = """
// ─────────────────────────────────────────
// NUOVO SISTEMA SCHEDA TRATTATIVA (FASE 1)
// ─────────────────────────────────────────

enum TrattativaStatus {
  RICHIAMO_PERSONALE
  APPUNTAMENTO
  TRATTATIVA_IN_CORSO
  PREVENTIVO
  SOSPESA
  CHIUSA_VINTA
  CHIUSA_PERSA
}

enum DerogaStatus {
  NONE
  PENDING
  APPROVED
  REJECTED
}

enum AppointmentState {
  FISSATO
  CONFERMATO
  SVOLTO_DA_ESITARE
  SVOLTO_ESITATO
  SALTATO
  RIFISSATO
  ANNULLATO
}

enum NextActionType {
  NONE
  RICHIAMO
  APPUNTAMENTO
  ESITO_DA_INSERIRE
  PREVENTIVO
  APPROVAZIONE_TL
}

enum TrattativaEventType {
  CREATA
  RIAPERTA
  RICHIAMO_IMPOSTATO
  RICHIAMO_POSTICIPATO
  APPUNTAMENTO_FISSATO
  APPUNTAMENTO_CONFERMATO
  APPUNTAMENTO_RIFISSATO
  APPUNTAMENTO_ANNULLATO
  APPUNTAMENTO_SALTATO
  APPUNTAMENTO_SVOLTO
  ESITO_INSERITO
  PREVENTIVO_RICHIESTO
  PREVENTIVO_COMPLETATO
  DEROGA_RICHIESTA
  DEROGA_APPROVATA
  DEROGA_RIFIUTATA
  DEROGA_SPOSTATA
  CONTRATTO_FIRMATO
  KO_DEFINITIVO
  STANDBY_IMPOSTATO
  RIASSEGNATO
  NOTA_AGGIUNTA
}

model TrattativaSheet {
  id        String  @id @default(cuid())
  contactId String  @unique
  contact   Contact @relation(fields: [contactId], references: [id])

  version      Int              @default(0)
  status       TrattativaStatus @default(RICHIAMO_PERSONALE)
  derogaStatus DerogaStatus     @default(NONE)

  currentOperatorId    String?
  currentOperator      User? @relation("TrattativaOperatore", fields: [currentOperatorId], references: [id])
  
  currentCommercialeId String?
  currentCommerciale   User? @relation("TrattativaCommerciale", fields: [currentCommercialeId], references: [id])

  nextActionType       NextActionType @default(NONE)
  nextActionDate       DateTime?
  currentAppointmentId String?

  commercialPhone String?
  commercialEmail String?
  referentName    String?
  referentRole    String?
  clientNeeds     String?

  outcomeFinal OutcomeFinal?
  outcomeNotes String?

  closedAt DateTime?

  createdByOperatorId String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  appointments TrattativaAppointment[]
  events       TrattativaEvent[]
  attachments  TrattativaAttachment[]

  @@index([status])
  @@index([currentOperatorId])
  @@index([currentCommercialeId])
  @@index([nextActionDate])
  @@index([closedAt])
}

model TrattativaAppointment {
  id           String          @id @default(cuid())
  trattativaId String
  trattativa   TrattativaSheet @relation(fields: [trattativaId], references: [id])

  date          DateTime
  isPhoneAppt   Boolean          @default(false)
  commercialeId String?
  zoneAgendaId  String?
  zoneAgenda    ZoneAgenda?      @relation(fields: [zoneAgendaId], references: [id])

  status          AppointmentState @default(FISSATO)
  rescheduleCount Int              @default(0)

  previousAppointmentId String?
  previousAppointment   TrattativaAppointment?  @relation("RescheduleChain", fields: [previousAppointmentId], references: [id])
  nextAppointments      TrattativaAppointment[] @relation("RescheduleChain")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([trattativaId])
  @@index([trattativaId, status])
  @@index([status])
  @@index([date])
  @@index([commercialeId, date])
  @@index([zoneAgendaId, date])
}

model TrattativaEvent {
  id           String               @id @default(cuid())
  trattativaId String
  trattativa   TrattativaSheet      @relation(fields: [trattativaId], references: [id])

  userId      String
  user        User                 @relation(fields: [userId], references: [id])
  userRole    String 
  eventType   TrattativaEventType
  description String
  metadata    Json?

  createdAt DateTime @default(now())

  @@index([trattativaId, createdAt])
}

model TrattativaAttachment {
  id           String          @id @default(cuid())
  trattativaId String
  trattativa   TrattativaSheet @relation(fields: [trattativaId], references: [id])

  url          String
  filename     String
  type         String
  mimeType     String?
  size         Int?
  uploadedById String

  createdAt DateTime @default(now())

  @@index([trattativaId])
  @@index([type])
}

model MigrationMapping {
  id           String @id @default(cuid())
  legacyModel  String
  legacyId     String
  newModel     String
  newEntityId  String
  
  @@unique([legacyModel, legacyId])
}
"""

if "enum TrattativaStatus" not in content:
    content += append_data

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")