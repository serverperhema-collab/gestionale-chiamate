"use client";

import { useState } from "react";
import { Calendar, Printer, Download, ArrowLeft, BarChart2, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface OperatorData {
  id: string;
  name: string;
  stats: {
    skip: number;
    noAnswer: number;
    notAvailable: number;
    nonInteressato: number;
    noInfo: number;
    trashRequest: number;
    reviewRequest: number;
    negotiation: number;
    appt: number;
    enrichment: number;
    logins: number;
    minutesOn: number;
    daysWorked: number;
  };
}

export default function ReportClient({ operators }: { operators: { id: string, name: string }[] }) {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selectedOps, setSelectedOps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<OperatorData[] | null>(null);

  const handleToggleOp = (id: string) => {
    if (selectedOps.includes(id)) {
      setSelectedOps(selectedOps.filter(op => op !== id));
    } else {
      setSelectedOps([...selectedOps, id]);
    }
  };

  const selectAll = () => {
    if (selectedOps.length === operators.length) {
      setSelectedOps([]);
    } else {
      setSelectedOps(operators.map(o => o.id));
    }
  };

  const handleGenerate = async () => {
    if (!dateStart || !dateEnd) {
      toast.error("Seleziona una data di inizio e fine");
      return;
    }
    if (new Date(dateStart) > new Date(dateEnd)) {
      toast.error("La data di inizio non può essere successiva alla data di fine");
      return;
    }
    if (selectedOps.length === 0) {
      toast.error("Seleziona almeno un operatore");
      return;
    }

    setLoading(true);
    try {
      const opsParam = selectedOps.length === operators.length ? "ALL" : selectedOps.join(",");
      const res = await fetch(`/api/tl/live-monitor/report?start=${dateStart}&end=${dateEnd}&operators=${opsParam}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data.report);
      } else {
        toast.error(data.error || "Errore generazione report");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header, hidden on print */}
      <div className="print:hidden">
        <div className="mb-6">
          <Link href="/tl-dashboard/monitoring/live" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al Monitor Live
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
          <BarChart2 className="w-8 h-8 mr-3 text-blue-500" />
          Report Storico Attività Operatori
        </h1>
        <p className="text-gray-400 mt-2">
          Genera e stampa un report dettagliato con i totali di sala e le performance cumulative per il periodo selezionato.
        </p>
      </div>

      {/* Filters, hidden on print */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 print:hidden shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
          Configurazione Report
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Periodo</label>
            <div className="flex space-x-4">
              <input 
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <input 
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-400">Operatori da Includere</label>
              <button onClick={selectAll} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                {selectedOps.length === operators.length ? "Deseleziona Tutti" : "Seleziona Tutti"}
              </button>
            </div>
            <div className="bg-gray-900 border border-gray-600 rounded-lg max-h-32 overflow-y-auto p-2 grid grid-cols-2 gap-2">
              {operators.map(op => (
                <div key={op.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 p-1 rounded" onClick={() => handleToggleOp(op.id)}>
                  {selectedOps.includes(op.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-300 select-none">{op.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center shadow disabled:opacity-50 transition"
          >
            {loading ? "Generazione..." : "Genera Report"}
          </button>
        </div>
      </div>

      {/* Report View */}
      {reportData && (
        <div className="bg-white text-black p-8 rounded-xl print:p-0 print:shadow-none shadow-xl print:m-0 w-full overflow-x-auto print:overflow-visible">
          <div className="flex justify-between items-start border-b pb-6 mb-6 border-gray-200 min-w-max print:min-w-0">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight print:text-2xl">REPORT ATTIVITÀ</h2>
              <p className="text-gray-500 font-medium mt-1">
                Periodo: {new Date(dateStart).toLocaleDateString('it-IT')} - {new Date(dateEnd).toLocaleDateString('it-IT')}
              </p>
            </div>
            <div className="print:hidden">
              <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition shadow">
                <Printer className="w-5 h-5 mr-2" />
                Stampa / PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse mb-8 min-w-max print:min-w-0 print:text-[10px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm print:text-[10px] uppercase tracking-wider font-bold border-b-2 border-gray-300">
                  <th className="p-3 print:p-1">Operatore</th>
                  <th className="p-3 print:p-1 text-center">Giorni Lav.</th>
                  <th className="p-3 print:p-1 text-center">Ore Totali</th>
                  <th className="p-3 print:p-1 text-center">Logins</th>
                  <th className="p-3 print:p-1 text-center text-blue-700">Tot. Contatti</th>
                  <th className="p-3 print:p-1 text-center text-emerald-700">Ritmo</th>
                  <th className="p-3 print:p-1 text-center">Skip</th>
                  <th className="p-3 print:p-1 text-center">Non Rep.</th>
                  <th className="p-3 print:p-1 text-center">Non Risp.</th>
                  <th className="p-3 print:p-1 text-center">No Info</th>
                  <th className="p-3 print:p-1 text-center">Non Int.</th>
                  <th className="p-3 print:p-1 text-center">Cestino</th>
                  <th className="p-3 print:p-1 text-center">Sblocco</th>
                  <th className="p-3 print:p-1 text-center">Trattative</th>
                  <th className="p-3 print:p-1 text-center text-green-700">Appunt.</th>
                  <th className="p-3 print:p-1 text-center">Integrazioni</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.map((op, i) => {
                const ore = Math.floor(op.stats.minutesOn / 60);
                const min = op.stats.minutesOn % 60;
                
                const totContacts = op.stats.skip + op.stats.noAnswer + op.stats.notAvailable + op.stats.nonInteressato + op.stats.noInfo + op.stats.trashRequest + op.stats.reviewRequest + op.stats.negotiation + op.stats.appt;
                const ritmo = totContacts > 0 ? Math.floor(op.stats.minutesOn / totContacts) : 0;
                const ritmoText = totContacts > 0 ? `1 / ${ritmo}m` : "-";

                return (
                  <tr key={op.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 print:p-1 font-bold text-gray-900">{op.name}</td>
                    <td className="p-3 print:p-1 text-center font-medium text-gray-600">{op.stats.daysWorked}</td>
                    <td className="p-3 print:p-1 text-center font-mono font-medium">{ore}h {min}m</td>
                    <td className="p-3 print:p-1 text-center text-gray-700">{op.stats.logins}</td>
                    <td className="p-3 print:p-1 text-center text-blue-700 font-bold">{totContacts}</td>
                    <td className="p-3 print:p-1 text-center text-emerald-700 font-mono font-bold">{ritmoText}</td>
                    <td className="p-3 print:p-1 text-center text-gray-700">{op.stats.skip}</td>
                    <td className="p-3 print:p-1 text-center text-orange-600">{op.stats.notAvailable}</td>
                    <td className="p-3 print:p-1 text-center text-red-500">{op.stats.noAnswer}</td>
                    <td className="p-3 print:p-1 text-center text-gray-500">{op.stats.noInfo}</td>
                    <td className="p-3 print:p-1 text-center text-red-700">{op.stats.nonInteressato}</td>
                    <td className="p-3 print:p-1 text-center text-rose-600">{op.stats.trashRequest}</td>
                    <td className="p-3 print:p-1 text-center text-amber-600">{op.stats.reviewRequest}</td>
                    <td className="p-3 print:p-1 text-center font-semibold text-yellow-600">{op.stats.negotiation}</td>
                    <td className="p-3 print:p-1 text-center font-bold text-green-600">{op.stats.appt}</td>
                    <td className="p-3 print:p-1 text-center text-gray-700">{op.stats.enrichment}</td>
                  </tr>
                );
              })}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={16} className="p-8 text-center text-gray-500 font-medium">
                    Nessun dato trovato per il periodo e gli operatori selezionati.
                  </td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
                <tfoot className="bg-gray-900 text-white font-bold">
                  <tr>
                    <td className="p-3 print:p-1 uppercase">Totali di Sala</td>
                    <td className="p-3 print:p-1 text-center">{reportData.reduce((acc, op) => acc + op.stats.daysWorked, 0)}</td>
                    <td className="p-3 print:p-1 text-center font-mono">
                      {(() => {
                        const totMins = reportData.reduce((acc, op) => acc + op.stats.minutesOn, 0);
                        return `${Math.floor(totMins / 60)}h ${totMins % 60}m`;
                      })()}
                    </td>
                    <td className="p-3 print:p-1 text-center">{reportData.reduce((acc, op) => acc + op.stats.logins, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-blue-400">
                      {reportData.reduce((acc, op) => acc + (op.stats.skip + op.stats.noAnswer + op.stats.notAvailable + op.stats.nonInteressato + op.stats.noInfo + op.stats.trashRequest + op.stats.reviewRequest + op.stats.negotiation + op.stats.appt), 0)}
                    </td>
                    <td className="p-3 print:p-1 text-center text-emerald-400">-</td>
                    <td className="p-3 print:p-1 text-center">{reportData.reduce((acc, op) => acc + op.stats.skip, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-orange-400">{reportData.reduce((acc, op) => acc + op.stats.notAvailable, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-red-400">{reportData.reduce((acc, op) => acc + op.stats.noAnswer, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-gray-400">{reportData.reduce((acc, op) => acc + op.stats.noInfo, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-red-600">{reportData.reduce((acc, op) => acc + op.stats.nonInteressato, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-rose-500">{reportData.reduce((acc, op) => acc + op.stats.trashRequest, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-amber-500">{reportData.reduce((acc, op) => acc + op.stats.reviewRequest, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-yellow-400">{reportData.reduce((acc, op) => acc + op.stats.negotiation, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-green-400">{reportData.reduce((acc, op) => acc + op.stats.appt, 0)}</td>
                    <td className="p-3 print:p-1 text-center text-purple-400">{reportData.reduce((acc, op) => acc + op.stats.enrichment, 0)}</td>
                  </tr>
                </tfoot>
            )}
            </table>
          </div>

          <div className="text-center text-gray-400 text-xs mt-12 print:block border-t pt-4 min-w-max print:min-w-0">
            Generato dal Gestionale Estrazioni - {new Date().toLocaleString('it-IT')}
          </div>
        </div>
      )}
    </div>
  );
}
