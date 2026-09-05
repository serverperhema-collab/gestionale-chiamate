import sys
import re

path = 'C:\\Users\\maggi\\.gemini\\antigravity\\brain\\a14be8b9-cb56-465f-b3ba-67a6167bb489\\implementation_plan.md'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Aggiorno Q1
target_q1 = '''> [!IMPORTANT]
> **Q1 — Storico multi-trattativa sullo stesso contatto?**
> Es: cliente visitato, KO. Dopo 6 mesi torna nel calderone. L'operatore lo riprende: si apre una nuova ST o si riapre la vecchia?
>
> **Proposta consigliata**: si crea una ST nuova. La vecchia rimane come archivio storico leggibile dalla "Timeline Storico" del contatto. Nell'UI, cliccando su un contatto si vedono tutte le ST (aperte e chiuse) in ordine cronologico.'''
repl_q1 = '''> [!IMPORTANT]
> **Q1 — Storico multi-trattativa sullo stesso contatto?**
> **Decisione**: Quando un contatto esce dal KO e torna nel calderone, **SI RIAPRE LA VECCHIA SCHEDA TRATTATIVA**. 
> Avremo una relazione strettamente 1:1. Ogni contatto avrà al massimo UNA ST a vita. Se il cliente torna, togliamo la data di chiusura (`closedAt = null`) e ripartiamo ad aggiungere eventi sulla sua Timeline esistente, così abbiamo tutta la storia clinica infinita in un'unica scheda.'''
code = code.replace(target_q1, repl_q1)

# Aggiorno Q2
target_q2 = '''> [!IMPORTANT]
> **Q2 — Terminale Operatore: il contatto "grezzo" rimane visibile prima della ST?**
> L'operatore nel calderone vede ancora il contatto e può fare NO_ANSWER, NOT_AVAILABLE, NON_INTERESSATO (senza creare ST). La ST si crea solo con RICHIAMO_PERSONALE o APPUNTAMENTO.
>
> Confermi questa logica?'''
repl_q2 = '''> [!IMPORTANT]
> **Q2 — Terminale Operatore: il contatto "grezzo" rimane visibile prima della ST?**
> **Decisione**: CONFERMATO. Gli esiti standard ("Non Risponde", "Non Reperibile") agiranno sul contatto grezzo per questioni di velocità e lock antifrode. La ST nasce o si riapre ESCLUSIVAMENTE quando l'operatore fissa un Appuntamento o un Richiamo Personale.'''
code = code.replace(target_q2, repl_q2)

# Aggiorno Q3
target_q3 = '''> [!IMPORTANT]
> **Q3 — Dati attuali in produzione: migra o riparte da zero?**
> I dati (Appointment, Negotiation, Outcome) attuali vengono migrati automaticamente nella FASE 1.
> Hai preferenza su come gestire i dati già presenti?'''
repl_q3 = '''> [!IMPORTANT]
> **Q3 — Migrazione dati attuali in produzione**
> **Decisione**: La migrazione vera e propria avverrà in un secondo momento. Creeremo uno script di migrazione in locale, lo testeremo a parte e lo lanceremo sul database di produzione solo quando sarai pronto, per non rischiare di bloccare i ragazzi al lavoro.'''
code = code.replace(target_q3, repl_q3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS")