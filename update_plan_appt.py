import sys

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\brain\\a14be8b9-cb56-465f-b3ba-67a6167bb489\\implementation_plan.md'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Trovo il blocco del database e lo rimpiazzo
target_db = '''### Nuovo Schema Database

#### Modello `TrattativaSheet` — Il Cuore

```prisma
enum TrattativaStatus {'''

repl_db = '''### Nuovo Schema Database (Architettura: Contatto → Trattativa → Appuntamenti)

> **L'Appuntamento non sparisce**, rimane come entità figlia della Scheda Trattativa. L'appuntamento ha un suo ciclo di vita per mantenere la memoria storica in Agenda. Quando l'appuntamento viene "esitato", i dettagli dell'esito arricchiscono la TrattativaSheet e la sua Timeline (Eventi).

#### Modelli Prisma

```prisma
enum AppointmentState {
  FISSATO             // Appena preso
  CONFERMATO          // Confermato per la visita
  SVOLTO_DA_ESITARE   // Commerciale è andato, ma non ha ancora compilato l'esito
  SVOLTO_ESITATO      // Esito inserito, ha arricchito la Trattativa
  SALTATO             // Cliente non c'era / Commerciale ha saltato
  RIFISSATO           // Appuntamento spostato (questo record diventa storico)
  ANNULLATO           // Annullato definitivamente
}

enum TrattativaStatus {'''

code = code.replace(target_db, repl_db)

target_model = '''  events    TrattativaEvent[]
}'''

repl_model = '''  events       TrattativaEvent[]
  appointments Appointment[]
}

model Appointment {
  id            String          @id @default(cuid())
  trattativaId  String
  trattativa    TrattativaSheet @relation(fields: [trattativaId], references: [id])
  
  date          DateTime
  commercialeId String?
  commerciale   User?           @relation(fields: [commercialeId], references: [id])
  zoneAgendaId  String?
  zoneAgenda    ZoneAgenda?     @relation(fields: [zoneAgendaId], references: [id])
  
  status        AppointmentState @default(FISSATO)
  rescheduleCount Int            @default(0) // Quante volte è stato rifissato (0, 1, 2...)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}'''
code = code.replace(target_model, repl_model)

target_flow = '''### STEP C — Commerciale: Inserisce Esito'''
repl_flow = '''### STEP B.2 — Ciclo di Vita Appuntamento e Storico
```
Se un appuntamento viene spostato (dalla TL o dall'Operatore):
1. Il vecchio Appointment cambia stato in RIFISSATO. Rimane nel DB come memoria storica nell'agenda (nessun buco).
2. Viene creato un nuovo Appointment con la nuova data.
3. Il nuovo Appointment riceve rescheduleCount = vecchio.rescheduleCount + 1 (es. "RIFISSATO 1", "RIFISSATO 2").
Così il Commerciale vedendo il tag sa quante volte il cliente ha rimbalzato l'incontro.
```

### STEP C — Commerciale: Inserisce Esito'''
code = code.replace(target_flow, repl_flow)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")