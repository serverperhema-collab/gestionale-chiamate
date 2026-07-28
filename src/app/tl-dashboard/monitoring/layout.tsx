"use client";

import Link from "next/link";
import { Activity, Radio, BarChart2, ArrowLeft, AreaChart } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MonitoringLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Se siamo sulla pagina principale (la landing), non mostriamo il menu laterale e usiamo un layout full width
  const isLandingPage = pathname === "/tl-dashboard/monitoring";

  return (
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100 flex flex-col">
      <div className="mb-6">
        <Link href="/tl-dashboard" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <AreaChart className="w-6 h-6 mr-3 text-cyan-400" />
            Controllo & Report
          </h2>
          <p className="text-gray-400 mt-1">
            Visualizza lo storico, monitora le attività in tempo reale e analizza le performance.
          </p>
        </div>
      </div>

      {isLandingPage ? (
        // Se è la landing page, renderizziamo solo i children senza menu
        <div className="flex-1">
          {children}
        </div>
      ) : (
        // Altrimenti, usiamo il layout con il menu a destra
        <div className="flex flex-1 gap-8 w-full max-w-full">
          {/* MAIN CONTENT (LEFT) */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

          {/* SIDE MENU (RIGHT) */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden sticky top-8">
              <Link
                href="/tl-dashboard/monitoring/live"
                className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/live") ? "bg-cyan-900/30 text-cyan-400 border-r-4 border-cyan-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-r-4 border-transparent"}`}
              >
                <Radio className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">Monitor Live</span>
              </Link>
              
              <Link
                href="/tl-dashboard/monitoring/reports"
                className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/reports") ? "bg-cyan-900/30 text-cyan-400 border-r-4 border-cyan-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-r-4 border-transparent border-t border-t-gray-700"}`}
              >
                <BarChart2 className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">Report Statistiche</span>
              </Link>
              
              <Link
                href="/tl-dashboard/monitoring/logs"
                className={`w-full flex items-center p-4 text-left transition ${pathname?.includes("/logs") ? "bg-cyan-900/30 text-cyan-400 border-r-4 border-cyan-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-r-4 border-transparent border-t border-t-gray-700"}`}
              >
                <Activity className="w-5 h-5 mr-3" />
                <span className="font-semibold text-sm">Registro Attività</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
