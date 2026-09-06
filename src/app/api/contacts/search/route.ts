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
        trattativa: true
      }
    });

    const now = new Date();

    const formattedContacts = contacts.map((c) => {
      let isLocked = false;
      let isStrictLocked = false;
      let lockReason = null;

      const activeTrattativa = c.trattativa && c.trattativa.closedAt === null ? c.trattativa : null;

      if (activeTrattativa) {
        if (activeTrattativa.currentOperatorId === userId) {
          isLocked = false;
        } else {
          isLocked = true;
          isStrictLocked = true;
          lockReason = `In Trattativa con operatore ID: ${activeTrattativa.currentOperatorId}`;
        }
      } else {
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
          lockReason = `Nascosto fino al ${c.hiddenUntil.toLocaleDateString("it-IT")} (Esito recente)`;
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