"use client";

import { useState, useEffect } from "react";
import { Trash2, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Users, CalendarX } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Tab = "CONTATTI" | "APPUNTAMENTI";

export default function DeletionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("CONTATTI");
  const [deletions, setDeletions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDeletions = async () => {
    try {
      const res = await fetch("/api/tl/deletions");
      const data = await res.json();
      if (res.ok) {
        setDeletions(data.deletions);
      } else {
        toast.error(data.error || "Errore di caricamento contatti");
      }
    } catch (error) {
      toast.error("Errore di rete (Contatti)");
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/tl/deletions/appointments");
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.error || "Errore di caricamento appuntamenti");
      }
    } catch (error) {
      toast.error("Errore di rete (Appuntamenti)");
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDeletions(), fetchAppointments()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/tl/deletions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        toast.success(action === "APPROVE" ? "Richiesta approvata (Contatto in KO)" : "Richiesta rifiutata (Contatto ripristinato)");
        setDeletions(deletions.filter(d => d.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Errore");
      }
    } catch (e) {
      toast.error("Errore di rete");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-1 gap-8">
      {/* SIDE MENU */}
      <div className="w-64 flex-shrink-0">
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden sticky top-8">
            <button
              onClick={() => setActiveTab("CONTATTI")}
              className={`w-full flex items-center p-4 text-left transition ${activeTab === "CONTATTI" ? "bg-red-900/30 text-red-400 border-l-4 border-red-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"}`}
            >
              <Users className="w-5 h-5 mr-3" />
              <div>
                <div className="font-semibold text-sm">Contatti (Fasulli)</div>
                <div className="text-xs opacity-70 mt-0.5">{deletions.length} da valutare</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("APPUNTAMENTI")}
              className={`w-full flex items-center p-4 text-left transition ${activeTab === "APPUNTAMENTI" ? "bg-red-900/30 text-red-400 border-l-4 border-red-500" : "text-gray-400 hover:bg-gray-700 hover:text-white border-l-4 border-transparent border-t border-t-gray-700"}`}
            >
              <CalendarX className="w-5 h-5 mr-3" />
              <div>
                <div className="font-semibold text-sm">Appuntamenti</div>
                <div className="text-xs opacity-70 mt-0.5">{appointments.length} annullati</div>
              </div>
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === "CONTATTI" ? (
            /* TAB CONTATTI */
            deletions.length === 0 ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nessuna richiesta in sospeso</h3>
                <p className="text-gray-400">Ottimo lavoro! Nessun contatto da eliminare.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {deletions.map((del) => (
                  <div key={del.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg relative flex flex-col">
                    <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1">{del.contact.name}</h3>
                        <p className="text-sm text-gray-400 font-mono">{del.contact.originalPhone || "Nessun numero"}</p>
                        <p className="text-xs text-gray-500 mt-1">{del.contact.address || ""} {del.contact.cap}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6 flex-1">
                      <div className="flex items-center text-sm text-red-400 font-semibold mb-2">
                        <AlertTriangle className="w-4 h-4 mr-1.5" />
                        Motivazione Operatore:
                      </div>
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 italic">
                        "{del.reason}"
                      </div>
                      <div className="text-xs text-gray-500 mt-3 text-right">
                        Richiesto da: <span className="font-semibold text-gray-300">{del.operatorName}</span>
                        <br />
                        Data: {new Date(del.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => handleAction(del.id, "REJECT")}
                        disabled={processingId === del.id}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Rifiuta (Ripristina)
                      </button>
                      <button
                        onClick={() => handleAction(del.id, "APPROVE")}
                        disabled={processingId === del.id}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition font-medium text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approva (Manda KO)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* TAB APPUNTAMENTI */
            appointments.length === 0 ? (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center shadow-lg">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nessun Appuntamento Annullato</h3>
                <p className="text-gray-400">Non ci sono appuntamenti nel cestino.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {appointments.map((app) => (
                  <div key={app.id} className="bg-gray-800 rounded-xl border border-red-900/50 p-6 shadow-lg relative flex flex-col">
                    <div className="absolute top-4 right-4 bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded font-bold border border-red-500/20">
                      ANNULLATO
                    </div>
                    <div className="flex items-start justify-between mb-4 border-b border-gray-700 pb-4">
                      <div className="pr-24">
                        <h3 className="font-bold text-lg text-white mb-1 leading-tight">{app.contact?.name || "Sconosciuto"}</h3>
                        <p className="text-sm text-gray-400 font-mono">{app.contact?.originalPhone || "Nessun numero"}</p>
                        <p className="text-xs text-gray-500 mt-1">{app.contact?.address || ""} {app.contact?.cap}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4 flex-1 space-y-3">
                      <div className="text-sm">
                        <span className="text-gray-500">Operatore:</span> <span className="text-gray-300 font-medium">{app.operator?.name || "N/D"}</span>
                      </div>
                      <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3 text-sm">
                        <div className="text-red-400 font-semibold mb-1 flex items-center">
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Note Annullamento (TL):
                        </div>
                        <div className="text-gray-300 italic">
                          {app.tlNotes || "Nessuna nota specificata."}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-auto text-right pt-4 border-t border-gray-700">
                      Annullato il: {new Date(app.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
  );
}
