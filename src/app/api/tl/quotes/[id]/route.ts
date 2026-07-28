import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status, tlNotes, quoteUrl } = await req.json();

    const quoteReq = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quoteReq) {
      return NextResponse.json({ error: "Richiesta preventivo non trovata" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (tlNotes !== undefined) dataToUpdate.tlNotes = tlNotes;
    if (quoteUrl !== undefined) dataToUpdate.quoteUrl = quoteUrl;
    
    if (status === "COMPLETATO" || status === "ANNULLATO") {
      dataToUpdate.resolvedAt = new Date();
    }

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, quoteRequest: updated });
  } catch (error) {
    console.error("PATCH quote error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
