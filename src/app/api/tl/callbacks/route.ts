import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;

    const legacyContacts = await prisma.contact.findMany({
      where: {
        assignedToId: tlId,
        isPersonalCallback: true
      },
      orderBy: { updatedAt: "desc" },
      include: {
        phones: true
      }
    });

    const stCallbacks = await prisma.trattativaSheet.findMany({
      where: {
        currentOperatorId: tlId,
        status: "RICHIAMO_PERSONALE",
        closedAt: null
      },
      include: {
        contact: { include: { phones: true } }
      }
    });

    const mappedSts = stCallbacks.map(st => ({
      ...st.contact,
      isNewSystem: true,
      trattativaId: st.id
    }));

    // Deduplicate by contact id
    const combined = [...legacyContacts];
    mappedSts.forEach(st => {
      if (!combined.find(c => c.id === st.id)) {
        combined.push(st);
      }
    });

    return NextResponse.json({ contacts: combined });
  } catch (error) {
    console.error("GET tl callbacks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}