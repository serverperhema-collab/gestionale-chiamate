import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const cap = searchParams.get("cap") || "";
    const sector = searchParams.get("sector") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build the query where clause
    const where: Prisma.ContactWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { originalPhone: { contains: search, mode: "insensitive" } },
        { cap: { contains: search, mode: "insensitive" } }
      ];
    }
    
    if (cap) {
      where.cap = { contains: cap, mode: "insensitive" };
    }

    if (sector) {
      where.sector = { contains: sector, mode: "insensitive" };
    }

    if (status) {
      if (status === "ASSIGNED") {
        where.assignedToId = { not: null };
      } else if (status === "FREE") {
        where.assignedToId = null;
        where.isKo = false;
        where.OR = [
          { hiddenUntil: null },
          { hiddenUntil: { lt: new Date() } }
        ];
      } else if (status === "KO") {
        where.isKo = true;
      } else if (status === "HIDDEN") {
        where.hiddenUntil = { gt: new Date() };
      }
    }

    // 1. Fetch all IDs and their counts matching the filter
    const allContacts = await prisma.contact.findMany({
      where,
      select: {
        id: true,
        _count: {
          select: { callLogs: true, activityLogs: true, appointments: true }
        }
      }
    });

    // 2. Compute total logs and sort in memory
    const sortedContacts = allContacts
      .map(c => ({
        id: c.id,
        totalLogs: c._count.callLogs + c._count.activityLogs + c._count.appointments
      }))
      .sort((a, b) => b.totalLogs - a.totalLogs);

    const total = sortedContacts.length;

    // 3. Paginate
    const paginatedIds = sortedContacts.slice(skip, skip + limit).map(c => c.id);

    // 4. Fetch full details for the paginated IDs
    const contactsUnsorted = await prisma.contact.findMany({
      where: { id: { in: paginatedIds } },
      include: {
        _count: {
          select: { callLogs: true, activityLogs: true, appointments: true }
        },
        assignedTo: {
          select: { name: true }
        }
      }
    });

    // 5. Re-sort the final array to match the ordered paginatedIds
    const contacts = paginatedIds.map(id => contactsUnsorted.find(c => c.id === id)).filter(Boolean);

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("GET all contacts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
