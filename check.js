const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.usslqzykfdxonotllcgf:Kk2bva6%40%21%21%21@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
    }
  }
});
async function test() {
  try {
    const calllogs = await prisma.callLog.count();
    const scrapings = await prisma.scrapingJob.count();
    console.log('CallLogs:', calllogs);
    console.log('ScrapingJobs:', scrapings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
