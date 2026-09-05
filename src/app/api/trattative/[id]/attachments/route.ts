import { NextResponse } from "next/server";
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
