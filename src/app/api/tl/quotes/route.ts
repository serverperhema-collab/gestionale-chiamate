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
    const type = searchParams.get("type"); // "RECEIVED" | "REQUESTS"
    const status = searchParams.get("status");

    if (type === "RECEIVED") {
       // Preventivi allegati direttamente dal commerciale
       const outcomes = await prisma.appointmentOutcome.findMany({
         where: { quoteAttached: true },
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
       return NextResponse.json({ items: outcomes, type: "RECEIVED" });
    } else {
       // Richieste di preventivo in attesa
       let whereFilter: any = {};
       if (status) {
         whereFilter.status = status;
       }

       const requests = await prisma.quoteRequest.findMany({
         where: whereFilter,
         include: {
           appointment: {
             include: {
               contact: true,
               operator: { select: { id: true, name: true } }
             }
           },
           commerciale: { select: { id: true, name: true } }
         },
         orderBy: { createdAt: "desc" },
       });
       return NextResponse.json({ items: requests, type: "REQUESTS" });
    }
  } catch (error) {
    console.error("GET quotes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
