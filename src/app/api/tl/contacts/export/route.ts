import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

function escapeCSV(field: any): string {
  if (field === null || field === undefined) {
    return "";
  }
  const str = String(field);
  // Se contiene virgole, virgolette o newline, va messo tra virgolette doppie
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all contacts (or filter if needed, but the user requested ALL)
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        originalPhone: true,
        address: true,
        cap: true,
        sector: true,
        email: true,
        referentName: true,
        referentRole: true,
        notes: true,
        isKo: true,
        blacklisted: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    // Define CSV header
    const headers = [
      "ID",
      "Nome",
      "Telefono",
      "Indirizzo",
      "CAP",
      "Settore",
      "Email",
      "Nome Referente",
      "Ruolo Referente",
      "Note",
      "Stato",
      "Data Creazione"
    ];

    // Build CSV rows
    const rows = contacts.map(c => {
      let stato = "Libero";
      if (c.blacklisted) stato = "Cestino";
      else if (c.isKo) stato = "KO";

      return [
        c.id,
        c.name,
        c.originalPhone,
        c.address,
        c.cap,
        c.sector,
        c.email,
        c.referentName,
        c.referentRole,
        c.notes,
        stato,
        c.createdAt.toISOString()
      ].map(escapeCSV).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv; charset=utf-8");
    response.headers.set("Content-Disposition", 'attachment; filename="database_contatti.csv"');
    
    return response;

  } catch (error: any) {
    console.error("Errore export contatti:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
