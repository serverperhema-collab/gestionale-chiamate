import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { eventEmitter } from "@/lib/eventEmitter";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userName = (session.user as any).name;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Se l'operatore è bloccato per le modifiche, rifiuta
    if (user.role === "OPERATORE" && user.modLockedUntil && user.modLockedUntil > new Date()) {
      return NextResponse.json({ 
        error: "Sei bloccato per troppe modifiche. Attendi o chiedi lo sblocco al TL." 
      }, { status: 403 });
    }

    const contact = await prisma.contact.findUnique({ 
      where: { id: id },
      include: { phones: true }
    });
    if (!contact) return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });

    const body = await req.json();
    const { originalPhone, n2Phone, email, referentName, website, notes, assignedToId, isPersonalCallback } = body;

    const updateData: any = {};
    let isDestructive = false;

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
    }
    if (isPersonalCallback !== undefined) {
      updateData.isPersonalCallback = isPersonalCallback;
    }

    // Check changes and identify if they are destructive (overwriting an existing non-empty value)
    if (originalPhone !== undefined) {
      updateData.originalPhone = originalPhone;
      if (contact.originalPhone && contact.originalPhone.trim() !== "" && contact.originalPhone !== originalPhone) isDestructive = true;
    }
    
    // Gestione N2 (primo numero nella relazione phones)
    const existingN2 = contact.phones?.[0];
    if (n2Phone !== undefined) {
      if (existingN2) {
        if (existingN2.phone !== n2Phone) {
          updateData.phones = {
            update: {
              where: { id: existingN2.id },
              data: { phone: n2Phone }
            }
          };
          if (existingN2.phone.trim() !== "") isDestructive = true;
        }
      } else if (n2Phone.trim() !== "") {
        updateData.phones = {
          create: {
            phone: n2Phone,
            label: "N2"
          }
        };
      }
    }

    if (email !== undefined) {
      updateData.email = email;
      if (contact.email && contact.email.trim() !== "" && contact.email !== email) isDestructive = true;
    }
    if (referentName !== undefined) {
      updateData.referentName = referentName;
      if (contact.referentName && contact.referentName.trim() !== "" && contact.referentName !== referentName) isDestructive = true;
    }
    if (website !== undefined) {
      updateData.website = website;
      if (contact.website && contact.website.trim() !== "" && contact.website !== website) isDestructive = true;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
      // Notes are considered free text, we don't count them as destructive if they just append or change them
    }

    let willLock = false;
    let newModCount = user.dailyModifications;
    let userUpdateData: any = null;

    if (isDestructive && user.role === "OPERATORE") {
      const today = new Date().toISOString().split("T")[0];
      const lastModDate = user.lastModificationDate ? user.lastModificationDate.toISOString().split("T")[0] : null;
      
      if (lastModDate !== today) {
        newModCount = 1;
      } else {
        newModCount += 1;
      }
      
      const maxMods = user.maxDailyModifications ?? 5;
      if (newModCount >= maxMods) {
        willLock = true;
        eventEmitter.emit("tl-alert", { 
          type: "LOCK", 
          operatorName: userName, 
          reason: `Bloccato per troppe modifiche ai contatti esistenti (${newModCount}).` 
        });
      }

      const lockMins = user.modLockTimeMins ?? 10;
      userUpdateData = {
        dailyModifications: newModCount,
        lastModificationDate: new Date(),
        modLockedUntil: willLock ? new Date(Date.now() + lockMins * 60 * 1000) : null
      };
    }

    // Esegui in transazione
    const transaction = [];
    transaction.push(prisma.contact.update({
      where: { id: id },
      data: updateData
    }));

    if (userUpdateData) {
      userUpdateData.lastActivityAt = new Date();
      transaction.push(prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      }));
    } else {
      transaction.push(prisma.user.update({
        where: { id: userId },
        data: { lastActivityAt: new Date() }
      }));
    }

    transaction.push(prisma.activityLog.create({
      data: {
        userId,
        contactId: id,
        action: isDestructive ? "MODIFIED_EXISTING_DATA" : "CONTACT_ENRICHED",
        details: isDestructive ? `Modifica distruttiva: modifiche giornaliere a ${newModCount}` : "Aggiunta dati mancanti"
      }
    }));

    const results = await prisma.$transaction(transaction);
    const updatedContact = results[0];

    const maxMods = user.maxDailyModifications ?? 5;
    return NextResponse.json({ 
      success: true, 
      contact: updatedContact,
      locked: willLock,
      modificationsLeft: isDestructive ? Math.max(0, maxMods - newModCount) : null
    });

  } catch (error) {
    console.error("PATCH contact error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
