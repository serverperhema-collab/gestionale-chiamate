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
    if (!user.isTrusted && user.role === "OPERATORE" && user.modLockedUntil && user.modLockedUntil > new Date()) {
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

    // Track changes for detailed logging
    const changedFields: string[] = [];

    // Check changes and identify if they are destructive (overwriting an existing non-empty value)
    if (originalPhone !== undefined && contact.originalPhone !== originalPhone) {
      updateData.originalPhone = originalPhone;
      const oldVal = contact.originalPhone || "(vuoto)";
      changedFields.push(`Telefono 1: da '${oldVal}' a '${originalPhone}'`);
      if (contact.originalPhone && contact.originalPhone.trim() !== "") isDestructive = true;
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
          const oldVal = existingN2.phone || "(vuoto)";
          changedFields.push(`Telefono 2: da '${oldVal}' a '${n2Phone}'`);
          if (existingN2.phone.trim() !== "") isDestructive = true;
        }
      } else if (n2Phone.trim() !== "") {
        updateData.phones = {
          create: {
            phone: n2Phone,
            label: "N2"
          }
        };
        changedFields.push(`Telefono 2: aggiunto '${n2Phone}'`);
      }
    }

    if (email !== undefined && contact.email !== email) {
      updateData.email = email;
      const oldVal = contact.email || "(vuoto)";
      changedFields.push(`Email: da '${oldVal}' a '${email}'`);
    }
    if (referentName !== undefined && contact.referentName !== referentName) {
      updateData.referentName = referentName;
      const oldVal = contact.referentName || "(vuoto)";
      changedFields.push(`Referente: da '${oldVal}' a '${referentName}'`);
    }
    if (website !== undefined && contact.website !== website) {
      updateData.website = website;
      const oldVal = contact.website || "(vuoto)";
      changedFields.push(`Sito Web: da '${oldVal}' a '${website}'`);
    }
    if (notes !== undefined && contact.notes !== notes) {
      updateData.notes = notes;
      changedFields.push(`Note: aggiornate`);
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
        // NON Blocchiamo più l'operatore, mandiamo solo l'alert
        willLock = false;
        eventEmitter.emit("tl-alert", { 
          type: "ALERT", 
          operatorName: userName, 
          reason: `Attenzione: l'operatore ha modificato molti NUMERI DI TELEFONO esistenti (${newModCount}).` 
        });
      }

      userUpdateData = {
        dailyModifications: newModCount,
        lastModificationDate: new Date(),
        // modLockedUntil: null (rimosso il blocco)
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

    const baseReason = isDestructive 
      ? `Sostituzione dato esistente (contatore giornaliero: ${newModCount})` 
      : "Aggiunta dati mancanti";
      
    const changeSummary = changedFields.length > 0 
      ? `

Dettagli Modifica:
- ${changedFields.join('\n- ')}`
      : "";

    transaction.push(prisma.activityLog.create({
      data: {
        userId,
        contactId: id,
        action: isDestructive ? "DATA_OVERWRITE" : "CONTACT_ENRICHED",
        details: baseReason + changeSummary
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

