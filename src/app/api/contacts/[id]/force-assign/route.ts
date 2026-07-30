import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { eventEmitter } from "@/lib/eventEmitter";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "TEAM_LEADER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userName = (session.user as any).name || "Operatore";

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Se era assegnato ad un altro operatore, loggiamo il "furto" per la TL
      if (contact.assignedToId && contact.assignedToId !== userId) {
        await tx.activityLog.create({
          data: {
            userId,
            contactId: id,
            action: "CONTACT_STOLEN",
            details: `Forzata assegnazione rubando il contatto all'operatore precedente.`
          }
        });
        
        eventEmitter.emit("tl-alert", {
          type: "ALERT",
          operatorName: userName,
          reason: `Ha forzato e recuperato un contatto (ID: ${id}) che era in gestione a un altro operatore o in blocco.`
        });
      }

      await tx.contact.update({
        where: { id },
        data: {
          assignedToId: userId,
          hiddenUntil: null,
          isKo: false, // Se era in KO, viene riesumato
          blacklisted: false // Se era blacklisted, viene riesumato
        }
      });

      await tx.activityLog.create({
        data: {
          userId,
          contactId: id,
          action: "MANUAL_FORCE_ASSIGNMENT",
          details: "L'operatore ha forzato l'estrazione manuale tramite ricerca globale."
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST contacts/force-assign error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
