import { test, expect } from '@playwright/test';

test.describe('Blocco A - Gestione Utenti', () => {

  test.beforeEach(async ({ page }) => {
    // Login come admin prima di ogni test per ottenere il cookie di sessione
    await page.goto('/login');
    await page.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/tl-dashboard*');
  });

  test('A.2 & A.3 - Creazione Operatore e Commerciale', async ({ page }) => {
    const opPayload = {
      username: `new_op_${Date.now()}`,
      password: 'password123',
      name: 'Nuovo Operatore Test',
      role: 'OPERATORE'
    };

    const commPayload = {
      username: `new_comm_${Date.now()}`,
      password: 'password123',
      name: 'Nuovo Commerciale Test',
      role: 'COMMERCIALE'
    };

    // A.2 - Crea Operatore
    const opRes = await page.request.post('/api/users', { data: opPayload });
    expect(opRes.status()).toBe(200);
    
    // A.3 - Crea Commerciale
    const commRes = await page.request.post('/api/users', { data: commPayload });
    expect(commRes.status()).toBe(200);

    // Verifica persistenza leggendo la lista utenti
    const getRes = await page.request.get('/api/users');
    const getData = await getRes.json();
    expect(getRes.status()).toBe(200);
    
    const users = getData.users;
    const foundOp = users.find((u: any) => u.username === opPayload.username);
    const foundComm = users.find((u: any) => u.username === commPayload.username);
    
    expect(foundOp).toBeDefined();
    expect(foundOp.role).toBe('OPERATORE');
    expect(foundOp.name).toBe(opPayload.name);
    
    expect(foundComm).toBeDefined();
    expect(foundComm.role).toBe('COMMERCIALE');
    expect(foundComm.name).toBe(commPayload.name);
  });

  test('A.4 - Modifica Utente (Lettura e Verifica)', async ({ page }) => {
    // 1. Creiamo un utente da modificare
    const targetPayload = {
      username: `to_edit_${Date.now()}`,
      password: 'password123',
      name: 'Utente da Modificare',
      role: 'OPERATORE'
    };
    
    const createRes = await page.request.post('/api/users', { data: targetPayload });
    const createData = await createRes.json();
    const newUserId = createData.user?.id || createData.id; // Dipende dal payload restituito, se omesso lo cerchiamo

    // Assicuriamoci di avere l'ID
    const getRes = await page.request.get('/api/users');
    const getData = await getRes.json();
    const user = getData.users.find((u: any) => u.username === targetPayload.username);
    expect(user).toBeDefined();
    const userId = user.id;

    // 2. Modifichiamo l'utente
    const patchPayload = {
      name: 'Nome Modificato',
      isActive: false
    };
    
    const patchRes = await page.request.patch(`/api/users/${userId}`, { data: patchPayload });
    expect(patchRes.status()).toBe(200);

    // 3. Rilettura per confermare
    const getRes2 = await page.request.get('/api/users');
    const getData2 = await getRes2.json();
    const modifiedUser = getData2.users.find((u: any) => u.id === userId);
    
    expect(modifiedUser.name).toBe('Nome Modificato');
    expect(modifiedUser.isActive).toBe(false);
  });

  test('A.5 - Modifica Impostazioni Thresholds e Verifica', async ({ page }) => {
    // 1. Creiamo un utente target
    const targetPayload = {
      username: `settings_user_${Date.now()}`,
      password: 'password123',
      name: 'Utente Impostazioni',
      role: 'OPERATORE'
    };
    await page.request.post('/api/users', { data: targetPayload });
    
    const getRes = await page.request.get('/api/users');
    const getData = await getRes.json();
    const user = getData.users.find((u: any) => u.username === targetPayload.username);
    const userId = user.id;

    // 2. Patch delle settings
    const settingsPayload = {
      maxNoAnswer: 15,
      maxNoAnswerMins: 45,
      noAnswerLockTime: 20,
      maxSkip: 5,
      maxSkipMins: 10,
      skipLockTime: 5,
      maxNotAvailable: 10,
      maxNotAvailableMins: 30,
      notAvailableLockTime: 15,
      maxIdleTimeMins: 60,
      maxDeroghe: 2,
      maxDerogheHours: 4,
      maxDailyModifications: 3,
      modLockTimeMins: 5
    };

    const patchRes = await page.request.post(`/api/users/${userId}/settings`, { data: settingsPayload });
    expect(patchRes.status()).toBe(200);

    // 3. Verifica persistenza DB
    // Visto che /api/users non restituisce tutte queste settings (ne restituisce solo alcune),
    // dobbiamo verificare usando un altro endpoint che esponga le impostazioni (se esiste),
    // altrimenti andrebbe implementata o interrogata. Per il test, possiamo usare un approccio 
    // indiretto oppure eseguire una route di dettaglio. Proviamo a vedere se /api/users/[id] ha una GET?
    // In assenza di endpoint dedicato al recap delle configurazioni, verifichiamo almeno i campi restituiti 
    // nella lista (maxDeroghe e maxDerogheHours).
    
    const verifyGetRes = await page.request.get('/api/users');
    const verifyGetData = await verifyGetRes.json();
    const updatedUser = verifyGetData.users.find((u: any) => u.id === userId);
    
    expect(updatedUser.maxDeroghe).toBe(2);
    expect(updatedUser.maxDerogheHours).toBe(4);
  });

});
