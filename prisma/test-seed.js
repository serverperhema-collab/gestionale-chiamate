const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function cleanDB() {
  console.log('🧹 Pulizia Database in corso...');
  
  // Ordine di cancellazione per evitare errori di Foreign Key
  await prisma.trattativaEvent.deleteMany({});
  await prisma.trattativaAttachment.deleteMany({});
  await prisma.trattativaAppointment.deleteMany({});
  await prisma.trattativaSheet.deleteMany({});
  
  await prisma.notification.deleteMany({});
  await prisma.gestioneSeparataRequest.deleteMany({});
  await prisma.systemLock.deleteMany({});
  
  await prisma.scrapingJobEvent.deleteMany({});
  await prisma.queryStrategyStat.deleteMany({});
  await prisma.scrapingQuery.deleteMany({});
  await prisma.queryFamily.deleteMany({});
  await prisma.scrapingJob.deleteMany({});
  await prisma.osmQueryCache.deleteMany({});
  
  await prisma.attendance.deleteMany({});
  await prisma.capZoneMapping.deleteMany({});
  await prisma.zoneAgenda.deleteMany({});
  
  await prisma.koRecord.deleteMany({});
  await prisma.deletionRequest.deleteMany({});
  await prisma.tlTask.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.callLog.deleteMany({});
  await prisma.contactPhone.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.dailyAssignment.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('✅ Database pulito.');
}

async function seedDB() {
  console.log('🌱 Popolamento Database in corso...');
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordTest = await bcrypt.hash('Test1234', 10);

  // 1. UTENTI
  const tl = await prisma.user.create({
    data: { username: 'test_admin', password: passwordAdmin, role: 'TEAM_LEADER', name: 'Test TL' }
  });

  const op = await prisma.user.create({
    data: { username: 'test_op', password: passwordTest, role: 'OPERATORE', name: 'Test Operatore' }
  });

  const comm = await prisma.user.create({
    data: { username: 'test_comm', password: passwordTest, role: 'COMMERCIALE', name: 'Test Commerciale' }
  });
  
  // 2. IMPOSTAZIONI (Zone e Mapping)
  const agenda = await prisma.zoneAgenda.create({
    data: { name: 'Agenda Test', date: new Date(), caps: ['00119'] }
  });
  
  await prisma.capZoneMapping.create({
    data: { cap: '00119', zoneName: 'Zona Test' }
  });

  // 3. ASSEGNAZIONE GIORNALIERA
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.dailyAssignment.create({
    data: { userId: op.id, date: today, cap: '00119', campaign: 'ENTRAMBI' }
  });

  // 4. CONTATTI ESTRAIBILI (Perfetti per E.1)
  const contacts = [
    { name: 'Ristorante Test 1', cap: '00119', address: 'Roma', telefono: '0612345601', sector: 'Ristorazione' },
    { name: 'Ristorante Test 2', cap: '00119', address: 'Roma', telefono: '0612345602', sector: 'Ristorazione' },
    { name: 'Ristorante Test 3', cap: '00119', address: 'Roma', telefono: '0612345603', sector: 'Ristorazione' },
  ];

  for (const c of contacts) {
    await prisma.contact.create({
      data: {
        name: c.name,
        sector: c.sector,
        cap: c.cap,
        address: c.address,
        source: 'MANUAL',
        originalPhone: c.telefono,
        phones: { create: [{ phone: c.telefono, label: 'Principale' }] }
      }
    });
  }

  // 5. CONTATTO PER SCRAPER ANTI-DUPLICAZIONE
  await prisma.contact.create({
    data: {
      name: 'Scraper Target Srl',
      sector: 'Uffici',
      cap: '00119',
      address: 'Roma',
      source: 'GOOGLE',
      originalPhone: '0699999999',
    }
  });

  console.log('✅ Dataset caricato con successo.');
  console.log(`TL: ${tl.username} | OP: ${op.username} | COMM: ${comm.username}`);
}

async function run() {
  try {
    await cleanDB();
    await seedDB();
  } catch (e) {
    console.error('❌ Errore durante il seed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
