import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { id, minutes } = await req.json();
    const st = await prisma.trattativaSheet.findUnique({ where: { id } });
    if (!st) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    await prisma.trattativaSheet.update({
      where: { id },
      data: {
        nextActionDate: new Date(Date.now() + minutes * 60000)
      }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}