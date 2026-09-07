import { test, expect } from '@playwright/test';

test.describe('Blocco D, E, F - Assegnazioni, Estrazione, Esiti', () => {

  // Useremo contesti di pagina separati per TL e Operatore
  let tlContext: any;
  let opContext: any;
  
  test.beforeAll(async ({ browser }) => {
    // 1. TL Context
    tlContext = await browser.newContext();
    const tlPage = await tlContext.newPage();
    await tlPage.goto('http://localhost:3000/login');
    await tlPage.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await tlPage.locator('input[type="password"]').fill('admin123');
    await tlPage.locator('button[type="submit"]').click();
    await tlPage.waitForURL('**/tl-dashboard*');

    // 2. OP Context
    opContext = await browser.newContext();
    const opPage = await opContext.newPage();
    await opPage.goto('http://localhost:3000/login');
    await opPage.getByPlaceholder(/Inserisci username/i).fill('test_op');
    await opPage.locator('input[type="password"]').fill('Test1234');
    await opPage.locator('button[type="submit"]').click();
    await opPage.waitForURL('**/operator-terminal*');
  });

  test('D.1 - Creazione Assegnazione Giornaliera', async () => {
    // Otteniamo l'ID dell'operatore (test_op) dal backend chiamando /api/users dal TL
    const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
    const usersData = await usersRes.json();
    const op = usersData.users.find((u: any) => u.username === 'test_op');
    const opId = op.id;

    // Crea un'assegnazione giornaliera tramite il TL
    const assignPayload = {
      userId: opId,
      cap: '00199', // Usiamo un CAP univoco per questo test
      campaign: 'ENTRAMBI'
    };

    const assignRes = await tlContext.request.post('http://localhost:3000/api/assignments', { data: assignPayload });
    expect(assignRes.status()).toBe(200);
    const assignResult = await assignRes.json();
    expect(assignResult.success).toBe(true);
    expect(assignResult.assignment.cap).toBe('00199');
  });

  test('E.1 - Estrazione Contatto Deterministico', async () => {
    // 1. Il TL crea un contatto manuale assegnato a quel CAP (00199)
    const tlRes = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: {
        name: `Estrazione Target ${Date.now()}`,
        cap: '00199',
        phone: `069${Math.floor(Math.random() * 1000000)}`,
        sector: 'Imprese',
        ignoreFuzzy: true
      }
    });
    expect(tlRes.status()).toBe(200);
    const contactData = await tlRes.json();
    const contactId = contactData.contact.id;

    // 2. TL create contacts without assigning them, so it's already in the pool.

    // 3. L'Operatore estrae un contatto. Dal momento che l'operatore è stato assegnato al CAP 00199,
    // dovrebbe ricevere il contatto appena creato (essendo l'unico o tra i pochi nel CAP).
    // Nota: potrebbero volerci chiamate multiple se ci sono altri contatti pendenti.
    // Per esserne sicuri chiamiamo con contactId diretto
    const extractRes = await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactId}`);
    expect(extractRes.status()).toBe(200);
    const extractData = await extractRes.json();
    
    // Verifichiamo che il contatto sia stato effettivamente estratto e assegnato
    expect(extractData.contact).toBeDefined();
    expect(extractData.contact.cap).toBe('00199');
    
    // Verifichiamo che l'assegnazione sia persistita nel db (assignedToId aggiornato)
    // Il TL interroga i dettagli
    const verifyRes = await tlContext.request.get(`http://localhost:3000/api/contacts/${extractData.contact.id}/details`);
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    
    const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
    const op = (await usersRes.json()).users.find((u: any) => u.username === 'test_op');
    
    expect(verifyData.contact.assignedToId).toBe(op.id);
  });

  test('F.1 - Esito NO_ANSWER', async () => {
    // Supponiamo che l'operatore abbia un contatto assegnato (l'ha appena estratto nel test precedente)
    // Recuperiamo il contatto corrente
    const nextRes = await opContext.request.get('http://localhost:3000/api/contacts/next');
    const nextData = await nextRes.json();
    const contactId = nextData.contact.id;
    const initialNoAnswerCount = nextData.contact.noAnswerCount || 0;

    // L'operatore dà esito NO_ANSWER
    const outcomeRes = await opContext.request.post(`http://localhost:3000/api/contacts/${contactId}/outcome`, {
      data: { outcome: 'NO_ANSWER', notes: 'Nessuna risposta al telefono' }
    });
    expect(outcomeRes.status()).toBe(200);
    
    // Verifichiamo lo stato risultante (disassegnato, hiddenUntil impostato, contatore incrementato)
    const verifyRes = await tlContext.request.get(`http://localhost:3000/api/contacts/${contactId}/details`);
    const verifyData = await verifyRes.json();
    
    expect(verifyData.contact.assignedToId).toBeNull();
    expect(verifyData.contact.noAnswerCount).toBe(initialNoAnswerCount + 1);
    expect(verifyData.contact.hiddenUntil).not.toBeNull();
  });

  test('F.7 - Richiesta Revisione', async () => {
    // 1. Creiamo un nuovo contatto nel pool
    const tlRes = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: {
        name: `Revisione Target ${Date.now()}`,
        cap: '00199',
        phone: `069${Math.floor(Math.random() * 1000000)}`,
        sector: 'Imprese',
        ignoreFuzzy: true
      }
    });
    const contactId = (await tlRes.json()).contact.id;

    // 2. L'operatore lo estrae direttamente per id per garantire determinismo
    await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactId}`);

    // 3. L'operatore richiede revisione
    const reviewRes = await opContext.request.post(`http://localhost:3000/api/contacts/${contactId}/review-request`, {
      data: { notes: 'Numero inesistente, da verificare', preserveAssignment: false }
    });
    expect(reviewRes.status()).toBe(200);

    // 4. Verifichiamo gli effetti
    const verifyRes = await tlContext.request.get(`http://localhost:3000/api/contacts/${contactId}/details`);
    const verifyData = await verifyRes.json();
    
    expect(verifyData.contact.assignedToId).toBeNull();
    expect(verifyData.contact.hiddenUntil).not.toBeNull();
    
    // Verifichiamo che sia stato inserito il log corretto
    const logFound = verifyData.contact.activityLogs.find((l: any) => l.action === "CONTACT_REVIEW_REQUESTED");
    expect(logFound).toBeDefined();
    expect(logFound.details).toContain('Numero inesistente');
  });

  test('M - Appuntamenti (Trattativa e Schedule) (Sezione G/F.5)', async () => {
    // Simuliamo la creazione di un appuntamento per coprire F.5 (che passa per la Trattativa)
    // 1. Creiamo un nuovo contatto (da TL)
    const tlRes = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: {
        name: `Trattativa Target ${Date.now()}`,
        cap: '00199',
        phone: `069${Math.floor(Math.random() * 1000000)}`,
        sector: 'Imprese',
        ignoreFuzzy: true
      }
    });
    const contactId = (await tlRes.json()).contact.id;

    // 2. Op lo estrae
    await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactId}`);

    // 3. L'operatore apre/crea una trattativa
    const trattRes = await opContext.request.post('http://localhost:3000/api/trattative', {
      data: { contactId }
    });
    expect(trattRes.status()).toBe(200);
    const trattData = await trattRes.json();
    const trattativaId = trattData.trattativa.id;

    // 4. Fissa Appuntamento (Action: appuntamento)
    const actionPayload = {
      action: 'appuntamento',
      payload: {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // tra 2 giorni
        isPhoneAppt: false,
        referentName: 'Mario Rossi',
        phone: '3331234567',
        notes: 'Vuole un incontro',
        address: 'Via Roma 1'
      }
    };

    const actionRes = await opContext.request.post(`http://localhost:3000/api/trattative/${trattativaId}/actions`, {
      data: actionPayload
    });
    
    // Se fallisce per via delle Agende assenti (B.3) il payload o lo status mostrerà 500/400.
    if (actionRes.status() === 500 || actionRes.status() === 400 || actionRes.status() === 404) {
      console.log(`⚠️ Appuntamento fallito (${actionRes.status()}). Possibile bug dipendente dalle Agende. Dettaglio:`, await actionRes.text());
    }
    
    expect(actionRes.status()).toBe(200);
  });

});
