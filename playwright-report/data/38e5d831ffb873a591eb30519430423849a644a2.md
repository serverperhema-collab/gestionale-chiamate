# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: G-trattative.spec.ts >> Blocco G - Motore Trattative (Operatore) >> G.1 - Richiamo Personale (apre Trattativa)
- Location: tests\G-trattative.spec.ts:56:7

# Error details

```
"beforeAll" hook timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]
  - alert [ref=e11]
  - generic [ref=e12]:
    - generic [ref=e13]:
      - link "7 Notifiche" [ref=e14] [cursor=pointer]:
        - /url: /tl-dashboard/settings/reviews
        - generic [ref=e15]: "7"
        - generic [ref=e20]: Notifiche
      - button "Attive" [ref=e22]
    - generic [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]: RICHIESTA SBLOCCO CONTATTO
        - button [ref=e32]
      - generic [ref=e37]:
        - generic [ref=e38]:
          - heading "Azienda F7 KO 1788731993261" [level=3] [ref=e39]
          - paragraph [ref=e40]:
            - text: L'operatore
            - strong
            - text: "sta cercando di prenderlo, ma c'è un blocco:"
        - generic [ref=e48]:
          - paragraph [ref=e49]: "Nota operatore ():"
          - paragraph [ref=e50]: "\"Richiesta revisione TL: Numero errato\""
        - heading "Scegli Azione:" [level=4] [ref=e51]
        - generic [ref=e52]:
          - generic [ref=e53] [cursor=pointer]: Lascia al proprietario (Nota)
          - generic [ref=e57] [cursor=pointer]: Annulla Trattativa → Calderone
        - generic [ref=e60]:
          - generic [ref=e61]: Nota da lasciare nel log del contatto (Obbligatoria se 'Lascia al proprietario')
          - 'textbox "Es: Ho verificato, il cliente ha chiesto di essere richiamato stasera..." [ref=e62]'
      - generic [ref=e63]:
        - button "Ignora (Chiudi)" [ref=e64]
        - button "Conferma Azione" [ref=e65]
    - generic [ref=e68]:
      - banner [ref=e69]:
        - heading "TL Control Center" [level=1] [ref=e70]
        - generic [ref=e73]:
          - generic [ref=e74]: 01:43:30
          - generic [ref=e78]:
            - generic [ref=e79]: Bentornato, Test TL
            - button "Nuovo Account" [ref=e81]
          - button "Esci" [ref=e85]
      - main [ref=e89]:
        - generic [ref=e90]:
          - heading "Panoramica Oggi" [level=2] [ref=e91]
          - generic [ref=e92]:
            - generic [ref=e93]:
              - heading "Contatti DB Totali" [level=3] [ref=e100]
              - paragraph [ref=e105]: "73"
            - generic [ref=e106]:
              - heading "CAP in Chiamata Oggi" [level=3] [ref=e113]
              - paragraph [ref=e118]: "0"
            - generic [ref=e119]:
              - heading "Contatti Gestiti Oggi" [level=3] [ref=e126]
              - paragraph [ref=e131]: "0"
            - generic [ref=e132]:
              - heading "Appuntamenti Fissati" [level=3] [ref=e137]
              - paragraph [ref=e140]: "0"
            - generic [ref=e141]:
              - heading "Conversione (%)" [level=3] [ref=e147]
              - paragraph [ref=e151]: 0.0%
        - generic [ref=e152]:
          - link [ref=e153] [cursor=pointer]:
            - /url: /tl-dashboard/assignments
            - generic [ref=e154]:
              - heading "Assegnazione Giornaliera" [level=2] [ref=e160]
              - paragraph [ref=e161]: Distribuisci i CAP e le Campagne agli Operatori per filtrare il calderone.
          - link [ref=e162] [cursor=pointer]:
            - /url: /tl-dashboard/monitoring
            - generic [ref=e163]:
              - heading "Controllo & Report" [level=2] [ref=e167]
              - paragraph [ref=e168]: Accedi al Monitor Live, ai Report e al Registro Attività.
          - link [ref=e169] [cursor=pointer]:
            - /url: /tl-dashboard/monitoring/attendance
            - generic [ref=e170]:
              - heading "Gestione Presenze" [level=2] [ref=e173]
              - paragraph [ref=e174]: Registra le presenze, le assenze e i permessi degli operatori. Esporta il report mensile.
          - link [ref=e175] [cursor=pointer]:
            - /url: /tl-dashboard/appointments
            - generic [ref=e176]:
              - heading "Agende & Appuntamenti" [level=2] [ref=e179]
              - paragraph [ref=e180]: Gestisci le agende (zone) e conferma gli appuntamenti presi dagli operatori.
          - link [ref=e181] [cursor=pointer]:
            - /url: /tl-dashboard/security
            - generic [ref=e182]:
              - heading "Sicurezza & Blocchi" [level=2] [ref=e187]
              - paragraph [ref=e188]: Gestisci gli operatori bloccati per troppi Skip o Modifiche e sbloccali.
          - link [ref=e189] [cursor=pointer]:
            - /url: /tl-dashboard/negotiations
            - generic [ref=e190]:
              - heading "Richiami Personali" [level=2] [ref=e196]
              - paragraph [ref=e197]: Visualizza e gestisci tutti i richiami personali e le trattative in corso degli operatori.
          - link [ref=e198] [cursor=pointer]:
            - /url: /tl-dashboard/outcomes
            - generic [ref=e199]:
              - heading "TRATTATIVE" [level=2] [ref=e203]
              - paragraph [ref=e204]: STORICO DI TUTTE LE TRATTATIVE INTRAPRESE
          - link [ref=e205] [cursor=pointer]:
            - /url: /tl-dashboard/settings
            - generic [ref=e206]:
              - heading "Configurazioni & Utility" [level=2] [ref=e210]
              - paragraph [ref=e211]: Accedi alla mappatura CAP, all'estrazione API e alla gestione account.
        - generic [ref=e214]:
          - generic [ref=e215]:
            - heading "Check list" [level=2] [ref=e216]
            - generic [ref=e221]: "0"
          - generic [ref=e223]:
            - paragraph [ref=e227]: Nessun task pendente.
            - paragraph [ref=e228]: Ottimo lavoro!
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Blocco G - Motore Trattative (Operatore)', () => {
  4   | 
  5   |   let tlContext: any;
  6   |   let opContext: any;
  7   |   let opId: string;
  8   |   let contactG1Id: string;
  9   |   let contactG3Id: string;
  10  |   let trattativaG1Id: string;
  11  |   let trattativaG3Id: string;
  12  | 
> 13  |   test.beforeAll(async ({ browser }) => {
      |        ^ "beforeAll" hook timeout of 30000ms exceeded.
  14  |     // 1. TL Context
  15  |     tlContext = await browser.newContext();
  16  |     const tlPage = await tlContext.newPage();
  17  |     await tlPage.goto('http://localhost:3000/login');
  18  |     await tlPage.getByPlaceholder(/Inserisci username/i).fill('test_admin');
  19  |     await tlPage.locator('input[type="password"]').fill('admin123');
  20  |     await tlPage.locator('button[type="submit"]').click();
  21  |     await tlPage.waitForURL('**/tl-dashboard*');
  22  | 
  23  |     // Otteniamo l'ID dell'operatore
  24  |     const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
  25  |     const usersData = await usersRes.json();
  26  |     const op = usersData.users.find((u: any) => u.username === 'test_op');
  27  |     opId = op.id;
  28  | 
  29  |     // TL crea due contatti per questo blocco nel CAP 00199 (usiamo lo stesso CAP di DEF)
  30  |     for (let i = 1; i <= 2; i++) {
  31  |       const res = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
  32  |         data: {
  33  |           name: `Trattativa Target G${i} ${Date.now()}`,
  34  |           cap: '00199',
  35  |           phone: `069${Math.floor(Math.random() * 1000000)}`,
  36  |           sector: 'Imprese',
  37  |           ignoreFuzzy: true
  38  |         }
  39  |       });
  40  |       const data = await res.json();
  41  |       if (i === 1) contactG1Id = data.contact.id;
  42  |       if (i === 3) contactG3Id = data.contact.id; // wait, i goes up to 2
  43  |       if (i === 2) contactG3Id = data.contact.id;
  44  |     }
  45  | 
  46  |     // 2. OP Context
  47  |     opContext = await browser.newContext();
  48  |     const opPage = await opContext.newPage();
  49  |     await opPage.goto('http://localhost:3000/login');
  50  |     await opPage.getByPlaceholder(/Inserisci username/i).fill('test_op');
  51  |     await opPage.locator('input[type="password"]').fill('Test1234');
  52  |     await opPage.locator('button[type="submit"]').click();
  53  |     await opPage.waitForURL('**/operator-terminal*');
  54  |   });
  55  | 
  56  |   test('G.1 - Richiamo Personale (apre Trattativa)', async () => {
  57  |     // 1. Operatore estrae il contatto G1
  58  |     await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactG1Id}`);
  59  | 
  60  |     // 2. Apre Trattativa per G1
  61  |     const initRes = await opContext.request.post('http://localhost:3000/api/trattative', {
  62  |       data: { contactId: contactG1Id }
  63  |     });
  64  |     expect(initRes.status()).toBe(200);
  65  |     const initData = await initRes.json();
  66  |     trattativaG1Id = initData.trattativa.id;
  67  | 
  68  |     // 3. Esegue l'azione di "Richiamo Personale"
  69  |     const actionPayload = {
  70  |       action: 'richiamo',
  71  |       payload: {
  72  |         recallDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  73  |         notes: 'Da richiamare domani'
  74  |       }
  75  |     };
  76  | 
  77  |     const actionRes = await opContext.request.post(`http://localhost:3000/api/trattative/${trattativaG1Id}/actions`, {
  78  |       data: actionPayload
  79  |     });
  80  |     expect(actionRes.status()).toBe(200);
  81  |     
  82  |     // Verifica stato DB
  83  |     const checkRes = await tlContext.request.get(`http://localhost:3000/api/trattative/${trattativaG1Id}`);
  84  |     const checkData = await checkRes.json();
  85  |     expect(checkData.status).toBe('RICHIAMO_PERSONALE'); // reverted back to correct enum
  86  |     expect(checkData.nextActionType).toBe('RICHIAMO');
  87  |     expect(checkData.currentOperatorId).toBe(opId);
  88  |   });
  89  | 
  90  |   test('G.2 - Lista ricontatti operatore', async () => {
  91  |     // 1. Operatore interroga la lista trattative attive
  92  |     const getRes = await opContext.request.get('http://localhost:3000/api/trattative');
  93  |     expect(getRes.status()).toBe(200);
  94  |     const getData = await getRes.json();
  95  | 
  96  |     // Verifichiamo che la trattativa G1 sia presente
  97  |     const found = getData.trattative.find((t: any) => t.id === trattativaG1Id);
  98  |     expect(found).toBeDefined();
  99  |     expect(found.status).toBe('RICHIAMO_PERSONALE');
  100 |   });
  101 | 
  102 |   test('G.3 - Prendi Appuntamento (senza deroga)', async () => {
  103 |     // 1. Operatore estrae G3
  104 |     await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactG3Id}`);
  105 | 
  106 |     // 2. Apre Trattativa per G3
  107 |     const initRes = await opContext.request.post('http://localhost:3000/api/trattative', {
  108 |       data: { contactId: contactG3Id }
  109 |     });
  110 |     const initData = await initRes.json();
  111 |     trattativaG3Id = initData.trattativa.id;
  112 | 
  113 |     // 3. Fissa Appuntamento
```