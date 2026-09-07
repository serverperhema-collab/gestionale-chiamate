import { test, expect } from '@playwright/test';

test.describe('Blocco J - Monitoraggio e Log (TL)', () => {
  let tlContext: any;
  let opId: string;
  let contactId: string;

  test.beforeAll(async ({ browser }) => {
    tlContext = await browser.newContext();
    const tlPage = await tlContext.newPage();
    await tlPage.goto('http://localhost:3000/login');
    await tlPage.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await tlPage.locator('input[type="password"]').fill('admin123');
    await tlPage.locator('button[type="submit"]').click();
    await tlPage.waitForURL('**/tl-dashboard*');

    const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
    const usersData = await usersRes.json();
    opId = usersData.users.find((u: any) => u.username === 'test_op').id;
    
    // Get a contact for testing J.5
    const cRes = await tlContext.request.get('http://localhost:3000/api/tl/contacts/all?limit=1');
    const cData = await cRes.json();
    if(cData.contacts && cData.contacts.length > 0) {
      contactId = cData.contacts[0].id;
    }
  });

  test('J.1 - Live Monitor', async () => {
    const res = await tlContext.request.get('http://localhost:3000/api/tl/live-monitor');
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.operators).toBeDefined();
  });

  test('J.2 - Report storico', async () => {
    const date = new Date().toISOString().split('T')[0];
    const res = await tlContext.request.get(`http://localhost:3000/api/tl/live-monitor/report?start=${date}&end=${date}`);
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.report).toBeDefined();
  });

  test('J.3 - Log operatore', async () => {
    const res = await tlContext.request.get(`http://localhost:3000/api/logs/operator/${opId}`);
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.logs).toBeDefined();
  });

  test('J.4 - Log globale', async () => {
    const res = await tlContext.request.get('http://localhost:3000/api/logs');
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.logs).toBeDefined();
  });

  test('J.5 - Log chiamate su contatto', async () => {
    if(!contactId) test.skip();
    const res = await tlContext.request.get(`http://localhost:3000/api/logs/contact/${contactId}`);
    if(res.status() !== 200 && res.status() !== 404) { throw new Error(await res.text()); }
    expect([200, 404]).toContain(res.status());
  });
  
  test('J.6 - SSE aggiornamenti real-time', async () => {
    // Just hitting the endpoint to see if it responds with 200
    const res = await tlContext.request.get('http://localhost:3000/api/events');
    expect(res.status()).toBe(200);
  });
});
