import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trattativa = await prisma.trattativaSheet.findUnique({
      where: { id: params.id },
      include: {
        contact: true,
        
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
        attachments: true
      }
    });

    if (!trattativa) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(trattativa);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    // Whitelist rigorosa
    const allowedKeys = ["commercialPhone", "commercialEmail", "referentName", "referentRole", "clientNeeds"];
    const updateData: any = {};
    for (const key of allowedKeys) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Incrementiamo version per optimistic concurrency
    updateData.version = { increment: 1 };

    const trattativa = await prisma.trattativaSheet.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ trattativa });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
