import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ReportClient from "./ReportClient";
import { prisma } from "@/lib/prisma";

export default async function LiveMonitorReportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/login");
  }

  // Fetch all operators for the selector
  const operators = await prisma.user.findMany({
    where: { role: "OPERATORE", isActive: true },
    select: { id: true, name: true }
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 text-white p-8 print:bg-white print:text-black print:p-0">
      <ReportClient operators={operators} />
    </div>
  );
}
