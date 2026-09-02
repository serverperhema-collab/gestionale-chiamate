import sys

path = 'src/app/api/contacts/[id]/gestione-separata/route.ts'
content = """import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    
    await prisma.contact.update({
      where: { id },
      data: { isGestioneSeparata: false }
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        contactId: id,
        action: "GESTIONE_SEPARATA_REMOVED",
        details: "Il TL ha rimosso manualmente la spunta di Gestione Separata da questo contatto."
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH remove gestione separata error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
