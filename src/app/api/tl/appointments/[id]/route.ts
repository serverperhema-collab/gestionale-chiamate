import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            phones: true,
            callLogs: {
              include: { user: { select: { name: true } } },
              orderBy: { createdAt: 'desc' }
            },
            activityLogs: {
              include: { user: { select: { name: true } } },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        operator: { select: { name: true } },
        commerciale: { select: { name: true } },
        zoneAgenda: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Non trovato" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("GET appointment error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const {
      companyName,
      address,
      city,
      province,
      cap,
      referentName,
      referentRole,
      phone,
      email,
      clientNeeds,
      date,
      zoneAgendaId,
      operatorId,
      isPhoneAppt
    } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { contact: true, operator: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
    }

    // Handle zoneAgenda changes
    let newCommercialeId = appointment.commercialeId;
    let newZoneAgendaId = zoneAgendaId;
    
    let newIsDeroga = appointment.isDeroga;
    let newIsApproved = appointment.isApproved;
    
    if (zoneAgendaId === "NONE" || zoneAgendaId === null) {
      newZoneAgendaId = null;
      newCommercialeId = null;
    } else if (zoneAgendaId !== undefined && zoneAgendaId !== appointment.zoneAgendaId) {
      const agenda = await prisma.zoneAgenda.findUnique({ where: { id: zoneAgendaId } });
      if (agenda) {
        newCommercialeId = agenda.commercialeId;
        // Se stiamo assegnando un'agenda valida a un appuntamento in deroga, la deroga scompare
        if (appointment.isDeroga) {
          newIsDeroga = false;
          newIsApproved = true;
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Contact
      await tx.contact.update({
        where: { id: appointment.contactId },
        data: {
          name: companyName !== undefined ? companyName : appointment.contact.name,
          address: address !== undefined ? address : appointment.contact.address,
          cap: cap !== undefined ? cap : appointment.contact.cap,
        }
      });

      // 2. Update Appointment
      await tx.appointment.update({
        where: { id },
        data: {
          referentName: referentName !== undefined ? referentName : appointment.referentName,
          referentRole: referentRole !== undefined ? referentRole : appointment.referentRole,
          phone: phone !== undefined ? phone : appointment.phone,
          email: email !== undefined ? email : appointment.email,
          clientNeeds: clientNeeds !== undefined ? clientNeeds : appointment.clientNeeds,
          date: date ? new Date(date) : appointment.date,
          zoneAgendaId: newZoneAgendaId !== undefined ? newZoneAgendaId : appointment.zoneAgendaId,
          commercialeId: newCommercialeId,
          operatorId: operatorId !== undefined ? operatorId : appointment.operatorId,
          isPhoneAppt: isPhoneAppt !== undefined ? isPhoneAppt : appointment.isPhoneAppt,
          isDeroga: newIsDeroga,
          isApproved: newIsApproved
        }
      });

      // 3. Log Activity if operator changed
      if (operatorId !== undefined && operatorId !== appointment.operatorId) {
        await tx.activityLog.create({
          data: {
            userId: (session.user as any).id,
            contactId: appointment.contactId,
            action: "TL_CHANGED_OPERATOR",
            details: `Il TL ha riassegnato l'appuntamento dall'operatore ${appointment.operator.name} (ID: ${appointment.operatorId}) a un altro operatore (ID: ${operatorId}).`
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/tl/appointments/[id] error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
