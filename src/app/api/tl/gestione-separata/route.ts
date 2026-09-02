import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const requests = await prisma.gestioneSeparataRequest.findMany({
      where: { isResolved: false },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true, originalPhone: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("GET tl gestione separata requests error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = await req.json(); // id is the Request ID, action is "APPROVE" or "REJECT"

    const request = await prisma.gestioneSeparataRequest.findUnique({
      where: { id },
      include: { contact: true }
    });

    if (!request) {
      return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
    }

    const tlId = (session.user as any).id;

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.gestioneSeparataRequest.update({
          where: { id },
          data: { isResolved: true, isApproved: true, resolvedAt: new Date() }
        }),
        prisma.contact.update({
          where: { id: request.contactId },
          data: { 
            isGestioneSeparata: true,
            // Clean up other states so it goes fully to the new pool
            assignedToId: null,
            hiddenUntil: null
          }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: request.contactId,
            action: "GESTIONE_SEPARATA_APPROVED",
            details: "Il TL ha approvato il passaggio a Gestione Separata."
          }
        })
      ]);
    } else if (action === "REJECT") {
      await prisma.$transaction([
        prisma.gestioneSeparataRequest.update({
          where: { id },
          data: { isResolved: true, isApproved: false, resolvedAt: new Date() }
        }),
        prisma.contact.update({
          where: { id: request.contactId },
          data: { 
            assignedToId: null,
            hiddenUntil: null
          }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: request.contactId,
            action: "GESTIONE_SEPARATA_REJECTED",
            details: "Il TL ha rifiutato il passaggio a Gestione Separata."
          }
        })
      ]);
    } else {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH tl gestione separata error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
