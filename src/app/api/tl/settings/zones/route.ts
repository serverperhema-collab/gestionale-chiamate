import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'TEAM_LEADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all distinct CAPs from Contact table
    const distinctCaps = await prisma.contact.groupBy({
      by: ['cap'],
      _count: {
        cap: true
      }
    });

    // 2. Get all mappings
    const mappings = await prisma.capZoneMapping.findMany();
    const mappingDict: Record<string, string> = {};
    mappings.forEach(m => {
      mappingDict[m.cap] = m.zoneName;
    });

    // 3. Combine with Contacts
    const capSet = new Set(distinctCaps.map(c => c.cap));
    const result = distinctCaps.map(c => ({
      cap: c.cap,
      count: c._count.cap,
      zoneName: mappingDict[c.cap] || null,
      isCustom: !!mappingDict[c.cap]
    }));

    // 4. Inject all Lazio CAPs
    const lazioRanges = [
      { start: 10, end: 199 },    // RM
      { start: 1010, end: 1100 }, // VT
      { start: 2010, end: 2100 }, // RI
      { start: 3010, end: 3100 }, // FR
      { start: 4010, end: 4100 }, // LT
    ];

    for (const range of lazioRanges) {
      for (let i = range.start; i <= range.end; i++) {
        const cap = String(i).padStart(5, '0');
        if (!capSet.has(cap) && mappingDict[cap] !== "HIDDEN") {
          result.push({
            cap,
            count: 0,
            zoneName: mappingDict[cap] || null,
            isCustom: !!mappingDict[cap]
          });
          capSet.add(cap);
        }
      }
    }

    // Include any other CAPs that are in mappings but have 0 contacts
    for (const m of mappings) {
      if (!capSet.has(m.cap) && m.zoneName !== "HIDDEN") {
        result.push({
          cap: m.cap,
          count: 0,
          zoneName: m.zoneName,
          isCustom: true
        });
        capSet.add(m.cap);
      }
    }

    const filteredResult = result.filter(r => mappingDict[r.cap] !== "HIDDEN");
    filteredResult.sort((a, b) => b.count - a.count || a.cap.localeCompare(b.cap)); // Sort by most contacts first, then CAP

    return NextResponse.json({ zones: filteredResult });
  } catch (error) {
    console.error("Error fetching zone settings:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'TEAM_LEADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cap, zoneName } = await req.json();

    if (!cap || !zoneName) {
      return NextResponse.json({ error: 'Missing cap or zoneName' }, { status: 400 });
    }

    const mapping = await prisma.capZoneMapping.upsert({
      where: { cap },
      update: { zoneName },
      create: { cap, zoneName }
    });

    return NextResponse.json({ success: true, mapping });
  } catch (error) {
    console.error("Error saving zone setting:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'TEAM_LEADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cap = searchParams.get('cap');

    if (!cap) {
      return NextResponse.json({ error: 'Missing cap' }, { status: 400 });
    }

    // Instead of deleting, we set it to HIDDEN so it doesn't get re-injected
    await prisma.capZoneMapping.upsert({
      where: { cap },
      update: { zoneName: "HIDDEN" },
      create: { cap, zoneName: "HIDDEN" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting zone:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
