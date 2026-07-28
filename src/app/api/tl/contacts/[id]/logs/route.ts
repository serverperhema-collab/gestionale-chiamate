import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        callLogs: {
          include: { user: { select: { name: true, role: true } } }
        },
        activityLogs: {
          include: { user: { select: { name: true, role: true } } }
        },
        negotiations: {
          include: { operator: { select: { name: true, role: true } } }
        },
        appointments: {
          include: { operator: { select: { name: true, role: true } } }
        }
      }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const timeline: any[] = [];

    // Mappatura Call Logs
    contact.callLogs.forEach(log => {
      // Evitiamo il duplicato: se l'esito è APPOINTMENT, usiamo solo il record dell'appuntamento creato di seguito
      if (log.outcome === "APPOINTMENT") return;

      let label = "Esito Telefonata";
      if (log.outcome === "NO_ANSWER") label = "Non Risponde";
      if (log.outcome === "NOT_AVAILABLE") label = "Richiamo Generico (Non Reperibile)";
      if (log.outcome === "NO_INFO") label = "Nessuna Info";
      if (log.outcome === "NEGOTIATION") label = "Trattativa / Richiamo Personale";
      if (log.outcome === "TRASH_REQUEST") label = "Richiesta Eliminazione";
      if (log.outcome === "SKIP") label = "Contatto Saltato";

      let cleanNotes = log.notes || "Nessuna nota";
      cleanNotes = cleanNotes.replace(/\s*\(Deroga:\s*(true|false)\)/ig, '');

      timeline.push({
        id: `call_${log.id}`,
        type: "CALL",
        title: label,
        description: cleanNotes,
        date: log.createdAt,
        user: log.user.name,
        userRole: log.user.role
      });
    });

    // Mappatura Activity Logs
    contact.activityLogs.forEach(log => {
      let title = "Azione di Sistema";
      
      // Traduzione Action
      if (log.action === "TL_UNBLOCK") title = "Sblocco Manuale TL";
      else if (log.action === "CONTACT_EXTRACTED") title = "Assegnazione Contatto";
      else if (log.action === "TL_CHANGED_OPERATOR") title = "Cambio Operatore (TL)";
      else if (log.action === "LOGIN") title = "Accesso";
      else if (log.action === "SUSPENDED") title = "Sospensione Utente";
      else if (log.action === "ADDED_PHONE") title = "Nuovo Recapito Inserito";
      else if (log.action === "NEGOTIATION_APPROVED") title = "Trattativa Approvata dalla TL";
      else if (log.action === "NEGOTIATION_REJECTED") title = "Trattativa Rifiutata dalla TL";
      else if (log.action === "NEGOTIATION_ABANDONED") title = "Trattativa Abbandonata";
      else if (log.action === "CONTACT_SKIPPED") title = "Contatto Saltato (Skip)";
      else if (log.action === "MODIFIED_EXISTING_DATA") title = "Modifica Dati Esistenti";
      else if (log.action === "CONTACT_ENRICHED") title = "Aggiunta Dati (Arricchimento)";
      else if (log.action.startsWith("TL_APPOINTMENT_ACTION")) title = "Decisione Team Leader sull'Appuntamento";
      else if (log.action.startsWith("TL_")) title = "Azione Team Leader";

      // Pulizia Details
      let cleanDetails = log.details || "";
      cleanDetails = cleanDetails.replace(/Contatto pescato dal calderone/ig, "Contatto prelevato dal database centrale e assegnato all'operatore.");
      cleanDetails = cleanDetails.replace(/sull'appuntamento\s[a-z0-9]+/ig, ""); // Rimuove "sull'appuntamento cmrs..."
      cleanDetails = cleanDetails.replace(/Azione CONFIRM eseguita/g, "Appuntamento validato e confermato definitivamente.");
      cleanDetails = cleanDetails.replace(/Azione RIMBALZA_COMMERCIALE eseguita/g, "L'appuntamento è stato delegato alla gestione diretta del Commerciale.");
      cleanDetails = cleanDetails.replace(/Azione ANNULLA_RIMANDA_OPERATORE eseguita/g, "L'appuntamento è stato annullato. Il contatto è stato rimandato all'operatore originario.");
      cleanDetails = cleanDetails.replace(/Azione ANNULLA_CALDERONE eseguita/g, "L'appuntamento è stato annullato. Il contatto è stato sbloccato e rimesso nel Calderone generale.");
      cleanDetails = cleanDetails.replace(/Azione ANNULLA_BLOCCO_PERENNE eseguita/g, "L'appuntamento è stato annullato. Il contatto è stato inserito in Blacklist (Blocco perenne).");
      cleanDetails = cleanDetails.replace(/Azione RICHIAMA_TL eseguita/g, "L'appuntamento è stato annullato ed è stato creato un Task per la TL.");

      timeline.push({
        id: `activity_${log.id}`,
        type: "ACTIVITY",
        title: title,
        description: cleanDetails.trim(),
        date: log.createdAt,
        user: log.user.name,
        userRole: log.user.role
      });
    });

    // Mappatura Appuntamenti Creati
    contact.appointments.forEach(app => {
      timeline.push({
        id: `app_${app.id}`,
        type: "APPOINTMENT",
        title: "Dettagli Appuntamento Generato",
        description: `La visita/call è stata fissata per il ${new Date(app.date).toLocaleDateString()} alle ore ${new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        date: app.createdAt,
        user: app.operator.name,
        userRole: app.operator.role
      });
    });

    // Sort timeline descending (newest first)
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("GET contact logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
