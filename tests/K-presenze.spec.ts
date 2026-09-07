import { test, expect } from '@playwright/test';

test.describe('Blocco K - Gestione Presenze (TL)', () => {
  let tlContext: any;
  let opId: string;
  let attId: string;

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

  test('K.2 - Segna assenza (TL)', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await tlContext.request.post('http://localhost:3000/api/tl/attendance', {
      data: {
        userId: opId,
        date: new Date(today + 'T00:00:00Z').toISOString(),
        status: 'ASSENTE',
        shiftMorning: false,
        shiftAfternoon: false,
        hoursWorked: 0,
        reason: 'FERIE',
        customReason: ''
      }
    });
    
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.record.id).toBeDefined();
    expect(data.record.status).toBe('ASSENTE');
    attId = data.record.id;
  });

  test('K.1 - Registro presenze (TL)', async () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    
    const res = await tlContext.request.get(`http://localhost:3000/api/tl/attendance?from=${firstDay}&to=${lastDay}`);
    
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    const data = await res.json();
    
    expect(data.operators).toBeDefined();
    const op = data.operators.find((o: any) => o.id === opId);
    expect(op).toBeDefined();
    expect(op.stats.ferie).toBeGreaterThanOrEqual(1);
  });

  test('K.3 - Elimina record presenza (TL)', async () => {
    const res = await tlContext.request.delete(`http://localhost:3000/api/tl/attendance/${attId}`);
    if(res.status() !== 200) { throw new Error(await res.text()); }
    expect(res.status()).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
