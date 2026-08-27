import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ forceLogout: true }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch the most recent login or force_logout event
    const latestLog = await prisma.activityLog.findFirst({
      where: {
        userId,
        action: { in: ["LOGIN", "FORCE_LOGOUT"] }
      },
      orderBy: { createdAt: "desc" }
    });

    const isForcedLogout = latestLog?.action === "FORCE_LOGOUT";

    return NextResponse.json({ forceLogout: isForcedLogout });
  } catch (err) {
    return NextResponse.json({ forceLogout: false });
  }
}
