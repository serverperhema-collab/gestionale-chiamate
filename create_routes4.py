base_dir = "src/app/api/trattative/[id]"

route_attachments = """import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Simuliamo upload (ad esempio con Supabase Storage o AWS S3)
  // Per ora restituiamo 501 se il FormData non viene parsato dal framework.
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  // auth e check su uploaderId
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 });
}
"""

with open(f"{base_dir}/attachments/route.ts", "w", encoding="utf-8") as f:
    f.write(route_attachments)

route_events = """import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const events = await prisma.trattativaEvent.findMany({
      where: { trattativaId: params.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.trattativaEvent.count({ where: { trattativaId: params.id } });

    return NextResponse.json({ events, total, page });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""

with open(f"{base_dir}/events/route.ts", "w", encoding="utf-8") as f:
    f.write(route_events)

print("routes_att_ev DONE")