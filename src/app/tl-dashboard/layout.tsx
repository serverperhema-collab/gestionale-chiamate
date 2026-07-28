import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Clock, PhoneCall, AlertTriangle, UserMinus, Activity, BarChart2, Radio } from "lucide-react";
import TLGlobalAlerts from "@/components/TLGlobalAlerts";
import TLAlertProvider from "@/components/TLAlertProvider";
import TopNav from "./TopNav";

export default async function TLDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <TopNav />
      <TLAlertProvider />
      <TLGlobalAlerts />
      {children}
    </div>
  );
}
