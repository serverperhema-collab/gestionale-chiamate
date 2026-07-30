import { prisma } from "./prisma";

export async function checkExpiredDelegations() {
  const now = new Date();
  
  // Trova �֠ycontatti delegati il cui tempo di delega � scaduto
  const expiredContacts = await prisma.contact.findMany({
    where: {
      delegatedUntil: {
        lte: now
      }
    },
    include: {
      negotiations: {
        where: {
          isAbandoned: false,
          isExpired: false
        }
      }
    }
  });

  for (const contact of expiredContacts) {
    const activeNegotiation = contact.negotiations[0];
    const originalOperatorId = activeNegotiation?.originalOperatorId;
    
    if (originalOperatorId) {
      await prisma.$transaction([
        prisma.negotiation.update({
          where: { id: activeNegotiation.id },
          data: {
            operatorId: originalOperatorId,
            originalOperatorId: null
          }
        }),
        prisma.contact.update({
          where: { id: contact.id },
          data: {
            assignedToId: originalOperatorId,
            delegatedToId: null,
            delegatedUntil: null
          }
        })
      ]);
      console.log(`Reverted delegation for contact ${contact.id} back to operator ${originalOperatorId}`);
    } else {
      // Se non c'� una negoziazione attiva, puliamo solo il contact
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          assignedToId: null,
          delegatedToId: null,
          delegatedUntil: null
        }
      });
    }
  }
}