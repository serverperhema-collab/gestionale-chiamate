import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;
    const body = await req.json();
    const { contactId, newContactData, commercialeId, date, referentName, referentRole, phone, email, clientNeeds, zoneAgendaId } = body;

    if ((!contactId && !newContactData) || !date || !referentName || !referentRole || !phone || !clientNeeds) {
      return NextResponse.json({ error: "Dati obbligatori mancanti" }, { status: 400 });
    }

    const appointment = await prisma.$transaction(async (tx) => {
      let finalContactId = contactId;
      
      if (newContactData) {
        const createdContact = await tx.contact.create({
          data: {
            placeId: `manual_tl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            name: newContactData.name,
            address: `${newContactData.address}, ${newContactData.city} (${newContactData.province})`,
            cap: newContactData.cap,
            sector: "Generico",
            originalPhone: newContactData.phone,
            assignedToId: null,
            phones: newContactData.phone ? {
              create: {
                phone: newContactData.phone,
                label: "Principale"
              }
            } : undefined
          }
        });
        finalContactId = createdContact.id;
      }
      const appt = await tx.appointment.create({
        data: {
          contactId: finalContactId,
          operatorId: tlId, // TL figura come creatore
          commercialeId: commercialeId || null,
          date: new Date(date),
          isDeroga: false,
          isApproved: false,
          status: "PENDING",
          referentName,
          referentRole,
          phone,
          email,
          clientNeeds,
          tlNotes: "Appuntamento fissato manualmente da TL",
          zoneAgendaId: zoneAgendaId || null
        }
      });

      // Il contatto viene aggiornato solo se era esistente per svincolarlo
      if (contactId && !newContactData) {
        await tx.contact.update({
          where: { id: contactId },
          data: {
            assignedToId: null
          }
        });
      }

      await tx.activityLog.create({
        data: {
          userId: tlId,
          contactId: finalContactId,
          action: "TL_CREATED_APPOINTMENT",
          details: `Appuntamento preso per il ${new Date(date).toLocaleString()}`
        }
      });

      return appt;
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("POST create appointment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
