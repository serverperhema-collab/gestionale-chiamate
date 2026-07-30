const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const appts = await prisma.appointment.findMany({
    where: { zoneAgendaId: { not: null } },
    include: { zoneAgenda: true }
  });
  
  let fixedCount = 0;
  
  for (const appt of appts) {
    if (appt.zoneAgenda) {
      const apptDate = new Date(appt.date);
      const agendaDate = new Date(appt.zoneAgenda.date);
      
      if (apptDate.getFullYear() !== agendaDate.getFullYear() ||
          apptDate.getMonth() !== agendaDate.getMonth() ||
          apptDate.getDate() !== agendaDate.getDate()) {
        
        const newDate = new Date(agendaDate);
        newDate.setHours(apptDate.getHours(), apptDate.getMinutes());
        
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { date: newDate }
        });
        
        fixedCount++;
        console.log(`Fixed appt ${appt.id}`);
      }
    }
  }
  
  console.log('Total fixed: ' + fixedCount);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
