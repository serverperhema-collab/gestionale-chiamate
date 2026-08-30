import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import CommercialeAgendaClient from "./CommercialeAgendaClient";

export default async function CommercialAppPage() {
  const session = await getServerSession(authOptions);

  if (!session || ((session.user as any).role !== "COMMERCIALE" && (session.user as any).role !== "TEAM_LEADER")) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 md:px-6">
        <h1 className="text-lg md:text-xl font-bold tracking-wide text-white">App Commerciale</h1>
        <div className="flex items-center space-x-3 md:space-x-4">
          <span className="hidden md:inline text-sm text-gray-400">Commerciale: {session.user?.name}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <CommercialeAgendaClient />
      </main>
    </div>
  );
}
