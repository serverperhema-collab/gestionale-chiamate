import { test, expect } from '@playwright/test';

test.describe('Blocco L - Sicurezza e Disciplinare (TL)', () => {
  let tlContext: any;
  let opId: string;

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
  });

  test('L.2 - Sospendi operatore', async () => {
    const res = await tlContext.request.post(`http://localhost:3000/api/users/${opId}/suspend`);
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('L.3 - Riattiva operatore', async () => {
    const res = await tlContext.request.post(`http://localhost:3000/api/users/${opId}/unlock`, { data: {} });
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('L.4 - Rettifica minuti lavorati', async () => {
    const res = await tlContext.request.post(`http://localhost:3000/api/users/${opId}/time-adjust`, {
      data: { minutes: 15, reason: "Test adjustment" }
    });
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('L.5 - Force Logout', async () => {
    const res = await tlContext.request.post(`http://localhost:3000/api/users/${opId}/force-logout`);
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
