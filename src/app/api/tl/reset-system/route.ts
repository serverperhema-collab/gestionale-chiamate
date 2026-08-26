import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

const RESET_PASSWORD = "8989";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const { password } = await req.json();
    if (password !== RESET_PASSWORD) {
      return NextResponse.json({ error: "Password errata" }, { status: 401 });
    }

    // Esegui il reset in ordine sicuro (rispettando le foreign key)
    // Ordine corretto: prima i figli, poi i genitori (rispetto FK)
    await prisma.appointmentOutcome.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.negotiation.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.callLog.deleteMany();
    await prisma.dailyAssignment.deleteMany();
    await prisma.tlTask.deleteMany();
    await prisma.zoneAgenda.deleteMany();
    await prisma.koRecord.deleteMany();
    await prisma.deletionRequest.deleteMany();

    // Ripristina lo stato di ogni contatto (mantiene anagrafiche e numeri)
    await prisma.contact.updateMany({
      data: {
        noAnswerCount: 0,
        hiddenUntil: null,
        assignedToId: null,
        isKo: false,
        isPersonalCallback: false,
        blacklisted: false,
        blacklistReason: null,
        delegatedToId: null,
        delegatedUntil: null,
        reviewRequestedAt: null,
        reviewNote: null,
        skipCount: 0,
        lastOutcome: null,
        targetCompany: null,
      },
    });

    // Pulisce i blocchi di sicurezza degli operatori (mantiene account e impostazioni)
    await prisma.user.updateMany({
      data: {
        skipCount: 0,
        skipLockedUntil: null,
        noAnswerLockedUntil: null,
        notAvailableLockedUntil: null,
        dailyModifications: 0,
        lastModificationDate: null,
        modLockedUntil: null,
        lastActivityAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Errore interno durante il reset" }, { status: 500 });
  }
}
