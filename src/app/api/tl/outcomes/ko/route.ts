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

    // Get all outcomes where koRequested is true AND it hasn't been approved yet (meaning the CommercialStatus is still KO_RICHIESTO)
    const outcomes = await prisma.appointmentOutcome.findMany({
      where: {
        koRequested: true,
        appointment: {
          commercialStatus: {
            in: ["SALTATO_CLIENTE_KO_RICHIESTO", "SALTATO_COMMERCIALE_KO_RICHIESTO"]
          }
        }
      },
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
    });

    return NextResponse.json({ outcomes });
  } catch (error) {
    console.error("GET ko outcomes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
