import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { TrattativaService } from "@/lib/services/TrattativaService";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role as Role;
    const userId = (session.user as any).id as string;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const operatorId = searchParams.get("operatorId");
    const commercialeId = searchParams.get("commercialeId");
    const contactId = searchParams.get("contactId");
    const nextActionType = searchParams.get("nextActionType");
    const nextActionDateBefore = searchParams.get("nextActionDateBefore");
    const includeAppointments = searchParams.get("includeAppointments") === "true";

    const where: any = {};
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (nextActionType) where.nextActionType = nextActionType;
    if (nextActionDateBefore) {
      where.nextActionDate = { lte: nextActionDateBefore === 'now' ? new Date() : new Date(nextActionDateBefore) };
    }

    if (userRole === Role.OPERATORE) {
      if (operatorId === 'me') {
        where.currentOperatorId = userId;
      } else if (operatorId) {
        where.currentOperatorId = operatorId;
      } else {
        where.currentOperatorId = userId;
      }
    } else if (userRole === Role.COMMERCIALE) {
      where.currentCommercialeId = userId;
    } else if (userRole === Role.TEAM_LEADER) {
      if (operatorId) where.currentOperatorId = operatorId === 'null' ? null : operatorId;
      if (commercialeId) where.currentCommercialeId = commercialeId === 'null' ? null : commercialeId;
    }

    const includeOpts: any = { contact: true, currentCommerciale: true, currentOperator: true };
    if (includeAppointments) {
      includeOpts.appointments = true;
    }

    const trattative = await prisma.trattativaSheet.findMany({
      where,
      include: includeOpts,
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ trattative });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role as Role;
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const { contactId } = body;
    if (!contactId) return NextResponse.json({ error: "Missing contactId" }, { status: 400 });

    const service = new TrattativaService();
    const trattativa = await service.createOrReopen(contactId, userId, userId, userRole);

    return NextResponse.json({ trattativa });
  } catch (error: any) {
    if (error.statusCode) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}