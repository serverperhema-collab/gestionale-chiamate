import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "REQUESTS";
    
    const statusFilter = type === "REQUESTS" ? "PREVENTIVO" : "TRATTATIVA_IN_CORSO";

    const trattative = await prisma.trattativaSheet.findMany({
      where: { status: statusFilter },
      include: {
        contact: true,
        currentCommerciale: { select: { name: true } },
        appointments: {
          orderBy: { date: "desc" },
          take: 1
        },
        attachments: { orderBy: { createdAt: "desc" } }
      }
    });

    const items = trattative.map(st => {
      const appt = st.appointments[0];
      const attachment = st.attachments.find((a: any) => a.type === "PREVENTIVO");
      return {
        id: st.id,
        isNewSystem: true,
        status: st.status === "PREVENTIVO" ? "PENDING" : "COMPLETATO",
        notes: st.outcomeNotes || "",
        tlNotes: "",
        quoteUrl: attachment?.url || null,
        appointment: {
          date: appt?.date || new Date(),
          contact: { name: st.contact.name, address: st.contact.address || "", cap: st.contact.cap },
          commerciale: { name: st.currentCommerciale?.name || "Sconosciuto" }
        },
        commerciale: { name: st.currentCommerciale?.name || "Sconosciuto" }
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
