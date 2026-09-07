import { test, expect } from '@playwright/test';

test.describe('Blocco H - TL Gestione Richieste (Deroghe e Revisioni)', () => {
  let tlContext: any;
  let opContext: any;
  let commContext: any;

  let opId: string;
  let commId: string;

  let f7ContactId: string;
  let g3TrattativaId: string;
  let h3TrattativaId: string;

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

    // Otteniamo gli ID
    const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
    const usersData = await usersRes.json();
    const op = usersData.users.find((u: any) => u.username === 'test_op');
    opId = op.id;
    const comm = usersData.users.find((u: any) => u.role === 'COMMERCIALE');
    commId = comm?.id || opId; // Fallback

    // TL crea contatti
    const f7Res = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: { name: `Azienda F7 KO ${Date.now()}`, cap: "00100", sector: "IT", ignoreFuzzy: true }
    });
    f7ContactId = (await f7Res.json()).contact.id;
    await tlContext.request.post(`http://localhost:3000/api/contacts/${f7ContactId}/assign`, {
      data: { operatorId: opId }
    });
    await opContext.request.post(`http://localhost:3000/api/contacts/${f7ContactId}/review-request`, {
      data: { notes: "Numero errato", preserveAssignment: false }
    });

    const g3Res = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: { name: `Azienda G3 Deroga ${Date.now()}`, cap: "00100", sector: "IT", ignoreFuzzy: true }
    });
    const contactG3Id = (await g3Res.json()).contact.id;
    await tlContext.request.post(`http://localhost:3000/api/contacts/${contactG3Id}/assign`, {
      data: { operatorId: opId }
    });
    const trRes = await opContext.request.post('http://localhost:3000/api/trattative', {
      data: { contactId: contactG3Id, notes: "Apro", status: "RICHIAMO_PERSONALE" }
    });
    g3TrattativaId = (await trRes.json()).trattativa.id;
    await opContext.request.post(`http://localhost:3000/api/trattative/${g3TrattativaId}/actions`, {
      data: {
        action: "deroga",
        payload: { requestedDate: new Date(Date.now() + 86400000).toISOString(), notes: "Vuole vederti" }
      }
    });

    const h3Res = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: { name: `Azienda H3 Deroga ${Date.now()}`, cap: "00100", sector: "IT", ignoreFuzzy: true }
    });
    const contactH3Id = (await h3Res.json()).contact.id;
    await tlContext.request.post(`http://localhost:3000/api/contacts/${contactH3Id}/assign`, {
      data: { operatorId: opId }
    });
    const trRes2 = await opContext.request.post('http://localhost:3000/api/trattative', {
      data: { contactId: contactH3Id, notes: "Apro", status: "RICHIAMO_PERSONALE" }
    });
    h3TrattativaId = (await trRes2.json()).trattativa.id;
    await opContext.request.post(`http://localhost:3000/api/trattative/${h3TrattativaId}/actions`, {
      data: {
        action: "deroga",
        payload: { requestedDate: new Date(Date.now() + 86400000).toISOString(), notes: "Test H3" }
      }
    });
  });

  test('H.1 - Badge notifiche (alert status)', async () => {
    const res = await tlContext.request.get('http://localhost:3000/api/tl/alerts-status');
    expect(res.status()).toBe(200);
    const data = await res.json();
    
    const reviewAlert = data.alerts.find((a: any) => a.type === "REVIEW_REQUEST" && a.contactId === f7ContactId);
    expect(reviewAlert).toBeDefined();

    const derogaAlertG3 = data.alerts.find((a: any) => a.type === "DEROGA_APP_REQUEST" && a.appId === g3TrattativaId);
    expect(derogaAlertG3).toBeDefined();
    const derogaAlertH3 = data.alerts.find((a: any) => a.type === "DEROGA_APP_REQUEST" && a.appId === h3TrattativaId);
    expect(derogaAlertH3).toBeDefined();
  });

  test('H.4 - Lista richieste deroga (tutte le pending)', async () => {
    const res = await tlContext.request.get('http://localhost:3000/api/tl/reviews');
    expect(res.status()).toBe(200);
    const data = await res.json();

    const derogaG3 = data.reviews.find((r: any) => r.type === 'DEROGA' && r.id === g3TrattativaId);
    expect(derogaG3).toBeDefined();
    
    const reviewF7 = data.reviews.find((r: any) => r.type === 'REVIEW' && r.id === f7ContactId);
    expect(reviewF7).toBeDefined();
  });

  test('H.2 - Approva appuntamento (Deroga)', async () => {
    const res = await tlContext.request.patch(`http://localhost:3000/api/tl/reviews`, {
      data: {
        id: g3TrattativaId,
        action: 'DEROGA_ACCEPT',
        isNewSystem: true
      }
    });
    expect(res.status()).toBe(200);
  });

  test('H.3 - Rifiuta appuntamento (Deroga)', async () => {
    const res = await tlContext.request.patch(`http://localhost:3000/api/tl/reviews`, {
      data: {
        id: h3TrattativaId,
        action: 'DEROGA_REJECT',
        rejectReason: 'Fuori zona',
        isNewSystem: true
      }
    });
    expect(res.status()).toBe(200);
  });

  test('H.5 - Approva KO/Eliminazione', async () => {
    const res = await tlContext.request.patch('http://localhost:3000/api/tl/reviews', {
      data: { id: f7ContactId, action: 'BLACKLIST' }
    });
    expect(res.status()).toBe(200);
  });
});