import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\brain\\a14be8b9-cb56-465f-b3ba-67a6167bb489\\implementation_plan.md'
content = """# Piano Strategico — SCHEDA TRATTATIVA (Deal Dossier) - ARCHITETTURA DEFINITIVA

## Obiettivo
Creare un'architettura **Domain-Driven** solida, immutabile e tracciabile, basata su un unico dossier permanente (`TrattativaSheet`) per ogni cliente, che orchestra le entità figlie (`Appointment`, `TrattativaEvent`, `TrattativaAttachment`) garantendo uno storico perfetto (Event Sourcing) e transizioni di stato centralizzate e atomiche.

---

## 1. Invarianti di Sistema (Le Tavole della Legge)

1. Un `Contact` può avere **massimo una** `TrattativaSheet` a vita (relazione 1:1).
2. Una `TrattativaSheet` può avere zero o più `Appointment`.
3. Un `Appointment` appartiene a una sola `TrattativaSheet`.
4. Una `TrattativaSheet` chiusa non può ricevere un `Appointment` senza prima generare l'evento `RIAPERTA`.
5. I seguenti stati dell'Appuntamento sono **TERMINALI** (immutabili): `RIFISSATO`, `ANNULLATO`, `SALTATO`, `SVOLTO_ESITATO`.
6. Una `TrattativaSheet` CHIUSA_VINTA non può essere riaperta dall'operatore (blocco TL).
7. Una `TrattativaSheet` CHIUSA_PERSA può essere riaperta solo se il KoRecord è scaduto o risolto.
8. Ogni cambio di stato significativo genera un `TrattativaEvent`.
9. I `TrattativaEvent` sono **IMMUTABILI** (append-only, mai UPDATE o DELETE).
10. Nessuna route API può modificare direttamente lo status bypassando il *Domain Service*.
11. Tutte le transizioni critiche avvengono all'interno di una singola `BEGIN TRANSACTION ... COMMIT`.
12. La visibilità nel Calderone è determinata unicamente da una funzione centralizzata `isContactAvailableInCalderone(contactId)`.

---

## 2. Architettura Dati

```text
                    CONTACT (Anagrafica Pura)
                       │
                       │ 1:1
                       ▼
              TRATTATIVA SHEET (Dossier Commerciale)
             ┌─────────┼──────────┬──────────┐
             │         │          │          │
             ▼         ▼          ▼          ▼
       APPOINTMENT   QUOTE*     EVENTS     ATTACHMENTS
```

### Schema Prisma Aggiornato

```prisma
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
  FISSATO             // Operativo
  CONFERMATO          // Operativo
  SVOLTO_DA_ESITARE   // Operativo
  SVOLTO_ESITATO      // TERMINALE
  SALTATO             // TERMINALE
  RIFISSATO           // TERMINALE
  ANNULLATO           // TERMINALE
}

enum NextActionType {
  NONE
  RICHIAMO
  APPUNTAMENTO
  ESITO_DA_INSERIRE
  PREVENTIVO
  APPROVAZIONE_TL
}

model TrattativaSheet {
  id        String  @id @default(cuid())
  contactId String  @unique // Relazione stretta 1:1
  contact   Contact @relation(fields: [contactId], references: [id])
  
  version   Int     @default(0) // Optimistic Concurrency

  status       TrattativaStatus @default(RICHIAMO_PERSONALE)
  derogaStatus DerogaStatus     @default(NONE)

  // Assegnazioni Correnti
  currentOperatorId    String?
  currentCommercialeId String?
  
  // Gestione Prossima Azione
  nextActionType       NextActionType @default(NONE)
  nextActionDate       DateTime?
  currentAppointmentId String? // Puntatore all'Appuntamento attivo
  
  // Dati Commerciali (Sovrascrivono l'anagrafica base per la trattativa in corso)
  commercialPhone String?
  commercialEmail String?
  referentName    String?
  referentRole    String?
  clientNeeds     String?

  // Esito Finale / Chiusura
  outcomeFinal OutcomeFinal?
  outcomeNotes String?
  closedAt     DateTime? 

  createdByOperatorId String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  appointments Appointment[]
  events       TrattativaEvent[]
  attachments  TrattativaAttachment[]
}

model Appointment {
  id           String          @id @default(cuid())
  trattativaId String
  trattativa   TrattativaSheet @relation(fields: [trattativaId], references: [id])
  
  date          DateTime
  isPhoneAppt   Boolean     @default(false)
  commercialeId String?
  zoneAgendaId  String?
  zoneAgenda    ZoneAgenda? @relation(fields: [zoneAgendaId], references: [id])
  
  status          AppointmentState @default(FISSATO)
  rescheduleCount Int              @default(0)
  
  // Link esplicito alla catena degli appuntamenti
  previousAppointmentId String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TrattativaEvent {
  id           String          @id @default(cuid())
  trattativaId String
  trattativa   TrattativaSheet @relation(fields: [trattativaId], references: [id])
  
  userId      String
  userRole    String 
  eventType   String // CREATA, APPUNTAMENTO_FISSATO, ESITO_INSERITO, DEROGA_RICHIESTA, RIAPERTA...
  description String
  metadata    Json?
  
  createdAt   DateTime @default(now())
}

model TrattativaAttachment {
  id           String          @id @default(cuid())
  trattativaId String
  trattativa   TrattativaSheet @relation(fields: [trattativaId], references: [id])
  
  url          String
  filename     String
  type         String // es. "CONTRATTO", "PREVENTIVO"
  uploadedById String
  
  createdAt    DateTime @default(now())
}
```

---

## 3. Logica di Migrazione (Contact-Centric)

Lo script di migrazione girerà in locale per test.
La logica itererà **SUI CONTATTI**, non sulle singole entità legacy:

```text
Per ogni Contact (con dati storici):
  1. Raccogli Negotiation, Appointment, QuoteRequest, KoRecord
  2. Ordina tutto cronologicamente
  3. Crea la singola TrattativaSheet 1:1
  4. Crea i TrattativaEvent per ricostruire la storia
  5. Crea gli Appointment storici (impostando gli stati terminali SVOLTO_ESITATO o ANNULLATO)
  6. Calcola e imposta lo status corrente della TrattativaSheet
```

Controllo post-migrazione:
- Nessun `Appointment` legacy orfano
- Errori = 0, Duplicati = 0.

---

## 4. Architettura del Codice (Domain Service Pattern)

Per garantire atomicità e rispetto delle State Machine, tutto passerà da `src/lib/services/TrattativaService.ts`.

Nessuna route farà `prisma.trattativaSheet.update`. Chiameranno metodi del service:

```typescript
// Esempio: Inserimento Esito Commerciale
async function submitOutcome(
  trattativaId: string, 
  appointmentId: string, 
  outcomeData: any, 
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch Trattativa (con version per Optimistic Concurrency)
    // 2. Validate Transition
    // 3. Update Appointment status -> SVOLTO_ESITATO
    // 4. Update Trattativa status, nextActionType, version++
    // 5. Create TrattativaEvent
    // 6. Return updated ST
  });
}
```

Gli endpoint API si limiteranno a parser e autorizzazione (MVC puro).

### Endpoint Restrittivi
Il `PATCH /api/trattative/[id]` sarà limitato a campi sicuri (`commercialPhone`, `clientNeeds`, `referentName`). 
Le transizioni di stato avranno endpoint Action dedicati:
- `POST /api/trattative/[id]/actions/esito`
- `POST /api/trattative/[id]/actions/deroga`
- `POST /api/trattative/[id]/actions/riapri`

---

## 5. Timeline Visiva (UI)

La Dashboard includerà un componente `TrattativaTimeline` che rederizzerà l'array `events` dall'alto verso il basso, garantendo una visione 360° immutabile di tutta la storia commerciale del cliente, compresa la data in cui un appuntamento è stato spostato (metadata: `oldDate`, `newDate`).
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")