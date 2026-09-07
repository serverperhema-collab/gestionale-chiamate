import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Blocco M - App Commerciale', () => {
  let commContext: any;
  let tlContext: any;
  let opContext: any;
  let cId: string;
  let trId: string;
  let apptId: string;

  test.beforeAll(async ({ browser }) => {
    // 1. Setup TL
    tlContext = await browser.newContext();
    const tlPage = await tlContext.newPage();
    await tlPage.goto('http://localhost:3000/login');
    await tlPage.getByPlaceholder(/Inserisci username/i).fill('test_admin');
    await tlPage.locator('input[type="password"]').fill('admin123');
    await tlPage.locator('button[type="submit"]').click();
    await tlPage.waitForURL('**/tl-dashboard*');

    // 2. Trova Operatore e Commerciale Test
    const usersRes = await tlContext.request.get('http://localhost:3000/api/users');
    const usersData = await usersRes.json();
    const comm = usersData.users.find((u: any) => u.username === 'test_comm');
    const op = usersData.users.find((u: any) => u.username === 'test_op');

    // 3. Setup Comm
    commContext = await browser.newContext();
    const commPage = await commContext.newPage();
    await commPage.goto('http://localhost:3000/login');
    await commPage.getByPlaceholder(/Inserisci username/i).fill('test_comm');
    await commPage.locator('input[type="password"]').fill('comm123');
    await commPage.locator('button[type="submit"]').click();
    await commPage.waitForURL('**/commercial-app*');

    // 4. Setup Op
    opContext = await browser.newContext();
    const opPage = await opContext.newPage();
    await opPage.goto('http://localhost:3000/login');
    await opPage.getByPlaceholder(/Inserisci username/i).fill('test_op');
    await opPage.locator('input[type="password"]').fill('operatore123');
    await opPage.locator('button[type="submit"]').click();
    await opPage.waitForURL('**/operator-terminal*');

    // Crea contatto e assegna
    const createRes = await tlContext.request.post('http://localhost:3000/api/contacts/manual', {
      data: { name: `Azienda Comm M ${Date.now()}`, cap: "00100", sector: "IT", ignoreFuzzy: true }
    });
    cId = (await createRes.json()).contact.id;
    
    await tlContext.request.post(`http://localhost:3000/api/contacts/${cId}/assign`, {
      data: { operatorId: op.id }
    });
    
    // OP crea trattativa e appuntamento assegnato al commerciale
    const trRes = await opContext.request.post('http://localhost:3000/api/trattative', {
      data: { contactId: cId, notes: "Apro per Comm M", status: "RICHIAMO_PERSONALE" }
    });
    trId = (await trRes.json()).trattativa.id;

    const apptRes = await opContext.request.post(`http://localhost:3000/api/trattative/${trId}/actions`, {
      data: {
        action: "appuntamento",
        payload: { date: new Date().toISOString(), isPhoneAppt: false, referentName: "Mario", phone: "123", commercialeId: comm.id }
      }
    });
    const json = await apptRes.json(); console.log('JSON IS', json); apptId = json.result.id;
  });

  test('M.1 - Agenda commerciale (lista appuntamenti)', async () => {
    // Check if the appointment is returned in /api/trattative for the commerciale
    const res = await commContext.request.get('http://localhost:3000/api/trattative');
    expect(res.status()).toBe(200);
    const data = await res.json();
    const myAppt = data.trattative.find((t: any) => t.id === trId);
    expect(myAppt).toBeDefined();
    expect(myAppt.status).toBe('APPUNTAMENTO');
  });

  test('M.2 - Inserisci esito visita e M.3 - Richiedi preventivo', async () => {
    // Commerciale invia esito chiedendo un preventivo
    const res = await commContext.request.post(`http://localhost:3000/api/trattative/${trId}/actions`, {
      data: {
        action: "esito",
        payload: {
          appointmentId: apptId,
          outcomeFinal: "TRATTATIVA_IN_CORSO",
          outcomeNotes: "Cliente interessato, preparare preventivo",
          nextActionType: "PREVENTIVO",
          nextActionDate: new Date(Date.now() + 86400000).toISOString()
        }
      }
    });
    if(res.status()!==200) { throw new Error(await res.text()); } expect(res.status()).toBe(200);
    
    // Verifica che lo status sia PREVENTIVO
    const trRes = await commContext.request.get('http://localhost:3000/api/trattative');
    const data = await trRes.json();
    const myAppt = data.trattative.find((t: any) => t.id === trId);
    expect(myAppt.status).toBe('PREVENTIVO');
  });

  test('M.4 - Lista preventivi (TL)', async () => {
    const res = await tlContext.request.get('http://localhost:3000/api/tl/quotes?type=REQUESTS');
    if(res.status()!==200) { throw new Error(await res.text()); } expect(res.status()).toBe(200);
    const data = await res.json();
    const quoteReq = data.items.find((q: any) => q.id === trId);
    expect(quoteReq).toBeDefined();
    expect(quoteReq.status).toBe('PENDING');
  });

  test('M.5 - Carica allegato/preventivo (TL)', async () => {
    // TL uploads preventivo
    const res = await tlContext.request.post(`http://localhost:3000/api/trattative/${trId}/actions`, {
      data: {
        action: "preventivo-complete",
        payload: {
          url: "https://example.com/preventivo.pdf",
          notes: "Ecco il preventivo",
          nextActionDate: new Date(Date.now() + 86400000).toISOString()
        }
      }
    });
    if(res.status()!==200) { throw new Error(await res.text()); } expect(res.status()).toBe(200);

    // Verifica che lo status sia tornato a TRATTATIVA_IN_CORSO
    const trRes = await commContext.request.get('http://localhost:3000/api/trattative');
    const data = await trRes.json();
    const myAppt = data.trattative.find((t: any) => t.id === trId);
    expect(myAppt.status).toBe('TRATTATIVA_IN_CORSO');
  });
});
