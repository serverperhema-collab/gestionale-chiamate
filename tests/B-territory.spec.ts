import { test, expect } from '@playwright/test';

test.describe('Blocco B - Zone e Agende', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/tl-dashboard*');
  });

  test('B.1 & B.2 - Creazione Zona/CAP e Lettura (Zones)', async ({ page }) => {
    const payload = {
      cap: `999${Math.floor(Math.random() * 100)}`, // CAP Random per evitare conflitti
      zoneName: 'Zona Playwright Test'
    };

    // B.1 Creazione
    const createRes = await page.request.post('/api/tl/settings/zones', { data: payload });
    expect(createRes.status()).toBe(200);

    // B.2 Lettura
    const getRes = await page.request.get('/api/tl/settings/zones');
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    
    // Verifichiamo che il cap sia stato creato
    const foundCap = getData.zones.find((z: any) => z.cap === payload.cap);
    expect(foundCap).toBeDefined();
    expect(foundCap.zoneName).toBe(payload.zoneName);
  });

  test('B.3 & B.4 - Creazione e Lettura Agenda (FAIL EXPECTED SE MANCANTE)', async ({ page }) => {
    const agendaPayload = {
      name: 'Agenda Nord',
      date: new Date().toISOString(),
      caps: ['00119']
    };

    // Proviamo a chiamare l'endpoint per le Agende 
    const createRes = await page.request.post('/api/tl/calendar', { data: agendaPayload });
    
    if (createRes.status() === 404) {
      console.log("⚠️ B.3 fallito: Endpoint /api/tl/calendar non trovato. Bug da riportare.");
    }
    
    expect(createRes.status()).not.toBe(404);
    expect(createRes.status()).toBe(200);

    // Lettura Agende
    const getRes = await page.request.get('/api/tl/calendar');
    expect(getRes.status()).toBe(200);
  });

});
