import os

# Create directories
os.makedirs("src/app/api/tl/contacts/manual", exist_ok=True)
os.makedirs("src/app/api/tl/contacts/[id]", exist_ok=True)

# Write manual POST route
with open("src/app/api/tl/contacts/manual/route.ts", "w", encoding="utf-8") as f:
    f.write('''import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, originalPhone, cap, sector, address, email, referentName, notes } = body;

    if (!name || !cap || !sector) {
      return NextResponse.json({ error: "Nome, CAP e Settore sono obbligatori" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        originalPhone,
        cap,
        sector,
        address,
        email,
        referentName,
        notes,
        source: "MANUAL",
        sourceId: `MANUAL_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        phones: originalPhone ? {
          create: [{ phone: originalPhone, label: "Principale" }]
        } : undefined
      }
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("POST manual contact error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
''')

# Write PATCH route
with open("src/app/api/tl/contacts/[id]/route.ts", "w", encoding="utf-8") as f:
    f.write('''import { NextResponse } from "next/server";
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
    const { name, originalPhone, cap, sector, address, email, referentName, notes } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (originalPhone !== undefined) updateData.originalPhone = originalPhone;
    if (cap !== undefined) updateData.cap = cap;
    if (sector !== undefined) updateData.sector = sector;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (referentName !== undefined) updateData.referentName = referentName;
    if (notes !== undefined) updateData.notes = notes;

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
''')

print("Created APIs")
