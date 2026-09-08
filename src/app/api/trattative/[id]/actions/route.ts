import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { TrattativaService } from "@/lib/services/TrattativaService";
import { Role } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role as Role;
    const userId = (session.user as any).id as string;

    const { id } = await params;
    const body = await req.json();
    const { action, payload } = body;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    const service = new TrattativaService();
    let result;

    switch (action) {
            case "missed-call":
        result = await service.recordMissedCall(id, payload, userId, userRole);
        break;
      case "postpone-recall":
        result = await service.postponeRecall(id, payload, userId, userRole);
        break;
      case "richiamo":
        result = await service.setRichiamo(id, payload, userId, userRole);
        break;
      case "preventivo-complete":
        result = await service.completePreventivo(id, payload, userId, userRole);
        break;
      case "resolve-deroga":
        result = await service.resolveDeroga(id, payload, userId, userRole);
        break;



      case "appuntamento":
        result = await service.scheduleAppointment(id, payload, userId, userRole);
        break;
      case "rifissa-appuntamento":
        result = await service.rescheduleAppointment(id, payload.appointmentId, payload, userId, userRole);
        break;
      case "esito":
        result = await service.submitOutcome(id, payload.appointmentId, payload, userId, userRole);
        break;
      case "chiudi-persa":
        result = await service.closeLost(id, payload, userId, userRole);
        break;
      case "riapri":
        result = await service.reopen(id, payload, userId, userRole);
        break;
      case "deroga":
        result = await service.requestDeroga(id, payload, userId, userRole);
        break;
      case "nota":
        result = await service.addNote(id, payload, userId, userRole);
        break;
      // ... mappatura altre action (annulla, deroga, preventivo, ecc)
      default:
        return NextResponse.json({ error: `Action ${action} not implemented` }, { status: 501 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
