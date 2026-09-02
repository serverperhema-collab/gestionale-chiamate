import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Users, Activity, Calendar, Database, Target, TrendingUp, PhoneCall, DownloadCloud, Trash2, Snowflake, Handshake, Settings, Radio, BarChart2, AreaChart, CheckCircle, FileSignature, FileText, CalendarDays } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import CreateUserModal from "@/components/CreateUserModal";
import { prisma } from "@/lib/prisma";
import TlTasksWidget from "@/components/TlTasksWidget";
import LiveClock from "@/components/LiveClock";

export default async function TLDashboardPage() {

  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/unauthorized");
  }

  // Calcolo statistiche della giornata
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalContacts,
    todayAssignments,
    todayAppointments,
    todayActivities
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.dailyAssignment.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      select: { cap: true },
      distinct: ['cap']
    }),
    prisma.appointment.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } }
    }),
    prisma.activityLog.groupBy({
      by: ['contactId'],
      where: { 
        createdAt: { gte: startOfDay, lte: endOfDay },
        contactId: { not: null }
      }
    })
  ]);

  const managedContacts = todayActivities.length;
  const conversionRate = managedContacts > 0 ? ((todayAppointments / managedContacts) * 100).toFixed(1) : "0.0";
  const capsInCall = todayAssignments.length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-wide text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-emerald-400" />
          TL Control Center
        </h1>
        <div className="flex items-center space-x-6">
          <LiveClock />
          <div className="flex items-center space-x-4 bg-gray-900 px-4 py-1.5 rounded-full border border-gray-700">
            <span className="text-sm font-medium text-gray-300">Bentornato, {session.user?.name}</span>
            <div className="h-4 w-px bg-gray-700"></div>
            <CreateUserModal />
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">Panoramica Oggi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI Cards */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Database className="w-24 h-24 text-white" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Contatti DB Totali</h3>
                <Database className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-white">{totalContacts.toLocaleString('it-IT')}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-24 h-24 text-blue-500" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">CAP in Chiamata Oggi</h3>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white">{capsInCall}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <PhoneCall className="w-24 h-24 text-yellow-500" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Contatti Gestiti Oggi</h3>
                <PhoneCall className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-white">{managedContacts}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar className="w-24 h-24 text-purple-500" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Appuntamenti Fissati</h3>
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-white">{todayAppointments}</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">Conversione (%)</h3>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-400">{conversionRate}%</p>
            </div>
          </div>
        </div>



        {/* Navigation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <Link href="/tl-dashboard/assignments" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-emerald-500 transition h-full">
              <Users className="w-8 h-8 text-emerald-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Assegnazione Giornaliera</h2>
              <p className="text-sm text-gray-400 mt-2">Distribuisci i CAP e le Campagne agli Operatori per filtrare il calderone.</p>
            </div>
          </Link>

          <Link href="/tl-dashboard/monitoring" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-cyan-500 transition h-full">
              <AreaChart className="w-8 h-8 text-cyan-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Controllo & Report</h2>
              <p className="text-sm text-gray-400 mt-2">Accedi al Monitor Live, ai Report e al Registro Attività.</p>
            </div>
          </Link>

          <Link href="/tl-dashboard/monitoring/attendance" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-teal-500 transition h-full">
              <CalendarDays className="w-8 h-8 text-teal-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Gestione Presenze</h2>
              <p className="text-sm text-gray-400 mt-2">Registra le presenze, le assenze e i permessi degli operatori. Esporta il report mensile.</p>
            </div>
          </Link>

          <Link href="/tl-dashboard/appointments" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-purple-500 transition h-full">
              <Calendar className="w-8 h-8 text-purple-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Agende & Appuntamenti</h2>
              <p className="text-sm text-gray-400 mt-2">Gestisci le agende (zone) e conferma gli appuntamenti presi dagli operatori.</p>
            </div>
          </Link>

          <Link href="/tl-dashboard/security" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-red-500 transition h-full">
              <Target className="w-8 h-8 text-red-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Sicurezza & Blocchi</h2>
              <p className="text-sm text-gray-400 mt-2">Gestisci gli operatori bloccati per troppi Skip o Modifiche e sbloccali.</p>
            </div>
          </Link>

          <Link href="/tl-dashboard/negotiations" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-purple-500 transition h-full">
              <Handshake className="w-8 h-8 text-purple-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Richiami Personali</h2>
              <p className="text-sm text-gray-400 mt-2">Visualizza e gestisci tutti i richiami personali e le trattative in corso degli operatori.</p>
            </div>
          </Link>

          <Link href="/tl-dashboard/outcomes" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-blue-500 transition h-full">
              <CheckCircle className="w-8 h-8 text-blue-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Appuntamenti e Preventivi</h2>
              <p className="text-sm text-gray-400 mt-2">Gestisci lo storico degli appuntamenti, gli esiti e sviluppa i preventivi richiesti.</p>
            </div>
          </Link>

          

          <Link href="/tl-dashboard/settings" className="group">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 group-hover:border-amber-500 transition h-full">
              <Settings className="w-8 h-8 text-amber-400 mb-4" />
              <h2 className="text-lg font-semibold text-white">Configurazioni & Utility</h2>
              <p className="text-sm text-gray-400 mt-2">Accedi alla mappatura CAP, all'estrazione API e alla gestione account.</p>
            </div>
          </Link>

        </div>

        <div className="mt-8 mb-8">
          <div className="h-64">
            <TlTasksWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
