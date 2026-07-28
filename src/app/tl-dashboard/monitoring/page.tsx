"use client";

import Link from "next/link";
import { Activity, Radio, BarChart2 } from "lucide-react";

export default function MonitoringLandingPage() {
  return (
    <div className="flex justify-center mt-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        
        <Link href="/tl-dashboard/monitoring/live" className="group">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 group-hover:border-red-500 transition h-full flex flex-col items-center text-center">
            <Radio className="w-16 h-16 text-red-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h2 className="text-xl font-bold text-white mb-3">Monitor Live</h2>
            <p className="text-sm text-gray-400">
              Visualizza in tempo reale le chiamate e le attività svolte in questo momento.
            </p>
          </div>
        </Link>

        <Link href="/tl-dashboard/monitoring/reports" className="group">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 group-hover:border-emerald-500 transition h-full flex flex-col items-center text-center">
            <BarChart2 className="w-16 h-16 text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h2 className="text-xl font-bold text-white mb-3">Report Statistiche</h2>
            <p className="text-sm text-gray-400">
              Analizza l'andamento del team, le conversioni e la produttività nel tempo.
            </p>
          </div>
        </Link>

        <Link href="/tl-dashboard/monitoring/logs" className="group">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 group-hover:border-yellow-500 transition h-full flex flex-col items-center text-center">
            <Activity className="w-16 h-16 text-yellow-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h2 className="text-xl font-bold text-white mb-3">Registro Attività</h2>
            <p className="text-sm text-gray-400">
              Controlla la storia di ogni singolo contatto o le modifiche fatte dagli operatori.
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}
