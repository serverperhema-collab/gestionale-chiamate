"use client";

import { useState, useEffect } from "react";
import { Search, Filter, PhoneCall, Calendar, MapPin, User, FileSignature, AlertTriangle, Eye } from "lucide-react";
import TrattativaTimeline from "@/components/TrattativaTimeline";

interface TrattativeTableProps {
  type: "telefonica" | "appuntamento";
  stateGroup: "IN_GESTIONE" | "FIRMATE" | "KO";
  title: string;
}

export default function TrattativeTable({ type, stateGroup, title }: TrattativeTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [cap, setCap] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [commercialeId, setCommercialeId] = useState("");

  const [operators, setOperators] = useState<any[]>([]);
  const [commerciali, setCommerciali] = useState<any[]>([]);

  const [selectedTrattativa, setSelectedTrattativa] = useState<string | null>(null);

  useEffect(() => {
    // Fetch filter options
    Promise.all([
      fetch("/api/users?role=OPERATORE").then(res => res.json()),
      fetch("/api/users?role=COMMERCIALE").then(res => res.json())
    ]).then(([ops, comms]) => {
      if (ops.users) setOperators(ops.users);
      if (comms.users) setCommerciali(comms.users);
    }).catch(e => console.error("Error fetching filters", e));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        stateGroup,
        search,
        cap,
        operatorId,
        commercialeId
      });
      const res = await fetch(`/api/tl/advanced-negotiations?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.trattative);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [type, stateGroup, search, cap, operatorId, commercialeId]);

  const getStatusBadge = (status: string) => {
    if (status === "CHIUSA_VINTA") return <span className="px-2 py-1 text-xs font-bold rounded-md bg-green-500/20 text-green-400">Firmato</span>;
    if (status === "CHIUSA_PERSA") return <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-500/20 text-red-400">KO</span>;
    if (status === "APPUNTAMENTO") return <span className="px-2 py-1 text-xs font-bold rounded-md bg-blue-500/20 text-blue-400">Appuntamento</span>;
    if (status === "RICHIAMO_PERSONALE") return <span className="px-2 py-1 text-xs font-bold rounded-md bg-yellow-500/20 text-yellow-400">Richiamo</span>;
    return <span className="px-2 py-1 text-xs font-bold rounded-md bg-gray-500/20 text-gray-400">{status}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 bg-gray-950 border-b border-gray-800">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">{title}</h2>
        
        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cerca contatto o telefono..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filtra per CAP..." 
              value={cap}
              onChange={e => setCap(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={operatorId}
              onChange={e => setOperatorId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="">Tutti gli Operatori</option>
              {operators.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={commercialeId}
              onChange={e => setCommercialeId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="">Tutti i Commerciali</option>
              {commerciali.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-950/50 sticky top-0 z-10 shadow-sm border-b border-gray-800 text-xs uppercase font-black text-gray-500 tracking-wider">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Operatore</th>
              <th className="px-6 py-4">Commerciale</th>
              <th className="px-6 py-4">Ultimo Agg.</th>
              <th className="px-6 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Caricamento in corso...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nessuna trattativa trovata.</td></tr>
            ) : data.map((t) => (
              <tr key={t.id} className="hover:bg-gray-800/30 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{t.contact?.name || "Sconosciuto"}</div>
                  <div className="text-xs text-gray-500">{t.contact?.originalPhone} - {t.contact?.cap}</div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(t.status)}
                </td>
                <td className="px-6 py-4">
                  {t.currentOperator?.name || <span className="text-gray-600">-</span>}
                </td>
                <td className="px-6 py-4">
                  {t.currentCommerciale?.name || <span className="text-gray-600">-</span>}
                </td>
                <td className="px-6 py-4 text-xs">
                  {new Date(t.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedTrattativa(t.id)}
                    className="p-2 bg-gray-800 hover:bg-blue-600/20 text-gray-400 hover:text-blue-400 rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTrattativa && (
        <TrattativaTimeline 
          trattativaId={selectedTrattativa}
          onClose={() => {
            setSelectedTrattativa(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
