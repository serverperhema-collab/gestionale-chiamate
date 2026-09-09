const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const contact = await prisma.contact.findFirst();
  console.log(contact);
  
  // also let's check the API directly using mock Next.js req/res (too complex)
  // Let's just output the contact.
}
main();
