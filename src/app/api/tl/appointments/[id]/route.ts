import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const app = await prisma.trattativaAppointment.findUnique({
      where: { id },
      include: { trattativa: { include: { contact: true } } }
    });
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ 
      appointment: {
        id: app.id,
        date: app.date.toISOString(),
        contact: app.trattativa.contact,
        status: app.status === "FISSATO" ? "PENDING" : app.status,
        trattativaId: app.trattativa.id
      } 
    });
  } catch(e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
export async function DELETE() { return NextResponse.json({ success: true }); }