import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.isSuspended) {
      return NextResponse.json({ 
        error: "Sei stato sospeso a tempo indeterminato. Contatta la Team Leader.", 
        isSuspended: true 
      }, { status: 403 });
    }

    if (user.noAnswerLockedUntil && user.noAnswerLockedUntil > new Date()) {
      return NextResponse.json({ error: "Sei bloccato per troppi 'Non Risponde' ravvicinati.", noAnswerLocked: true, lockedUntil: user.noAnswerLockedUntil.toISOString() }, { status: 403 });
    }
    if (user.notAvailableLockedUntil && user.notAvailableLockedUntil > new Date()) {
      return NextResponse.json({ error: "Sei bloccato per troppi 'Non Reperibile' ravvicinati.", notAvailableLocked: true, lockedUntil: user.notAvailableLockedUntil.toISOString() }, { status: 403 });
    }
    if (user.skipLockedUntil && user.skipLockedUntil > new Date()) {
      return NextResponse.json({ error: "Sei bloccato per troppi 'Skip' ravvicinati.", skipLocked: true, lockedUntil: user.skipLockedUntil.toISOString() }, { status: 403 });
    }

    // First check if the user already has a contact assigned to them (from manual creation or pending)
    const currentAssigned = await prisma.contact.findFirst({
      where: { assignedToId: userId, isKo: false, isPersonalCallback: false },
      include: { phones: true, callLogs: { orderBy: { createdAt: "desc" }, take: 5 } }
    });

    if (currentAssigned) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActivityAt: new Date() }
      });
      return NextResponse.json({ contact: currentAssigned, skipLocked: !!(user.skipLockedUntil && user.skipLockedUntil > new Date()) });
    }

    // Find today's assignment for this operator
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const assignment = await prisma.dailyAssignment.findFirst({
      where: {
        userId,
        date: startOfDay
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Nessuna assegnazione per oggi. Contatta il Team Leader." }, { status: 404 });
    }

    // Parse CAPs (comma separated)
    const caps = assignment.cap.split(",").map(c => c.trim()).filter(c => c.length > 0);

    // Filter conditions
    const whereCondition: any = {
      isKo: false,
      assignedToId: null, // Not assigned to anyone else
      OR: [
        { hiddenUntil: null },
        { hiddenUntil: { lte: new Date() } }
      ],
      cap: { in: caps }
    };

    // Note: Campaign filtering by sector is omitted until sectors are mapped to campaigns

    // 1. Find the minimum noAnswerCount available
    const minAgg = await prisma.contact.aggregate({
      where: whereCondition,
      _min: { noAnswerCount: true }
    });

    if (minAgg._min.noAnswerCount === null) {
      return NextResponse.json({ error: "Nessun contatto disponibile per i CAP assegnati." }, { status: 404 });
    }

    // 2. Fetch all contacts with that minimum count
    const candidateContacts = await prisma.contact.findMany({
      where: {
        ...whereCondition,
        noAnswerCount: minAgg._min.noAnswerCount
      },
      select: { id: true }
    });

    if (candidateContacts.length === 0) {
      return NextResponse.json({ error: "Nessun contatto disponibile." }, { status: 404 });
    }

    // 3. Pick a random contact
    const randomIndex = Math.floor(Math.random() * candidateContacts.length);
    const selectedContactId = candidateContacts[randomIndex].id;

    // 4. Assign the contact to the operator to lock it
    const updatedContact = await prisma.contact.update({
      where: { id: selectedContactId },
      data: { assignedToId: userId },
      include: { phones: true, callLogs: { orderBy: { createdAt: "desc" }, take: 5 } }
    });

    // 5. Log the extraction
    await prisma.activityLog.create({
      data: {
        userId,
        contactId: selectedContactId,
        action: "CONTACT_EXTRACTED",
        details: "Contatto pescato dal calderone"
      }
    });

    // Update last activity
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() }
    });

    return NextResponse.json({ 
      contact: updatedContact,
      skipLocked: !!(user.skipLockedUntil && user.skipLockedUntil > new Date())
    });

  } catch (error) {
    console.error("GET next contact error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
