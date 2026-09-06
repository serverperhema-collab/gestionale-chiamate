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
        koRecords: true
      }
    });

    let csv = "ID,Nome,CAP,Indirizzo,Telefono Originale,HiddenUntil,isKo\n";
    for (const c of hiddenContacts) {
      
      const escapeCsv = (str: string | null | undefined) => {
        if (!str) return '""';
        return `"${str.replace(/"/g, '""')}"`;
      };

      const hiddenUntilStr = c.hiddenUntil ? c.hiddenUntil.toISOString() : "";
      const isKoStr = c.isKo ? "SI" : "NO";

      csv += `${escapeCsv(c.id)},${escapeCsv(c.name)},${escapeCsv(c.cap)},${escapeCsv(c.address)},${escapeCsv(c.originalPhone)},${escapeCsv(hiddenUntilStr)},${escapeCsv(isKoStr)}\n`;
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