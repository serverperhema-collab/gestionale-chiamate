import { test, expect } from '@playwright/test';

test.describe('Blocco C - Contatti e Anagrafiche', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/tl-dashboard*');
  });

  test('C.5 - Creazione Manuale (Verifica Persistenza)', async ({ page }) => {
    const contactPayload = {
      name: `Ristorante Nuovo ${Date.now()}`,
      cap: '00120',
      phone: `069${Math.floor(Math.random() * 1000000)}`,
      sector: 'Ristorazione',
      isNotInterested: false,
      ignoreFuzzy: false
    };

    // Creazione contatto manuale
    const createRes = await page.request.post('/api/contacts/manual', { data: contactPayload });
    expect(createRes.status()).toBe(200);
    const createData = await createRes.json();
    
    expect(createData.contact).toBeDefined();
    expect(createData.contact.name).toBe(contactPayload.name);
    
    // Assicuriamoci che persista richiamando il dettaglio
    const getRes = await page.request.get(`/api/contacts/${createData.contact.id}/details`);
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData.contact.name).toBe(contactPayload.name);
  });

  test('C.4 - Logica Levenshtein (Fuzzy Duplicates)', async ({ page }) => {
    // 1. Creiamo un contatto base
    const basePayload = {
      name: `Pizzeria Napoli ${Date.now()}`,
      cap: '00121',
      phone: `069${Math.floor(Math.random() * 1000000)}`,
      sector: 'Ristorazione'
    };
    await page.request.post('/api/contacts/manual', { data: basePayload });

    // 2. Creiamo un contatto simile (errore di battitura, es: Pizeria Napoli)
    const similePayload = {
      name: basePayload.name.replace('Pizzeria', 'Pizeria'),
      cap: '00121', // Stesso CAP per innescare fuzzy
      phone: `069${Math.floor(Math.random() * 1000000)}`,
      sector: 'Ristorazione',
      ignoreFuzzy: false
    };

    const fuzzyRes = await page.request.post('/api/contacts/manual', { data: similePayload });
    
    // Dovrebbe fermarsi e restituire un 409 o un payload con i duplicati
    expect(fuzzyRes.status()).toBe(409);
    const fuzzyData = await fuzzyRes.json();
    expect(fuzzyData.fuzzyMatch).toBeDefined();
    expect(fuzzyData.contact).toBeDefined();
  });

  test('C.6 & C.7 - Lista e Ricerca', async ({ page }) => {
    const uniqueName = `TargetSearch_${Date.now()}`;
    const payload = {
      name: uniqueName,
      cap: '00122',
      phone: `068${Math.floor(Math.random() * 10000000)}`,
      sector: 'Uffici',
      ignoreFuzzy: false
    };
    await page.request.post('/api/contacts/manual', { data: payload });

    // C.6 - Lista standard
    const listRes = await page.request.get('/api/contacts');
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    expect(listData.data).toBeDefined();
    expect(listData.data.length).toBeGreaterThan(0);

    // C.7 - Ricerca effettiva
    const searchRes = await page.request.get(`/api/contacts?search=${uniqueName}`);
    expect(searchRes.status()).toBe(200);
    const searchData = await searchRes.json();
    
    // Deve trovare esattamente (o almeno) il nostro contatto
    expect(searchData.data).toBeDefined();
    expect(searchData.data.length).toBeGreaterThan(0);
    const found = searchData.data.find((c: any) => c.name === uniqueName);
    expect(found).toBeDefined();
    expect(found.cap).toBe('00122');
  });

  test('C.3 - Importazione Lista CSV (FAIL EXPECTED SE MANCANTE)', async ({ page }) => {
    // Poiché non c'è traccia di un vero endpoint di import CSV dedicato (es. /api/contacts/import) 
    // proveremo a lanciare la chiamata, se fallisce con 404 è confermato come Bug.
    
    const csvContent = "name,cap,phone,sector\nTest CSV,00119,06111111,Varie";
    const buffer = Buffer.from(csvContent, 'utf-8');

    // Usiamo il multpart per simulare il caricamento del file (se ci fosse un endpoint)
    const importRes = await page.request.post('/api/contacts/import', {
      multipart: {
        file: {
          name: 'test.csv',
          mimeType: 'text/csv',
          buffer: buffer
        }
      }
    });

    if (importRes.status() === 404) {
      console.log("⚠️ C.3 fallito: Endpoint /api/contacts/import non trovato. Bug da riportare.");
    }
    
    expect(importRes.status()).not.toBe(404);
  });

});
