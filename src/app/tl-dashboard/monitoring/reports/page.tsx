import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/unauthorized");
  }

  // Passiamo solo la lista degli utenti al client, la data e le logiche le gestisce l'API chiamata dal client
  const operators = await prisma.user.findMany({
    where: { role: "OPERATORE" },
    select: { id: true, name: true, username: true }
  });

  const commercials = await prisma.user.findMany({
    where: { role: "COMMERCIALE" },
    select: { id: true, name: true, username: true }
  });

  return (
    <div className="flex-1">
      <h2 className="text-2xl font-bold text-white mb-6">Report e Statistiche</h2>
      <ReportsClient operators={operators} commercials={commercials} />
    </div>
  );
}
