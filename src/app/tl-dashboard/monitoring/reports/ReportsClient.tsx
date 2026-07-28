"use client";

import { useState } from "react";
import { Download, Calendar, BarChart2, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import { exportToExcel } from "@/lib/exportUtils";

export default function ReportsClient({ operators, commercials }: { operators: any[], commercials: any[] }) {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExportOperators = async () => {
    if (!dateStart || !dateEnd) {
      toast.error("Seleziona una data di inizio e fine");
      return;
    }
    if (new Date(dateStart) > new Date(dateEnd)) {
      toast.error("Data inizio maggiore di data fine");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=operators&start=${dateStart}&end=${dateEnd}`);
      const data = await res.json();
      if (res.ok) {
        exportToExcel(data.report, `Report_Operatori_${dateStart}_${dateEnd}`);
        toast.success("Esportazione completata");
      } else {
        toast.error("Errore generazione report");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCommercials = async () => {
    if (!dateStart || !dateEnd) {
      toast.error("Seleziona una data di inizio e fine");
      return;
    }
    if (new Date(dateStart) > new Date(dateEnd)) {
      toast.error("Data inizio maggiore di data fine");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=commercials&start=${dateStart}&end=${dateEnd}`);
      const data = await res.json();
      if (res.ok) {
        exportToExcel(data.report, `Report_Commerciali_${dateStart}_${dateEnd}`);
        toast.success("Esportazione completata");
      } else {
        toast.error("Errore generazione report");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8 shadow-md">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
          Seleziona Periodo
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Da Data</label>
            <input 
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">A Data</label>
            <input 
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Users className="w-6 h-6 mr-3 text-emerald-400" />
              Report Operatori
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Esporta i dati completi sulle performance: totale contatti gestiti, skip, appuntamenti presi e conversion rate per ogni operatore nel periodo selezionato.
            </p>
          </div>
          <button 
            onClick={handleExportOperators}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-bold flex justify-center items-center disabled:opacity-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Scarica Report Operatori (.xlsx)
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-purple-400" />
              Report Commerciali
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Esporta il bilancio esiti: appuntamenti visitati, esiti positivi, esiti KO e tassi di conversione in chiusura per ogni commerciale.
            </p>
          </div>
          <button 
            onClick={handleExportCommercials}
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition font-bold flex justify-center items-center disabled:opacity-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Scarica Report Commerciali (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}
