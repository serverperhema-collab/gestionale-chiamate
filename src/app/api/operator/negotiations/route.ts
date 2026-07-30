import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { checkExpiredDelegations } from "@/lib/delegationHelper";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await checkExpiredDelegations();

    const userId = (session.user as any).id;

    // Fetch negotiations assigned to this operator
    // Exclude abandoned or completely expired ones if needed, but we should show them so they can act on them.
    const negotiations = await prisma.negotiation.findMany({
      where: { 
        operatorId: userId,
        isAbandoned: false
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, originalPhone: true, address: true }
        }
      },
      orderBy: { recallDate: "asc" }
    });

    return NextResponse.json({ negotiations });
  } catch (error) {
    console.error("GET operator negotiations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
