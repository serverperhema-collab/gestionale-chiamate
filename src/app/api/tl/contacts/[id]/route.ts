import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, originalPhone, cap, sector, address, email, referentName, notes, blacklisted, blacklistReason } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (originalPhone !== undefined) updateData.originalPhone = originalPhone;
    if (cap !== undefined) updateData.cap = cap;
    if (sector !== undefined) updateData.sector = sector;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (referentName !== undefined) updateData.referentName = referentName;
    if (notes !== undefined) updateData.notes = notes;\n    if (blacklisted !== undefined) updateData.blacklisted = blacklisted;\n    if (blacklistReason !== undefined) updateData.blacklistReason = blacklistReason;

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: updateData
    });

    if (originalPhone) {
        const existingPhones = await prisma.contactPhone.findMany({ where: { contactId: contact.id } });
        if (existingPhones.length === 0) {
            await prisma.contactPhone.create({ data: { contactId: contact.id, phone: originalPhone, label: "Principale" } });
        }
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("PATCH contact error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Support GET for a single contact to populate the edit modal correctly
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id }
    });

    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("GET contact error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
