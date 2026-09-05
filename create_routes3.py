base_dir = "src/app/api/trattative/[id]/actions"

route_actions = """import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { TrattativaService } from "@/lib/services/TrattativaService";
import { Role } from "@prisma/client";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userRole = (session.user as any).role as Role;
    const userId = (session.user as any).id as string;

    const body = await req.json();
    const { action, payload } = body;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    const service = new TrattativaService();
    let result;

    switch (action) {
      case "richiamo":
        // Fallback al domain service setRecall (da definire o map to nextAction)
        // Per ora usiamo submitOutcome o aggiungiamo method a Service
        throw new Error("Action richiamo not fully mapped yet");
        break;
      case "appuntamento":
        result = await service.scheduleAppointment(params.id, payload, userId, userRole);
        break;
      case "rifissa-appuntamento":
        result = await service.rescheduleAppointment(params.id, payload.appointmentId, payload, userId, userRole);
        break;
      case "esito":
        result = await service.submitOutcome(params.id, payload.appointmentId, payload, userId, userRole);
        break;
      case "chiudi-persa":
        result = await service.closeLost(params.id, payload, userId, userRole);
        break;
      case "riapri":
        result = await service.reopen(params.id, payload, userId, userRole);
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
"""
with open(f"{base_dir}/route.ts", "w", encoding="utf-8") as f:
    f.write(route_actions)
print("route_actions DONE")