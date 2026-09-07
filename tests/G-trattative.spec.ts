import { test, expect } from '@playwright/test';

test.describe('Blocco G - Motore Trattative (Operatore)', () => {

  let tlContext: any;
  let opContext: any;
  let opId: string;
  let contactG1Id: string;
  let contactG3Id: string;
  let trattativaG1Id: string;
  let trattativaG3Id: string;

  test.beforeAll(async ({ browser }) => {
    // 1. TL Context
    tlContext = await browser.newContext();
    const tlPage = await tlContext.newPage();
    await tlPage.goto('http://localhost:3000/login');
    await tlPage.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await tlPage.locator('input[type="password"]').fill('admin123');
    await tlPage.locator('button[type="submit"]').click();
    await tlPage.waitForURL('**/tl-dashboard*');

    // Otteniamo l'ID dell'operatore
    const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
    const usersData = await usersRes.json();
    const op = usersData.users.find((u: any) => u.username === 'test_op');
    opId = op.id;

    // TL crea due contatti per questo blocco nel CAP 00199 (usiamo lo stesso CAP di DEF)
    for (let i = 1; i <= 2; i++) {
      const res = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
        data: {
          name: `Trattativa Target G${i} ${Date.now()}`,
          cap: '00199',
          phone: `069${Math.floor(Math.random() * 1000000)}`,
          sector: 'Imprese',
          ignoreFuzzy: true
        }
      });
      const data = await res.json();
      if (i === 1) contactG1Id = data.contact.id;
      if (i === 3) contactG3Id = data.contact.id; // wait, i goes up to 2
      if (i === 2) contactG3Id = data.contact.id;
    }

    // 2. OP Context
    opContext = await browser.newContext();
    const opPage = await opContext.newPage();
    await opPage.goto('http://localhost:3000/login');
    await opPage.getByPlaceholder(/Inserisci username/i).fill('test_op');
    await opPage.locator('input[type="password"]').fill('Test1234');
    await opPage.locator('button[type="submit"]').click();
    await opPage.waitForURL('**/operator-terminal*');
  });

  test('G.1 - Richiamo Personale (apre Trattativa)', async () => {
    // 1. Operatore estrae il contatto G1
    await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactG1Id}`);

    // 2. Apre Trattativa per G1
    const initRes = await opContext.request.post('http://localhost:3000/api/trattative', {
      data: { contactId: contactG1Id }
    });
    expect(initRes.status()).toBe(200);
    const initData = await initRes.json();
    trattativaG1Id = initData.trattativa.id;

    // 3. Esegue l'azione di "Richiamo Personale"
    const actionPayload = {
      action: 'richiamo',
      payload: {
        recallDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Da richiamare domani'
      }
    };

    const actionRes = await opContext.request.post(`http://localhost:3000/api/trattative/${trattativaG1Id}/actions`, {
      data: actionPayload
    });
    expect(actionRes.status()).toBe(200);
    
    // Verifica stato DB
    const checkRes = await tlContext.request.get(`http://localhost:3000/api/trattative/${trattativaG1Id}`);
    const checkData = await checkRes.json();
    expect(checkData.status).toBe('RICHIAMO_PERSONALE'); // reverted back to correct enum
    expect(checkData.nextActionType).toBe('RICHIAMO');
    expect(checkData.currentOperatorId).toBe(opId);
  });

  test('G.2 - Lista ricontatti operatore', async () => {
    // 1. Operatore interroga la lista trattative attive
    const getRes = await opContext.request.get('http://localhost:3000/api/trattative');
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();

    // Verifichiamo che la trattativa G1 sia presente
    const found = getData.trattative.find((t: any) => t.id === trattativaG1Id);
    expect(found).toBeDefined();
    expect(found.status).toBe('RICHIAMO_PERSONALE');
  });

  test('G.3 - Prendi Appuntamento (senza deroga)', async () => {
    // 1. Operatore estrae G3
    await opContext.request.get(`http://localhost:3000/api/contacts/next?contactId=${contactG3Id}`);

    // 2. Apre Trattativa per G3
    const initRes = await opContext.request.post('http://localhost:3000/api/trattative', {
      data: { contactId: contactG3Id }
    });
    const initData = await initRes.json();
    trattativaG3Id = initData.trattativa.id;

    // 3. Fissa Appuntamento
    const actionPayload = {
      action: 'appuntamento',
      payload: {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isPhoneAppt: false,
        referentName: 'Luigi Verdi',
        phone: '3339876543',
        notes: 'Incontro confermato'
      }
    };

    const actionRes = await opContext.request.post(`http://localhost:3000/api/trattative/${trattativaG3Id}/actions`, {
      data: actionPayload
    });
    expect(actionRes.status()).toBe(200);

    // Verifica stato DB
    const checkRes = await tlContext.request.get(`http://localhost:3000/api/trattative/${trattativaG3Id}`);
    const checkData = await checkRes.json();
    expect(checkData.status).toBe('APPUNTAMENTO');
  });

  test('G.4 - Lista appuntamenti operatore (in attesa)', async () => {
    const getRes = await opContext.request.get('http://localhost:3000/api/trattative');
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();

    const found = getData.trattative.find((t: any) => t.id === trattativaG3Id);
    expect(found).toBeDefined();
    expect(found.status).toBe('APPUNTAMENTO');
  });

  test('G.5 - Aggiungi nota su trattativa', async () => {
    const actionPayload = {
      action: 'nota',
      payload: { note: 'Questa è una nota aggiuntiva' }
    };
    
    const actionRes = await opContext.request.post(`http://localhost:3000/api/trattative/${trattativaG3Id}/actions`, {
      data: actionPayload
    });
    expect(actionRes.status()).toBe(200);
  });

  test('G.6 & G.7 - Storico eventi e Dettaglio Completo', async () => {
    const getRes = await opContext.request.get(`http://localhost:3000/api/trattative/${trattativaG3Id}`);
    expect(getRes.status()).toBe(200);
    const data = await getRes.json();

    expect(data).toBeDefined();
    expect(data.contactId).toBe(contactG3Id);
    
    const events = data.events;
    console.log("EVENTS RETURNED: ", JSON.stringify(events, null, 2));
    expect(events.length).toBeGreaterThanOrEqual(3);
    
    const noteEvent = events.find((e: any) => e.eventType === 'NOTA_AGGIUNTA');
    expect(noteEvent).toBeDefined();
    expect(noteEvent.metadata.note).toBe('Questa è una nota aggiuntiva');
  });

});
