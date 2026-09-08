import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const commerciali = await prisma.user.findMany({
      where: { 
        role: "COMMERCIALE",
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ commerciali });
  } catch (error) {
    console.error("GET commerciali error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
