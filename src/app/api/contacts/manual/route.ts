import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

function simplifyName(name: string): string {
  return name.toLowerCase()
    .replace(/\b(srl|spa|snc|sas|sapa|srls)\b/g, '') // Rimuovi suffissi legali
    .replace(/[^a-z0-9]/g, '') // Rimuovi spazi e punteggiatura
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== "OPERATORE" && userRole !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, cap, phone, sector, isNotInterested, ignoreFuzzy } = body;

    if (!name || !cap) {
      return NextResponse.json({ error: "Nome e CAP sono obbligatori" }, { status: 400 });
    }

    // Fuzzy matching logic per evitare doppioni di nome nel medesimo CAP
    const simplifiedInputName = simplifyName(name);

    // Fetch contacts in the same CAP
    const existingContacts = await prisma.contact.findMany({
      where: { cap }
    });

    if (!ignoreFuzzy) {
      // Trova duplicati esatti o simili (Levenshtein <= 2)
      let duplicate = existingContacts.find(c => simplifyName(c.name) === simplifiedInputName);
      
      if (!duplicate) {
        // Cerca doppione fuzzy (permette fino a 2 errori) e scarta nomi troppo corti per evitare falsi positivi
        if (simplifiedInputName.length > 4) {
          duplicate = existingContacts.find(c => {
            const sn = simplifyName(c.name);
            return sn.length > 4 && levenshtein(sn, simplifiedInputName) <= 2;
          });
        }
      }

      if (duplicate) {
        const now = new Date();
        const isBlocked = 
          duplicate.isKo || 
          duplicate.blacklisted || 
          (duplicate.hiddenUntil && duplicate.hiddenUntil > now) ||
          (duplicate.assignedToId && duplicate.assignedToId !== userId);

        let blockReason = "";
        if (duplicate.isKo || duplicate.blacklisted) blockReason = "Contatto KO o in Blacklist";
        else if (duplicate.hiddenUntil && duplicate.hiddenUntil > now) blockReason = "Contatto in pausa (Non interessato/Non reperibile)";
        else if (duplicate.assignedToId && duplicate.assignedToId !== userId) blockReason = "Assegnato a un altro operatore";

        return NextResponse.json({ 
          error: "Possibile doppione", 
          fuzzyMatch: true,
          contact: {
            id: duplicate.id,
            name: duplicate.name,
            cap: duplicate.cap,
            isBlocked,
            blockReason
          }
        }, { status: 409 });
      }
    }

    // Controllo doppione telefonico GLOBALE (in qualsiasi CAP)
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length >= 6) { // Evita ricerche su stringhe troppo corte
        // Cerca nei telefoni secondari/aggiuntivi
        const existingPhones = await prisma.contactPhone.findMany({
          where: {
            phone: {
              contains: cleanPhone
            }
          },
          include: {
            contact: true
          }
        });

        // Cerca nei telefoni primari
        const existingOriginalPhones = await prisma.contact.findMany({
          where: {
            originalPhone: {
              contains: cleanPhone
            }
          }
        });

        const normalize = (p: string) => p.replace(/[^0-9]/g, "");
        
        // Verifica in-memory normalizzando entrambi
        const dupByPhone = existingOriginalPhones.find(c => {
          if (!c.originalPhone) return false;
          const normDB = normalize(c.originalPhone);
          return normDB.endsWith(cleanPhone) || cleanPhone.endsWith(normDB);
        });

        const dupByRelPhone = existingPhones.find(p => {
          const normDB = normalize(p.phone);
          return normDB.endsWith(cleanPhone) || cleanPhone.endsWith(normDB);
        });

        const duplicatePhoneContact = dupByPhone || (dupByRelPhone ? dupByRelPhone.contact : null);

        if (duplicatePhoneContact) {
          return NextResponse.json({ 
            error: `Il numero di telefono ${phone} è già presente nel database per il contatto "${duplicatePhoneContact.name}" (CAP ${duplicatePhoneContact.cap}). Inserimento bloccato.` 
          }, { status: 409 });
        }
      }
    }

    // Se è un operatore, rilascia eventuali altri contatti aperti per evitare che rimangano bloccati nel limbo
    if (userRole === "OPERATORE") {
      await prisma.contact.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null }
      });
    }

    // Calcola hiddenUntil se non interessato (60 giorni)
    const hiddenUntil = isNotInterested ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : null;
    const lastOutcome = isNotInterested ? "NON_INTERESSATO" : null;

    // Non è un doppione, possiamo crearlo
    const newContact = await prisma.contact.create({
      data: {
        placeId: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Pseudo placeId for manual entries
        source: 'MANUAL',
        sourceId: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name,
        cap,
        sector: sector || "Generico",
        originalPhone: phone || null,
        // Se è un operatore a crearlo, glielo assegniamo immediatamente per bloccarlo su di esso (se non è già non interessato)
        assignedToId: (userRole === "OPERATORE" && !isNotInterested) ? userId : null,
        hiddenUntil,
        lastOutcome,
        phones: phone ? {
          create: {
            phone,
            label: "Principale (Manuale)"
          }
        } : undefined
      }
    });

    // Registra nel log l'azione
    await prisma.activityLog.create({
      data: {
        userId,
        contactId: newContact.id,
        action: "CONTACT_MANUALLY_CREATED",
        details: `Creato contatto manualmente: ${name}`
      }
    });

    return NextResponse.json({ success: true, contact: newContact });

  } catch (error) {
    console.error("POST manual contact error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
