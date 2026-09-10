import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tlId = (session.user as any).id;
    const tlRole = (session.user as any).role;
    
    const body = await req.json();
    const { 
      contactId, flow, operatorId, commercialeId, 
      notes, appuntamentoSvolto, nextActionTo, nextActionDate, nextActionTime,
      preventivoFile, contrattoFile
    } = body;

    if (!contactId || !operatorId || !flow) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let trattativaStatus = "TRATTATIVA_IN_CORSO" as any;
      let nextActionType = "NONE" as any;
      let nextDateObj = null;

      // ---- SET STATUS E NEXT ACTION ----
      if (flow === "IN_CORSO") {
        if (!nextActionDate || !nextActionTime || !nextActionTo) {
          throw new Error("Dati di pianificazione mancanti per la trattativa in corso");
        }
        nextDateObj = new Date(`${nextActionDate}T${nextActionTime}`);
        
        // Se la prossima azione è del commerciale, in corso.
        // Se è dell'operatore e ha l'appuntamento, APPUNTAMENTO, se no RICHIAMO_PERSONALE
        if (nextActionTo === "COMMERCIALE") {
            trattativaStatus = "TRATTATIVA_IN_CORSO";
            if (!commercialeId) throw new Error("Seleziona un Commerciale dal menu a tendina.");
        } else {
            trattativaStatus = appuntamentoSvolto ? "APPUNTAMENTO" : "RICHIAMO_PERSONALE";
        }
        nextActionType = "RICHIAMO";

      } else if (flow === "FIRMATO") {
        trattativaStatus = "CHIUSA_VINTA";
      } else if (flow === "KO") {
        trattativaStatus = "CHIUSA_PERSA";
      }

      // ---- CREA TRATTATIVA ----
      const trattativa = await tx.trattativaSheet.create({
        data: {
          contactId,
          status: trattativaStatus,
          currentOperatorId: operatorId,
          createdByOperatorId: operatorId,
          
          currentCommercialeId: commercialeId || null,
          nextActionType: nextActionType,
          nextActionDate: nextDateObj,
          closedAt: (flow === "FIRMATO" || flow === "KO") ? new Date() : null
        }
      });

      // ---- AGGIORNA CONTATTO ----
      const contactUpdateData: any = {
          assignedToId: operatorId,
          hiddenUntil: null,
          blacklisted: false,
          isKo: false
      };
      
      if (flow === "KO") {
          contactUpdateData.isKo = true;
          contactUpdateData.assignedToId = null;
      } else if (flow === "FIRMATO") {
          // Nascondiamo il contatto firmato per 5 anni
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 5);
          contactUpdateData.hiddenUntil = futureDate;
      }
      
      await tx.contact.update({
          where: { id: contactId },
          data: contactUpdateData
      });

      // ---- LOG E EVENTI ----
      const tl = await tx.user.findUnique({ where: { id: tlId } });
      
      // LOG 1: Creazione
      let log1Desc = "";
      let initialEventType = "CREATA" as any;

      if (flow === "IN_CORSO") {
        log1Desc = `Creazione TL. Appuntamento: ${appuntamentoSvolto ? 'Sì' : 'No'}. Preventivo: ${preventivoFile ? 'Sì' : 'No'}. Note: ${notes}`;
      } else if (flow === "FIRMATO") {
        initialEventType = "CONTRATTO_FIRMATO";
        log1Desc = `Contratto Firmato inserito da TL. Note: ${notes}`;
      } else if (flow === "KO") {
        initialEventType = "KO_DEFINITIVO";
        log1Desc = `Contatto KO inserito da TL. Note: ${notes}`;
      }

      await tx.trattativaEvent.create({
        data: {
          trattativaId: trattativa.id,
          eventType: initialEventType,
          description: log1Desc,
          userId: tlId,
          userRole: tlRole,
        }
      });

      // LOG 2: Richiamo (Solo per IN_CORSO)
      if (flow === "IN_CORSO") {
        await tx.trattativaEvent.create({
          data: {
            trattativaId: trattativa.id,
            eventType: "RICHIAMO_IMPOSTATO",
            description: `Richiamo fissato per il ${new Date(nextActionDate).toLocaleDateString('it-IT')} alle ${nextActionTime} (Assegnato a: ${nextActionTo === 'COMMERCIALE' ? 'Commerciale' : 'Operatore'}).`,
            userId: tlId,
            userRole: tlRole,
          }
        });
      }

      // ---- ALLEGATI ----
      if (preventivoFile) {
        await tx.trattativaAttachment.create({
          data: {
            trattativaId: trattativa.id,
            filename: preventivoFile.name,
            url: preventivoFile.data, // Base64 data URI
            type: "PREVENTIVO",
            mimeType: preventivoFile.type,
            uploadedById: tlId
          }
        });
      }

      if (contrattoFile) {
        await tx.trattativaAttachment.create({
          data: {
            trattativaId: trattativa.id,
            filename: contrattoFile.name,
            url: contrattoFile.data, // Base64 data URI
            type: "CONTRATTO",
            mimeType: contrattoFile.type,
            uploadedById: tlId
          }
        });
      }

      return trattativa;
    });

    return NextResponse.json({ success: true, trattativa: result });
  } catch (error: any) {
    console.error("Wizard Trattativa error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
