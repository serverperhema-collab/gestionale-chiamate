import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Fetch all active operators EXCEPT the current user
    const colleagues = await prisma.user.findMany({
      where: { 
        role: "OPERATORE",
        isActive: true,
        id: { not: userId }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ colleagues });
  } catch (error) {
    console.error("GET colleagues error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
