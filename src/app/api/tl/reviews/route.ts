import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { TrattativaService } from "@/lib/services/TrattativaService";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const reviews: any[] = [];

    const deroghe = await prisma.trattativaSheet.findMany({
      where: { derogaStatus: "PENDING" },
      include: {
        contact: true,
        events: {
          where: { eventType: "DEROGA_RICHIESTA" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    for (const d of deroghe) {
      reviews.push({
        id: d.id,
        type: 'DEROGA',
        isNewSystem: true,
        contactName: d.contact?.name || "Sconosciuto",
        contactId: d.contactId,
        date: d.nextActionDate || new Date().toISOString(),
        referentName: d.referentName || "",
        clientNeeds: d.clientNeeds || "",
        derogaDate: d.events[0]?.createdAt || d.updatedAt,
        reviewNote: d.events[0]?.metadata?.notes || "Nessuna nota"
      });
    }

    const now = new Date();
    const hiddenContacts = await prisma.contact.findMany({
      where: {
        assignedToId: null,
        hiddenUntil: { gt: now }
      },
      include: {
        activityLogs: {
          where: { action: "CONTACT_REVIEW_REQUESTED" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    for (const c of hiddenContacts) {
      if (c.activityLogs.length > 0) {
        reviews.push({
          id: c.id,
          contactId: c.id,
          type: 'REVIEW',
          name: c.name,
          reviewNote: c.activityLogs[0].details,
          date: c.activityLogs[0].createdAt
        });
      }
    }

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { id, action, newDate, rejectReason, isNewSystem } = body;

    if (isNewSystem && action.startsWith("DEROGA_")) {
      const service = new TrattativaService();
      let approved = false;
      let payloadDate: string | undefined;

      if (action === "DEROGA_ACCEPT") {
        approved = true;
      } else if (action === "DEROGA_RESCHEDULE") {
        approved = true;
        payloadDate = newDate;
      } else if (action === "DEROGA_REJECT") {
        approved = false;
      }

      await service.resolveDeroga(id, { approved, newDate: payloadDate, rejectReason }, userId, "TEAM_LEADER" as Role);
      return NextResponse.json({ success: true });
    }

    if (action === "RESTORE" || action === "BLACKLIST") {
      const isKo = action === "BLACKLIST";
      
      await prisma.$transaction(async (tx) => {
        const contact = await tx.contact.findUnique({ where: { id } });
        if (!contact) throw new Error("Contact not found");

        await tx.contact.update({
          where: { id },
          data: {
            hiddenUntil: null
          }
        });

        if (isKo) {
          await tx.koRecord.create({
            data: {
              contactId: id,
              isResolved: true,
              frozenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
          });
        }

        await tx.activityLog.create({
          data: {
            userId,
            contactId: id,
            action: isKo ? "CONTACT_KO_APPROVED" : "CONTACT_RESTORED",
            details: isKo ? "Contatto scartato da TL" : "Contatto ripristinato da TL"
          }
        });
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH reviews error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}