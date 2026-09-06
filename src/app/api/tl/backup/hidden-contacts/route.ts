import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hiddenContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { hiddenUntil: { not: null } },
          { isKo: true },
          { koRecords: { some: { isResolved: false } } }
        ]
      },
      include: {
        assignedTo: true,
        koRecords: { where: { isResolved: false } },
        callLogs: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } },
        activityLogs: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } }
      }
    });

    let csv = "ID,Nome,CAP,Indirizzo,Telefono Originale,Scadenza Blocco,isKo,Operatore,Motivazione,Note
";
    
    for (const c of hiddenContacts) {
      
      let reason = "Motivo Sconosciuto";
      let blockedBy = c.assignedTo ? `${c.assignedTo.name}` : "Sistema";
      let note = "";

      if (c.koRecords && c.koRecords.length > 0) {
        reason = "Bloccato (KO Record)";
      }
      else if (c.callLogs.length > 0) {
        const lastCall = c.callLogs[0];
        note = lastCall.notes || "";
        if (lastCall.outcome === "NO_ANSWER") {
          reason = `Non Risponde (${c.noAnswerCount} tentativi)`;
          blockedBy = `${lastCall.user.name}`;
        } else if (lastCall.outcome === "NOT_AVAILABLE") {
          reason = "Non Reperibile Temporaneamente";
          blockedBy = `${lastCall.user.name}`;
        } else if (lastCall.outcome === "NO_INFO") {
          reason = "Non Reperibile Senza Info";
          blockedBy = `${lastCall.user.name}`;
        } else if (lastCall.outcome === "TRASH_REQUEST") {
          reason = "In attesa di approvazione scarto";
          blockedBy = `${lastCall.user.name}`;
        } else {
          reason = `Esito: ${lastCall.outcome}`;
          blockedBy = `${lastCall.user.name}`;
        }
      }
      
      if (reason !== "Richiami operatore in corso" && c.activityLogs.length > 0) {
        const lastActivity = c.activityLogs[0];
        const lastCallDate = c.callLogs.length > 0 ? c.callLogs[0].createdAt : new Date(0);
        if (lastActivity.createdAt > lastCallDate && lastActivity.action.includes("TL_")) {
          if (lastActivity.action === "TL_UNBLOCK") {
             reason = "Sbloccato manualmente dalla TL";
          } else {
             reason = `Azione TL: ${lastActivity.details}`;
          }
          blockedBy = `${lastActivity.user.name}`;
        }
      }

      if (c.isKo) {
        reason = "KO Definitivo (Scartato)";
      }

      const escapeCsv = (str: string | null | undefined) => {
        if (!str) return '""';
        return `"${str.replace(/"/g, '""')}"`;
      };

      const hiddenUntilStr = c.hiddenUntil ? new Date(c.hiddenUntil).toLocaleString("it-IT") : "";
      const isKoStr = c.isKo ? "SI" : "NO";
      
      let dataBlocco = "";
      if (c.callLogs && c.callLogs.length > 0) {
          dataBlocco = new Date(c.callLogs[0].createdAt).toLocaleString("it-IT");
      } else if (c.activityLogs && c.activityLogs.length > 0) {
          dataBlocco = new Date(c.activityLogs[0].createdAt).toLocaleString("it-IT");
      }

      csv += `${escapeCsv(c.id)},${escapeCsv(c.name)},${escapeCsv(c.cap)},${escapeCsv(c.address)},${escapeCsv(c.originalPhone)},${escapeCsv(dataBlocco)},${escapeCsv(hiddenUntilStr)},${escapeCsv(isKoStr)},${escapeCsv(blockedBy)},${escapeCsv(reason)},${escapeCsv(note)}
`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="backup_contatti_nascosti_ko.csv"',
      },
    });

  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}