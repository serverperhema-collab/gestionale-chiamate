import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "TEAM_LEADER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 3) {
      return NextResponse.json({ contacts: [] });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { originalPhone: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
          { phones: { some: { phone: { contains: q, mode: "insensitive" } } } }
        ]
      },
      take: 20,
      include: {
        phones: true,
        assignedTo: { select: { name: true } },
        appointments: { 
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          select: { operatorId: true, operator: { select: { name: true } } } 
        },
        negotiations: { 
          where: { isAbandoned: false },
          select: { operatorId: true, operator: { select: { name: true } } } 
        }
      }
    });

    const now = new Date();

    const formattedContacts = contacts.map((c) => {
      let isLocked = false;
      let isStrictLocked = false;
      let lockReason = null;

      // Check for active negotiations or appointments
      const activeNeg = c.negotiations?.[0];
      const activeAppt = c.appointments?.[0];

      if (activeNeg) {
        if (activeNeg.operatorId === userId) {
          // It's MY negotiation -> No lock, can manage directly
          isLocked = false;
        } else {
          // It's SOMEONE ELSE's negotiation -> Strict lock
          isLocked = true;
          isStrictLocked = true;
          lockReason = `In Trattativa Personale con: ${activeNeg.operator?.name || "Altro operatore"}`;
        }
      } else if (activeAppt) {
        if (activeAppt.operatorId === userId) {
          // It's MY appointment -> No lock, can manage directly
          isLocked = false;
        } else {
          // SOMEONE ELSE's appointment -> Strict lock
          isLocked = true;
          isStrictLocked = true;
          lockReason = `Ha un appuntamento fissato da: ${activeAppt.operator?.name || "Altro operatore"}`;
        }
      } else {
        // Fallback to basic locks (can be forced)
        if (c.blacklisted) {
          isLocked = true;
          lockReason = "Cestino Permanente (Blacklist)";
        } else if (c.isKo) {
          isLocked = true;
          lockReason = "Scartato (KO)";
        } else if (c.assignedToId && c.assignedToId !== userId) {
          isLocked = true;
          lockReason = `In lavorazione da: ${c.assignedTo?.name || "Altro operatore"}`;
        } else if (c.hiddenUntil && c.hiddenUntil > now) {
          isLocked = true;
          if (c.lastOutcome === "NEGOTIATION") {
            lockReason = "In Trattativa (Nascosto)";
          } else if (c.lastOutcome === "NON_INTERESSATO") {
            lockReason = "Non Interessato (Blocco 90gg)";
          } else {
            lockReason = `Nascosto fino al ${c.hiddenUntil.toLocaleDateString("it-IT")} (Esito recente)`;
          }
        }
      }

      return {
        id: c.id,
        name: c.name,
        address: c.address,
        cap: c.cap,
        phone: c.phones?.[0]?.phone || c.originalPhone || "",
        isLocked,
        isStrictLocked,
        lockReason
      };
    });

    return NextResponse.json({ contacts: formattedContacts });
  } catch (error) {
    console.error("GET contacts/search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
