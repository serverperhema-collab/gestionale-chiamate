import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      select: { cap: true },
      distinct: ['cap'],
    });
    const caps = contacts.map(c => c.cap);

    const totalContacts = await prisma.contact.count();
    
    // Contatti Google (placeId non inizia con osm/)
    const googleContacts = await prisma.contact.count({
      where: {
        NOT: {
          placeId: {
            startsWith: 'osm/'
          }
        }
      }
    });

    // Contatti Google oggi
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todayGoogleContacts = await prisma.contact.count({
      where: {
        createdAt: {
          gte: startOfToday
        },
        NOT: {
          placeId: {
            startsWith: 'osm/'
          }
        }
      }
    });

    return NextResponse.json({ 
        caps, 
        totalContacts, 
        googleContacts, 
        todayGoogleContacts 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
