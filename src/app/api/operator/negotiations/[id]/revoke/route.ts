import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    // Solo chi ha inviato la delega (originalOperatorId) può revocarla
    if (negotiation.originalOperatorId !== userId) {
      return NextResponse.json({ error: "Non sei autorizzato a revocare questa delega (non sei il mittente)" }, { status: 403 });
    }

    // Effettua la revoca riassegnando tutto al mittente originale
    await prisma.$transaction([
      prisma.negotiation.update({
        where: { id },
        data: { 
          operatorId: userId,
          originalOperatorId: null, // Ritorna ad essere una trattativa normale
          expiresAt: null
        }
      }),
      prisma.contact.update({
        where: { id: negotiation.contactId },
        data: { 
          assignedToId: userId,
          delegatedToId: null,
          delegatedUntil: null
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST revoke delegate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
