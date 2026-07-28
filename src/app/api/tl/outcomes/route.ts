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

    const { searchParams } = new URL(req.url);
    const commercialeId = searchParams.get("commercialeId");
    const cap = searchParams.get("cap");
    const outcomeFinal = searchParams.get("outcomeFinal");
    const skipReason = searchParams.get("skipReason");
    const isSaltato = searchParams.get("isSaltato") === "true";

    let filters: any = {};

    if (commercialeId) {
      filters.appointment = { ...filters.appointment, commercialeId };
    }
    
    if (cap) {
      filters.appointment = { ...filters.appointment, contact: { cap: cap } };
    }

    if (isSaltato) {
       filters.skipReason = { not: null };
       if (skipReason) {
         filters.skipReason = skipReason;
       }
    } else {
       filters.skipReason = null; // Only svolti
       if (outcomeFinal) {
         filters.outcomeFinal = outcomeFinal;
       }
    }

    const outcomes = await prisma.appointmentOutcome.findMany({
      where: filters,
      include: {
        appointment: {
          include: {
            contact: true,
            commerciale: { select: { id: true, name: true } },
            operator: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return NextResponse.json({ outcomes });
  } catch (error) {
    console.error("GET outcomes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
