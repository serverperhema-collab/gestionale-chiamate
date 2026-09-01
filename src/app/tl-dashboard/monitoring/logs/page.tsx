"use client";

import { useState, useEffect } from "react";
import { Activity, Search, User, Phone, ArrowLeft, Calendar, FileText, Snowflake, Download, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { exportToExcel } from "@/lib/exportUtils";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "USER" | "CONTACT">("ALL");
  const [filterValue, setFilterValue] = useState("");
  const [operators, setOperators] = useState<any[]>([]);
  
  // Dati dettagliati
  const [contactData, setContactData] = useState<any>(null);
    const [operatorLogs, setOperatorLogs] = useState<any[]>([]);
  const [detailModalContent, setDetailModalContent] = useState<{ action: string, details: string, contactInfo?: string, date?: string } | null>(null);

  const viewContactHistory = async (contactId: string) => {
    setFilterType("CONTACT");
    setFilterValue(contactId);
    setLoading(true);
    setContactData(null);
    try {
      const res = await fetch("/api/logs/contact/" + contactId);
      const data = await res.json();
      if (res.ok) {
        setContactData(data.contact);
      } else {
        toast.error(data.error || "Contatto non trovato");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setContactData(null);
    setOperatorLogs([]);
    
    try {
      if (filterType === "ALL") {
        const res = await fetch("/api/logs");
        const data = await res.json();
        if (res.ok) setLogs(data.logs);
      } else if (filterType === "CONTACT" && filterValue.trim() !== "") {
        const res = await fetch(`/api/logs/contact/${filterValue.trim()}`);
        const data = await res.json();
        if (res.ok) {
          setContactData(data.contact);
        } else {
          toast.error(data.error || "Contatto non trovato");
        }
      } else if (filterType === "USER" && filterValue.trim() !== "") {
        const res = await fetch(`/api/logs/operator/${filterValue.trim()}`);
        const data = await res.json();
        if (res.ok) {
          setOperatorLogs(data.logs);
        } else {
          toast.error(data.error || "Operatore non trovato");
        }
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carica operatori per il dropdown
    fetch("/api/users")
      .then(r => r.json())
      .then(d => setOperators((d.users || []).filter((u: any) => u.role === "OPERATORE")));
    if (filterType === "ALL") {
      fetchLogs();
    }
  }, [filterType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filterType !== "ALL" && !filterValue.trim()) {
      toast.error("Inserisci un ID per la ricerca");
      return;
    }
    fetchLogs();
  };

  return (
    <div className="flex-1">


      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <Activity className="w-6 h-6 mr-3 text-emerald-400" />
            Registro Attività (God Mode)
          </h2>
          <p className="text-gray-400 mt-1">
            Visualizza la "Storia del Contatto" o la "Storia dell'Operatore" esaminando i log di sistema.
          </p>
        </div>
        <button
          onClick={() => {
            if (filterType === "ALL" && logs.length > 0) {
              const exportData = logs.map(l => ({
                Data: new Date(l.createdAt).toLocaleString(),
                Operatore: l.user?.name || "Sistema",
                Azione: l.action,
                ContattoID: l.contact?.id || "",
                Telefono: l.contact?.originalPhone || "",
                Dettagli: l.details || ""
              }));
              exportToExcel(exportData, "Log_Globali");
            } else if (filterType === "USER" && operatorLogs && operatorLogs.length > 0) {
              const exportData = operatorLogs.map(l => ({
                Ora: new Date(l.createdAt).toLocaleTimeString(),
                Azione: l.action,
                Azienda: l.contact?.name || "",
                Dettagli: l.details || ""
              }));
              exportToExcel(exportData, `Log_Operatore_${filterValue}`);
            } else {
              toast.error("Nessun dato da esportare o vista non supportata");
            }
          }}
          className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition"
        >
          <Download className="w-4 h-4 mr-2 text-emerald-400" /> Esporta Tabella Excel
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8 shadow-md">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Tipo di Ricerca</label>
            <select 
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setFilterValue("");
                setContactData(null);
                setOperatorLogs([]);
                setLogs([]);
              }}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Ultimi 200 Eventi Globali</option>
              <option value="USER">Storia dell'Operatore (per ID Utente)</option>
              <option value="CONTACT">Storia del Contatto (per ID Contatto)</option>
            </select>
          </div>
          {filterType !== "ALL" && (
            <div className="flex-[2]">
              {filterType === "USER" ? (
                <>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Seleziona Operatore</label>
                  <div className="flex">
                    <select
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Seleziona un operatore --</option>
                      {operators.map((op: any) => (
                        <option key={op.id} value={op.id}>{op.name} ({op.username})</option>
                      ))}
                    </select>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-r-lg transition font-medium flex items-center"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Cerca
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-400 mb-2">ID Contatto (da URL o copia dalla tabella)</label>
                  <div className="flex">
                    <input 
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Es. cm1abc123..."
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-l-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-r-lg transition font-medium flex items-center"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Cerca
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* VISTA ALL LOGS */}
          {filterType === "ALL" && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Data e Ora</th>
                    <th className="p-4">Operatore</th>
                    <th className="p-4">Azione</th>
                    <th className="p-4">Contatto</th>
                    <th className="p-4">Dettagli</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition text-sm">
                      <td className="p-4 text-gray-300 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-white flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {log.user?.name || "Sistema"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded font-mono text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 font-mono text-xs">
                        {log.contact ? (
                           <span title={log.contact.id} className="flex items-center">
                             <Phone className="w-3 h-3 mr-1" />
                             {log.contact.originalPhone || log.contact.id.substring(0, 8) + "..."}
                           </span>
                        ) : "-"}
                      </td>
                                            <td className="p-4 text-gray-400 max-w-xs">
                        <div className="flex items-center justify-between">
                            <span className="truncate mr-2">{log.details || "-"}</span>
                            {log.details && (
                                <button onClick={() => setDetailModalContent({ action: log.action, details: log.details, contactInfo: log.contact?.originalPhone || log.contact?.name, date: new Date(log.createdAt).toLocaleString() })} className="text-gray-400 hover:text-white px-2 py-1 bg-gray-700/50 hover:bg-gray-700 rounded text-xs transition whitespace-nowrap">
                                    Vedi Info
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nessun log trovato.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA CONTATTO */}
          {filterType === "CONTACT" && contactData && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" /> Dettagli Azienda
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div><span className="text-gray-400 block">Ragione Sociale</span><span className="font-medium text-white">{contactData.name || "N/A"}</span></div>
                  <div><span className="text-gray-400 block">Telefono</span><span className="font-medium text-white">{contactData.originalPhone || "N/A"}</span></div>
                  <div><span className="text-gray-400 block">CAP</span><span className="font-medium text-white">{contactData.cap || "N/A"}</span></div>
                  <div><span className="text-gray-400 block">Status KO</span><span className="font-medium text-white">{contactData.isKo ? <span className="text-red-400">SI</span> : "NO"}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-emerald-400" /> Storico Attività
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {contactData.activityLogs?.map((log: any) => (
                      <div key={log.id} className="bg-gray-900 rounded p-3 border border-gray-700 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-blue-400">{log.user?.name || "Sistema"}</span>
                          <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-white font-mono text-xs mb-1">{log.action}</div>
                        {log.details && <div className="text-gray-400 text-xs">{log.details}</div>}
                      </div>
                    ))}
                    {contactData.activityLogs?.length === 0 && <p className="text-gray-500 text-sm">Nessuna attività registrata.</p>}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-400" /> Appuntamenti & KO
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {contactData.appointments?.map((app: any) => (
                      <div key={app.id} className="bg-purple-900/20 rounded p-3 border border-purple-500/30 text-sm mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-purple-400">App. {new Date(app.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{app.status}</span>
                        </div>
                        <div className="text-gray-300 text-xs mt-1">Op: {app.operator?.name} &rarr; Comm: {app.commerciale?.name}</div>
                        {app.outcomes?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-purple-500/20 text-xs">
                            <span className="text-purple-300 font-semibold">Esito:</span> {app.outcomes[0].esito}
                          </div>
                        )}
                      </div>
                    ))}
                    {contactData.koRecords?.map((ko: any) => (
                      <div key={ko.id} className="bg-red-900/20 rounded p-3 border border-red-500/30 text-sm mb-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-red-400 flex items-center"><Snowflake className="w-3 h-3 mr-1"/> Sezione KO</span>
                          <span className="text-xs text-gray-400">{new Date(ko.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-gray-300 text-xs mt-1">Risolto (Sbloccato): {ko.isResolved ? "SI" : "NO"}</div>
                      </div>
                    ))}
                    {contactData.appointments?.length === 0 && contactData.koRecords?.length === 0 && (
                      <p className="text-gray-500 text-sm">Nessun appuntamento o storico KO.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA OPERATORE */}
          {filterType === "USER" && operatorLogs && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
              <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" /> Ruolino di Marcia Operatore (Oggi)
                </h3>
                <span className="text-sm text-gray-400">Totale Azioni: {operatorLogs.length}</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Ora</th>
                    <th className="p-4">Azione</th>
                    <th className="p-4">Azienda / Contatto</th>
                    <th className="p-4">Dettagli</th>
                  </tr>
                </thead>
                <tbody>
                  {operatorLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-750 transition text-sm">
                      <td className="p-4 text-gray-300 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-700 text-emerald-300 rounded font-mono text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">
                        {log.contact?.name || "-"}
                      </td>
                                            <td className="p-4 text-gray-400 max-w-xs">
                        <div className="flex items-center justify-between">
                            <span className="truncate mr-2">{log.details || "-"}</span>
                            {log.details && (
                                <button onClick={() => setDetailModalContent({ action: log.action, details: log.details, contactInfo: log.contact?.originalPhone || log.contact?.name, date: new Date(log.createdAt).toLocaleString() })} className="text-gray-400 hover:text-white px-2 py-1 bg-gray-700/50 hover:bg-gray-700 rounded text-xs transition whitespace-nowrap">
                                    Vedi Info
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {operatorLogs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nessuna attività registrata oggi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* MODAL DETTAGLI AZIONE */}
      {detailModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Dettaglio Azione
              </h3>
              <button onClick={() => setDetailModalContent(null)} className="text-gray-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Azione</span>
                <div className="mt-1 font-mono text-emerald-400 bg-gray-950 p-2 rounded border border-gray-800">{detailModalContent.action}</div>
              </div>
              {detailModalContent.contactInfo && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Contatto Coinvolto</span>
                  <div className="mt-1 text-gray-300 font-medium">{detailModalContent.contactInfo}</div>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Data e Ora</span>
                <div className="mt-1 text-gray-300">{detailModalContent.date}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Descrizione Completa</span>
                <div className="mt-1 text-gray-200 bg-gray-800 p-3 rounded-lg border border-gray-700 whitespace-pre-wrap text-sm leading-relaxed max-h-64 overflow-y-auto">
                  {detailModalContent.details}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-800 text-right">
              <button onClick={() => setDetailModalContent(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


