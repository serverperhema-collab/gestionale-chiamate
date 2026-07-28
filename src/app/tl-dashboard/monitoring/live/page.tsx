import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import LiveMonitorClient from "./LiveMonitorClient";
import Link from "next/link";
import { BarChart2 } from "lucide-react";

export default async function LiveMonitorPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/login");
  }

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Monitoraggio Live Inattività
          </h1>
          <p className="text-gray-400 mt-2">
            Controlla in tempo reale gli operatori fermi da troppo tempo.
          </p>
        </div>
        <Link 
          href="/tl-dashboard/monitoring/live/report"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition flex items-center shadow-lg"
        >
          <BarChart2 className="w-5 h-5 mr-2" />
          Report Attività (Storico)
        </Link>
      </div>

      <LiveMonitorClient />
    </div>
  );
}
